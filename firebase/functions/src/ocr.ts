import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import vision from '@google-cloud/vision';

const db = admin.firestore();

// Initialize Google Cloud Vision client
const visionClient = new vision.ImageAnnotatorClient();

/**
 * OCR Analysis Cloud Function
 * Triggers when a product image is uploaded to Storage
 * Performs OCR and analyzes ingredients for additives
 */
export const analyzeProductImage = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;

    // Only process images
    if (!contentType || !contentType.startsWith('image/')) {
      console.log('Not an image, skipping...');
      return null;
    }

    // Skip if already processed
    if (filePath && filePath.includes('_processed')) {
      console.log('Already processed, skipping...');
      return null;
    }

    try {
      const bucket = admin.storage().bucket(object.bucket);
      const file = bucket.file(filePath!);

      console.log(`Processing image: ${filePath}`);

      // Perform OCR using Google Cloud Vision
      const [result] = await visionClient.textDetection(`gs://${object.bucket}/${filePath}`);
      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        console.log('No text detected in image');
        return null;
      }

      // Extract full text
      const fullText = detections[0].description || '';
      console.log('Detected text:', fullText);

      // Extract ingredients
      const ingredients = extractIngredients(fullText);
      console.log('Extracted ingredients:', ingredients);

      // Analyze additives
      const analysis = analyzeAdditives(ingredients);
      console.log('Analysis result:', analysis);

      // Save to Firestore
      const analysisDoc = await db.collection('analyses').add({
        imageUrl: `gs://${object.bucket}/${filePath}`,
        fullText,
        ingredients,
        additives: analysis.additives,
        status: analysis.status,
        totalAdditives: analysis.totalAdditives,
        dangerousCount: analysis.dangerousCount,
        cautionCount: analysis.cautionCount,
        recommendations: analysis.recommendations,
        analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
        analyzedBy: 'cloud-function',
      });

      console.log(`Analysis saved with ID: ${analysisDoc.id}`);

      return { success: true, analysisId: analysisDoc.id };
    } catch (error) {
      console.error('Error processing image:', error);
      throw new functions.https.HttpsError('internal', 'Failed to process image');
    }
  });

/**
 * HTTP Callable Function for immediate OCR analysis
 * Can be called directly from client apps
 */
export const analyzeImageHTTP = functions.https.onCall(async (data, context) => {
  const { imageUrl } = data;

  if (!imageUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'Image URL is required');
  }

  try {
    console.log(`Analyzing image: ${imageUrl}`);

    // Perform OCR
    const [result] = await visionClient.textDetection(imageUrl);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return {
        success: true,
        fullText: '',
        ingredients: [],
        additives: [],
        status: 'green',
        analysis: {
          totalAdditives: 0,
          dangerousCount: 0,
          cautionCount: 0,
        },
      };
    }

    const fullText = detections[0].description || '';
    const ingredients = extractIngredients(fullText);
    const analysis = analyzeAdditives(ingredients);

    return {
      success: true,
      fullText,
      ingredients,
      additives: analysis.additives,
      status: analysis.status,
      analysis: {
        totalAdditives: analysis.totalAdditives,
        dangerousCount: analysis.dangerousCount,
        cautionCount: analysis.cautionCount,
      },
      recommendations: analysis.recommendations,
    };
  } catch (error) {
    console.error('Error in OCR analysis:', error);
    throw new functions.https.HttpsError('internal', 'OCR analysis failed');
  }
});

/**
 * Extract ingredients from OCR text
 */
function extractIngredients(text: string): string[] {
  // Common Turkish ingredient list markers
  const markers = [
    'içindekiler',
    'icerik',
    'içerik',
    'ingredients',
    'composition',
    'malzemeler',
  ];

  const lowerText = text.toLowerCase();
  let startIndex = -1;

  // Find the start of ingredients list
  for (const marker of markers) {
    const index = lowerText.indexOf(marker);
    if (index !== -1) {
      startIndex = index + marker.length;
      break;
    }
  }

  if (startIndex === -1) {
    // If no marker found, assume entire text is ingredients
    startIndex = 0;
  }

  // Extract ingredients text
  const ingredientsText = text.substring(startIndex);

  // Split by common separators
  const ingredients = ingredientsText
    .split(/[,;:\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length < 100) // Filter out empty or too long items
    .slice(0, 50); // Limit to 50 ingredients

  return ingredients;
}

/**
 * Analyze ingredients for food additives
 */
function analyzeAdditives(ingredients: string[]) {
  const dangerousAdditives = [
    'E102', 'E104', 'E110', 'E122', 'E123', 'E124', 'E127', 'E128', 'E129',
    'E142', 'E151', 'E154', 'E155', 'E180', 'E214', 'E215', 'E216', 'E217',
    'E218', 'E219', 'E220', 'E221', 'E222', 'E223', 'E224', 'E226', 'E227',
    'E228', 'E230', 'E231', 'E232', 'E233', 'E239', 'E249', 'E250', 'E251',
    'E252', 'E280', 'E281', 'E282', 'E283', 'E310', 'E311', 'E312', 'E319',
    'E320', 'E321', 'E385', 'E621', 'E622', 'E623', 'E624', 'E625', 'E627',
    'E628', 'E629', 'E630', 'E631', 'E632', 'E633', 'E634', 'E635', 'E951',
    'E952', 'E954',
  ];

  const cautionAdditives = [
    'E100', 'E101', 'E103', 'E105', 'E106', 'E107', 'E120', 'E121', 'E125',
    'E126', 'E130', 'E131', 'E132', 'E133', 'E140', 'E141', 'E143', 'E150',
    'E152', 'E153', 'E160', 'E161', 'E162', 'E163', 'E170', 'E171', 'E172',
    'E173', 'E174', 'E175', 'E200', 'E201', 'E202', 'E203', 'E210', 'E211',
    'E212', 'E213', 'E234', 'E235', 'E236', 'E237', 'E238', 'E240', 'E242',
    'E260', 'E261', 'E262', 'E263', 'E270', 'E290', 'E296', 'E297', 'E950',
    'E953', 'E955', 'E957', 'E959', 'E960', 'E961', 'E962', 'E965', 'E966',
    'E967',
  ];

  const additives: any[] = [];
  let dangerousCount = 0;
  let cautionCount = 0;

  // Search for E-numbers in ingredients
  for (const ingredient of ingredients) {
    const eNumberMatch = ingredient.match(/E\d{3,4}/gi);

    if (eNumberMatch) {
      for (const eNumber of eNumberMatch) {
        const normalized = eNumber.toUpperCase();

        if (dangerousAdditives.includes(normalized)) {
          additives.push({
            code: normalized,
            name: ingredient,
            category: 'avoid',
            found: true,
          });
          dangerousCount++;
        } else if (cautionAdditives.includes(normalized)) {
          additives.push({
            code: normalized,
            name: ingredient,
            category: 'caution',
            found: true,
          });
          cautionCount++;
        } else {
          additives.push({
            code: normalized,
            name: ingredient,
            category: 'safe',
            found: true,
          });
        }
      }
    }
  }

  // Determine overall status
  let status: 'green' | 'yellow' | 'red' = 'green';
  const recommendations: string[] = [];

  if (dangerousCount > 0) {
    status = 'red';
    recommendations.push('Bu ürün tehlikeli katkı maddeleri içermektedir.');
    recommendations.push('Tüketiminden kaçınmanızı öneririz.');
    recommendations.push('Yakınınızdaki katkısız alternatif ürünlere bakın.');
  } else if (cautionCount > 0 || additives.length > 0) {
    status = 'yellow';
    recommendations.push('Bu ürün dikkat gerektiren katkı maddeleri içermektedir.');
    recommendations.push('Aşırı tüketimden kaçının.');
  } else {
    recommendations.push('Bu ürün katkı maddesi içermemektedir.');
    recommendations.push('Güvenle tüketebilirsiniz.');
  }

  return {
    additives,
    status,
    totalAdditives: additives.length,
    dangerousCount,
    cautionCount,
    recommendations,
  };
}
