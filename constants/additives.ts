import { Additive, AdditiveCategory } from '../types';

/**
 * Comprehensive food additives database for Turkey
 * Based on EU E-numbers and Turkish food regulations
 */

interface AdditiveData {
  code: string;
  name: string;
  category: AdditiveCategory;
  description: string;
  commonUses?: string;
  healthConcerns?: string;
}

// DANGEROUS ADDITIVES (RED - AVOID)
const DANGEROUS_ADDITIVES: AdditiveData[] = [
  {
    code: 'E621',
    name: 'Monosodyum Glutamat (MSG)',
    category: 'avoid',
    description: 'Yapay lezzet güçlendirici',
    commonUses: 'Çipler, hazır çorbalar, soslar',
    healthConcerns: 'Baş ağrısı, alerjik reaksiyonlar, obezite riski',
  },
  {
    code: 'E951',
    name: 'Aspartam',
    category: 'avoid',
    description: 'Yapay tatlandırıcı',
    commonUses: 'Diyet içecekler, şekersiz sakızlar',
    healthConcerns: 'Kanser riski tartışmalı, baş ağrısı',
  },
  {
    code: 'E104',
    name: 'Kinolin Sarısı',
    category: 'avoid',
    description: 'Sentetik renklendirici',
    commonUses: 'Tatlılar, içecekler',
    healthConcerns: 'Hiperaktivite, alerjik reaksiyonlar',
  },
  {
    code: 'E110',
    name: 'Sunset Yellow (Gün Batımı Sarısı)',
    category: 'avoid',
    description: 'Sentetik renklendirici',
    commonUses: 'Şekerlemeler, içecekler',
    healthConcerns: 'Çocuklarda hiperaktivite, astım',
  },
  {
    code: 'E122',
    name: 'Azorubin (Karmoizin)',
    category: 'avoid',
    description: 'Sentetik renklendirici',
    commonUses: 'Jelatin, şekerlemeler',
    healthConcerns: 'Alerjik reaksiyonlar, astım',
  },
  {
    code: 'E123',
    name: 'Amarant',
    category: 'avoid',
    description: 'Sentetik renklendirici',
    commonUses: 'Aperatifler, balık yumurtası',
    healthConcerns: 'Kanser riski, çoğu ülkede yasaklı',
  },
  {
    code: 'E124',
    name: 'Ponceau 4R (Kırmızı 2G)',
    category: 'avoid',
    description: 'Sentetik renklendirici',
    commonUses: 'Sosisler, şekerlemeler',
    healthConcerns: 'Alerjik reaksiyonlar, hiperaktivite',
  },
  {
    code: 'E127',
    name: 'Eritrosin',
    category: 'avoid',
    description: 'Sentetik renklendirici',
    commonUses: 'Kirazlar, tatlılar',
    healthConcerns: 'Tiroid fonksiyonlarını etkileyebilir',
  },
  {
    code: 'E129',
    name: 'Allura Red AC',
    category: 'avoid',
    description: 'Sentetik renklendirici',
    commonUses: 'Gazlı içecekler, şekerlemeler',
    healthConcerns: 'Hiperaktivite, alerjiler',
  },
  {
    code: 'E211',
    name: 'Sodyum Benzoat',
    category: 'avoid',
    description: 'Koruyucu',
    commonUses: 'Gazlı içecekler, soslar',
    healthConcerns: 'C vitamini ile birlikte benzene dönüşebilir',
  },
  {
    code: 'E213',
    name: 'Kalsiyum Benzoat',
    category: 'avoid',
    description: 'Koruyucu',
    commonUses: 'İçecekler, soslar',
    healthConcerns: 'Alerjik reaksiyonlar',
  },
  {
    code: 'E249',
    name: 'Potasyum Nitrit',
    category: 'avoid',
    description: 'Koruyucu',
    commonUses: 'Et ürünleri, sosis, salam',
    healthConcerns: 'Kanser riski, nitrozamin oluşumu',
  },
  {
    code: 'E250',
    name: 'Sodyum Nitrit',
    category: 'avoid',
    description: 'Koruyucu',
    commonUses: 'İşlenmiş et ürünleri',
    healthConcerns: 'Kanser riski, nitrozamin oluşumu',
  },
  {
    code: 'E251',
    name: 'Sodyum Nitrat',
    category: 'avoid',
    description: 'Koruyucu',
    commonUses: 'Sucuklar, et ürünleri',
    healthConcerns: 'Kanser riski',
  },
  {
    code: 'E320',
    name: 'Bütillenmiş Hidroksianisol (BHA)',
    category: 'avoid',
    description: 'Antioksidan',
    commonUses: 'Yağlar, bisküviler',
    healthConcerns: 'Kanser riski, hormon bozucu',
  },
  {
    code: 'E321',
    name: 'Bütillenmiş Hidroksitoluen (BHT)',
    category: 'avoid',
    description: 'Antioksidan',
    commonUses: 'Cipsler, çerezler',
    healthConcerns: 'Kanser riski, hormon bozucu',
  },
  {
    code: 'E407',
    name: 'Karagenan',
    category: 'avoid',
    description: 'Kıvam arttırıcı',
    commonUses: 'Süt ürünleri, dondurma',
    healthConcerns: 'Bağırsak iltihabı, sindirim sorunları',
  },
  {
    code: 'E924',
    name: 'Potasyum Bromat',
    category: 'avoid',
    description: 'Un iyileştirici',
    commonUses: 'Ekmek, hamur işleri',
    healthConcerns: 'Kanser riski, çoğu ülkede yasaklı',
  },
  {
    code: 'E952',
    name: 'Siklamat',
    category: 'avoid',
    description: 'Yapay tatlandırıcı',
    commonUses: 'Diyet ürünler',
    healthConcerns: 'Kanser riski, ABD\'de yasaklı',
  },
];

// CAUTION ADDITIVES (YELLOW - MODERATE)
const CAUTION_ADDITIVES: AdditiveData[] = [
  {
    code: 'E102',
    name: 'Tartrazin',
    category: 'caution',
    description: 'Sentetik renklendirici',
    commonUses: 'İçecekler, şekerlemeler',
    healthConcerns: 'Astıma yatkın kişilerde reaksiyon',
  },
  {
    code: 'E200',
    name: 'Sorbik Asit',
    category: 'caution',
    description: 'Koruyucu',
    commonUses: 'Peynir, ekmek, salamura',
  },
  {
    code: 'E202',
    name: 'Potasyum Sorbat',
    category: 'caution',
    description: 'Koruyucu',
    commonUses: 'Soslar, turşu, reçel',
  },
  {
    code: 'E330',
    name: 'Sitrik Asit',
    category: 'caution',
    description: 'Asitlik düzenleyici',
    commonUses: 'İçecekler, şekerlemeler',
    healthConcerns: 'Yüksek miktarda diş minesine zarar',
  },
  {
    code: 'E331',
    name: 'Sodyum Sitrat',
    category: 'caution',
    description: 'Asitlik düzenleyici',
    commonUses: 'Gazlı içecekler',
  },
  {
    code: 'E412',
    name: 'Guar Gum',
    category: 'caution',
    description: 'Kıvam arttırıcı',
    commonUses: 'Dondurma, soslar',
    healthConcerns: 'Sindirim sorunları yüksek miktarda',
  },
  {
    code: 'E415',
    name: 'Ksantan Gum',
    category: 'caution',
    description: 'Kıvam arttırıcı',
    commonUses: 'Soslar, salata sosları',
  },
  {
    code: 'E422',
    name: 'Gliserol',
    category: 'caution',
    description: 'Nemlendiric i, tatlandırıcı',
    commonUses: 'Kekler, şekerlemeler',
  },
  {
    code: 'E450',
    name: 'Difosfatlar',
    category: 'caution',
    description: 'Stabilizatör',
    commonUses: 'İşlenmiş et, peynir',
    healthConcerns: 'Yüksek miktarda kalsiyum emilimi düşer',
  },
  {
    code: 'E451',
    name: 'Trifosfatlar',
    category: 'caution',
    description: 'Stabilizatör',
    commonUses: 'Et ürünleri',
  },
  {
    code: 'E452',
    name: 'Polifosfatlar',
    category: 'caution',
    description: 'Stabilizatör',
    commonUses: 'Deniz ürünleri, et',
    healthConcerns: 'Mineral dengesini bozabilir',
  },
  {
    code: 'E471',
    name: 'Mono ve Digliseritler',
    category: 'caution',
    description: 'Emülgatör',
    commonUses: 'Ekmek, margarin, dondurma',
  },
  {
    code: 'E621',
    name: 'Monosodyum Glutamat (MSG)',
    category: 'avoid',
    description: 'Lezzet güçlendirici',
    commonUses: 'Hazır yemekler, çorbalar',
  },
  {
    code: 'E950',
    name: 'Asesülfam K',
    category: 'caution',
    description: 'Yapay tatlandırıcı',
    commonUses: 'Diyet içecekler',
  },
  {
    code: 'E955',
    name: 'Sukraloz',
    category: 'caution',
    description: 'Yapay tatlandırıcı',
    commonUses: 'Diyet ürünler',
    healthConcerns: 'Bağırsak bakterilerini etkileyebilir',
  },
];

// SAFE ADDITIVES (Would still trigger yellow/red if ANY additive present)
const NATURAL_ADDITIVES: AdditiveData[] = [
  {
    code: 'E300',
    name: 'Askorbik Asit (C Vitamini)',
    category: 'safe',
    description: 'Doğal antioksidan',
    commonUses: 'Meyve suları, konserveler',
  },
  {
    code: 'E440',
    name: 'Pektin',
    category: 'safe',
    description: 'Doğal kıvam arttırıcı',
    commonUses: 'Reçel, marmelat',
  },
  {
    code: 'E414',
    name: 'Arap Zamkı',
    category: 'safe',
    description: 'Doğal stabilizatör',
    commonUses: 'Şekerlemeler',
  },
];

// Combine all additives
export const ADDITIVES_DATABASE: AdditiveData[] = [
  ...DANGEROUS_ADDITIVES,
  ...CAUTION_ADDITIVES,
  ...NATURAL_ADDITIVES,
];

// Helper functions
export const getAdditiveByCode = (code: string): AdditiveData | undefined => {
  return ADDITIVES_DATABASE.find(
    (additive) => additive.code.toLowerCase() === code.toLowerCase()
  );
};

export const isDangerousAdditive = (code: string): boolean => {
  return DANGEROUS_ADDITIVES.some(
    (additive) => additive.code.toLowerCase() === code.toLowerCase()
  );
};

export const isCautionAdditive = (code: string): boolean => {
  return CAUTION_ADDITIVES.some(
    (additive) => additive.code.toLowerCase() === code.toLowerCase()
  );
};

// Common ingredient aliases (Turkish)
export const INGREDIENT_ALIASES: Record<string, string> = {
  'monosodyum glutamat': 'E621',
  'msg': 'E621',
  'aspartam': 'E951',
  'sodyum benzoat': 'E211',
  'sitrik asit': 'E330',
  'askorbik asit': 'E300',
  'c vitamini': 'E300',
  'potasyum sorbat': 'E202',
  'sorbik asit': 'E200',
  'karagenan': 'E407',
  'ksantan': 'E415',
  'guar gum': 'E412',
  'pektin': 'E440',
  'sukraloz': 'E955',
};

// Keywords that indicate additives even without E-numbers
export const ADDITIVE_KEYWORDS: string[] = [
  'aroma',
  'renklendirici',
  'koruyucu',
  'tatlandırıcı',
  'antioksidan',
  'kıvam',
  'emülgatör',
  'stabilizatör',
  'jelleştirici',
  'asitlik düzenleyici',
  'pekiştirici',
  'dolgu maddesi',
];
