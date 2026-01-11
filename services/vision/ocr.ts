import { AppConfig } from '../../constants/config';

interface VisionAPIResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      locale?: string;
    }>;
    fullTextAnnotation?: {
      text: string;
    };
    error?: {
      message: string;
    };
  }>;
}

/**
 * Perform OCR on an image using Google Cloud Vision API
 */
export const performOCR = async (imageBase64: string): Promise<string> => {
  try {
    const apiKey = AppConfig.vision.apiKey;

    if (!apiKey) {
      throw new Error('Google Vision API key not configured');
    }

    const requestBody = {
      requests: [
        {
          image: {
            content: imageBase64,
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION',
              maxResults: 1,
            },
          ],
          imageContext: {
            languageHints: ['tr', 'en'], // Turkish and English
          },
        },
      ],
    };

    const response = await fetch(
      `${AppConfig.vision.endpoint}?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OCR request failed');
    }

    const data: VisionAPIResponse = await response.json();

    if (data.responses[0].error) {
      throw new Error(data.responses[0].error.message);
    }

    // Extract full text
    const fullText =
      data.responses[0].fullTextAnnotation?.text ||
      data.responses[0].textAnnotations?.[0]?.description ||
      '';

    if (!fullText) {
      throw new Error('No text detected in image');
    }

    return fullText;
  } catch (error: any) {
    console.error('OCR Error:', error);
    throw new Error(error.message || 'Failed to perform OCR');
  }
};

/**
 * Convert image URI to base64
 */
export const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error('Failed to convert image to base64');
  }
};

/**
 * Extract ingredients section from OCR text
 */
export const extractIngredients = (text: string): string[] => {
  // Common Turkish ingredient section markers
  const markers = [
    'içindekiler',
    'içerik',
    'ingredients',
    'içerikler',
    'bileşenler',
    'malzemeler',
  ];

  const lowerText = text.toLowerCase();

  // Find the start of ingredients section
  let startIndex = -1;
  for (const marker of markers) {
    const index = lowerText.indexOf(marker);
    if (index !== -1) {
      startIndex = index + marker.length;
      break;
    }
  }

  if (startIndex === -1) {
    // If no marker found, use the whole text
    startIndex = 0;
  }

  // Extract text after the marker
  let ingredientText = text.substring(startIndex);

  // Clean up the text
  ingredientText = ingredientText
    .replace(/\n/g, ' ') // Remove line breaks
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Split by common separators
  const ingredients = ingredientText
    .split(/[,;]/)
    .map((ing) => ing.trim())
    .filter((ing) => ing.length > 0 && ing.length < 100); // Filter out too short or too long

  return ingredients;
};

/**
 * Clean and normalize ingredient text
 */
export const normalizeIngredient = (ingredient: string): string => {
  return ingredient
    .toLowerCase()
    .trim()
    .replace(/[()[\]]/g, '') // Remove brackets
    .replace(/\s+/g, ' '); // Normalize whitespace
};
