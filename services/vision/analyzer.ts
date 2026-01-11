import { ProductStatus, Additive, AdditiveCategory } from '../../types';
import {
  ADDITIVES_DATABASE,
  getAdditiveByCode,
  isDangerousAdditive,
  isCautionAdditive,
  INGREDIENT_ALIASES,
  ADDITIVE_KEYWORDS,
} from '../../constants/additives';
import { normalizeIngredient } from './ocr';

export interface AnalysisResult {
  status: ProductStatus;
  additives: Additive[];
  ingredients: string[];
  analysis: {
    totalAdditives: number;
    dangerousCount: number;
    cautionCount: number;
    safeCount: number;
  };
  recommendations?: string[];
}

/**
 * Analyze ingredients and detect additives
 */
export const analyzeIngredients = (ingredients: string[]): AnalysisResult => {
  const detectedAdditives: Additive[] = [];
  const processedIngredients = ingredients.map(normalizeIngredient);

  // Step 1: Detect E-numbers (E621, E330, etc.)
  for (const ingredient of processedIngredients) {
    const eNumberMatch = ingredient.match(/e\s*(\d{3,4}[a-z]?)/i);

    if (eNumberMatch) {
      const eNumber = 'E' + eNumberMatch[1].toUpperCase();
      const additiveData = getAdditiveByCode(eNumber);

      if (additiveData) {
        detectedAdditives.push({
          code: additiveData.code,
          name: additiveData.name,
          category: additiveData.category,
          description: additiveData.description,
          healthImpact: additiveData.healthConcerns,
        });
      } else {
        // Unknown E-number, mark as caution
        detectedAdditives.push({
          code: eNumber,
          name: 'Bilinmeyen Katkı Maddesi',
          category: 'caution',
          description: 'Bu katkı maddesi hakkında bilgi bulunamadı.',
        });
      }
    }
  }

  // Step 2: Detect additive names without E-numbers
  for (const ingredient of processedIngredients) {
    for (const [alias, eNumber] of Object.entries(INGREDIENT_ALIASES)) {
      if (ingredient.includes(alias)) {
        const additiveData = getAdditiveByCode(eNumber);
        if (additiveData) {
          // Check if not already added
          const alreadyAdded = detectedAdditives.some((a) => a.code === eNumber);
          if (!alreadyAdded) {
            detectedAdditives.push({
              code: additiveData.code,
              name: additiveData.name,
              category: additiveData.category,
              description: additiveData.description,
              healthImpact: additiveData.healthConcerns,
            });
          }
        }
      }
    }
  }

  // Step 3: Detect generic additive keywords
  for (const ingredient of processedIngredients) {
    for (const keyword of ADDITIVE_KEYWORDS) {
      if (ingredient.includes(keyword)) {
        // Check if this isn't already detected
        const alreadyDetected = detectedAdditives.some((a) =>
          a.name.toLowerCase().includes(keyword)
        );

        if (!alreadyDetected) {
          // Generic additive detected
          detectedAdditives.push({
            code: 'GENERIC',
            name: `Genel Katkı Maddesi: ${keyword}`,
            category: 'caution',
            description: 'Spesifik katkı maddesi tespit edilemedi ancak genel anahtar kelime bulundu.',
          });
        }
      }
    }
  }

  // Step 4: Calculate status
  const analysis = {
    totalAdditives: detectedAdditives.length,
    dangerousCount: detectedAdditives.filter((a) => a.category === 'avoid').length,
    cautionCount: detectedAdditives.filter((a) => a.category === 'caution').length,
    safeCount: detectedAdditives.filter((a) => a.category === 'safe').length,
  };

  let status: ProductStatus;

  // CRITICAL RULE: ANY additive = at least yellow
  if (analysis.totalAdditives === 0) {
    status = 'green'; // ONLY green if zero additives
  } else if (analysis.dangerousCount > 0) {
    status = 'red'; // Any dangerous additive = red
  } else {
    status = 'yellow'; // Has additives but none dangerous = yellow
  }

  // Step 5: Generate recommendations
  const recommendations: string[] = [];

  if (status === 'red') {
    recommendations.push('Bu üründe tehlikeli katkı maddeleri tespit edildi.');
    recommendations.push('Sağlığınız için bu ürünü tüketmemenizi öneriyoruz.');
    recommendations.push('Harita üzerinden yakınınızdaki katkısız alternatiflere göz atın.');
  } else if (status === 'yellow') {
    recommendations.push('Bu üründe orta düzey katkı maddeleri bulunmaktadır.');
    recommendations.push('Mümkünse daha doğal alternatifler tercih edin.');
  } else {
    recommendations.push('Harika! Bu ürün katkı maddesi içermiyor.');
    recommendations.push('Sağlıklı beslenme için doğru seçim yaptınız.');
  }

  return {
    status,
    additives: detectedAdditives,
    ingredients: processedIngredients,
    analysis,
    recommendations,
  };
};

/**
 * Quick status check (for lightweight operations)
 */
export const getQuickStatus = (ingredients: string[]): ProductStatus => {
  const processedIngredients = ingredients.map(normalizeIngredient);
  let hasAdditives = false;
  let hasDangerous = false;

  for (const ingredient of processedIngredients) {
    // Check for E-numbers
    const eNumberMatch = ingredient.match(/e\s*(\d{3,4}[a-z]?)/i);
    if (eNumberMatch) {
      hasAdditives = true;
      const eNumber = 'E' + eNumberMatch[1].toUpperCase();
      if (isDangerousAdditive(eNumber)) {
        hasDangerous = true;
        break;
      }
    }

    // Check for dangerous ingredient names
    for (const [alias, eNumber] of Object.entries(INGREDIENT_ALIASES)) {
      if (ingredient.includes(alias)) {
        hasAdditives = true;
        if (isDangerousAdditive(eNumber)) {
          hasDangerous = true;
          break;
        }
      }
    }

    if (hasDangerous) break;
  }

  if (!hasAdditives) return 'green';
  if (hasDangerous) return 'red';
  return 'yellow';
};

/**
 * Find healthier alternatives (filter by green products)
 */
export const filterHealthyProducts = (products: any[]): any[] => {
  return products.filter((product) => product.status === 'green');
};

/**
 * Score a product based on additives (0-100, higher is better)
 */
export const scoreProduct = (additives: Additive[]): number => {
  if (additives.length === 0) return 100;

  let score = 100;

  for (const additive of additives) {
    if (additive.category === 'avoid') {
      score -= 30;
    } else if (additive.category === 'caution') {
      score -= 15;
    } else if (additive.category === 'safe') {
      score -= 5;
    }
  }

  return Math.max(0, score);
};
