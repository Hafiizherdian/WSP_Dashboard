/**
 * lib/productCategories.ts
 * Konfigurasi kategori produk
 * Mapping antara nama produk dan kategorinya
 */

export interface ProductFactoryMapping {
  [productName: string]: string;
}

export interface ProductCategoryMapping {
  [productName: string]: string;
}

export interface ProductStickMapping {
  [productName: string]: number;
}

export interface ProductUnitConversion {
  stickPerPack: number;      // Batang per Bungkus
  packPerSlop: number;       // Bungkus per Slop
  slopPerBal: number;        // Slop per Bal
  balPerDos: number;         // Bal per Dos
}

export interface ProductUnitMapping {
  [productName: string]: ProductUnitConversion;
}

export const defaultProductFactories: ProductFactoryMapping = {
  'CAKRA KRESNA 12 F': 'PT. CAKRA GUNA CIPTA',
  'CAKRA KRESNA 16 F': 'PT. CAKRA GUNA CIPTA',
  'CAKRA LUXURY 12 F': 'PT. KARYA TAJINAN PRIMA',
  'CAKRA ON 20 FILTER': 'PT. CAKRA GUNA CIPTA',
  'CAKRAM 12 F': 'PT. KARYA TAJINAN PRIMA',
  'CAKRAM GOLD 12 F': 'PT. KARYA TAJINAN PRIMA',
  'CAKRAM SPESIAL 12 F': 'PT. KARYA TAJINAN PRIMA',
  'FIM BOLD 12 F': 'PT. RAGAM RASA RAYA',
  'FIM BOLD 20 F': 'PT. RAGAM RASA RAYA',
  'FIM TEH SEGAR 12 F': 'PT. RAGAM RASA RAYA',
  'IDE BOLD 20 F': 'PT. RAGAM RASA RAYA',
  'INA 16 F': 'PT. KARYA TIMUR PRIMA',
  'INA BOLD 12 F': 'PT. KARYA TIMUR PRIMA',
  'INA BOLD 16 F': 'PT. KARYA TIMUR PRIMA',
  'INA BOLD 20 F': 'PT. KARYA TIMUR PRIMA',
  'INA MILD 20 F': 'PT. KARYA TIMUR PRIMA',
  'ON 20 F': 'PT. CAKRA GUNA CIPTA',
  'ON BOLD 12 F': 'PT. CAKRA GUNA CIPTA',
  'ON BOLD 20 F': 'PT. CAKRA GUNA CIPTA',
  'ON CALL 12 F': 'PT. CAKRA GUNA CIPTA',
  'ON CLIK 20': 'PT. CAKRA GUNA CIPTA',
  'ON LINE 16 F': 'PT. KARYA TAJINAN PRIMA',
  'ON LINE BOLD 16 F': 'PT. KARYA TAJINAN PRIMA',
  'ON LINE BOLD 20 F': 'PT. KARYA TAJINAN PRIMA',
  'ON LINE COOL MINT 16 F': 'PT. KARYA TAJINAN PRIMA',
  'PATIK 20 F': 'PT. KARYA TIMUR PRIMA',
  'POTENZA 12 F': 'PT. KARYA TIMUR PRIMA',
  'POTENZA 16 F': 'PT. KARYA TIMUR PRIMA',
  'POTENZA 20 F': 'PT. KARYA TIMUR PRIMA',
  'POTENZA BLUEBERRY 16 F': 'PT. KARYA TIMUR PRIMA',
  'POTENZA BOLD 12 F': 'PT. KARYA TIMUR PRIMA',
  'POTENZA BOLD 16 F': 'PT. KARYA TIMUR PRIMA',
  'POTENZA BOLD 20 F': 'PT. KARYA TIMUR PRIMA',
  'POTENZO 16 F': 'PT. RAGAM RASA RAYA',
  'ULTIMATE 20 F': 'PT. KARYA TAJINAN PRIMA',
  'CAKRA ROYAL MILD 16 F': 'PT. CAKRA GUNA CIPTA',
  'MARCH MILD 16 F': 'PT. KARYA TIMUR PRIMA',
  'N-30 BLACK MILD 16 F': 'PT. KARYA TAJINAN PRIMA',
  'N-30 MENTHOL 16 F': 'PT. KARYA TAJINAN PRIMA',
  'N-30 MILD 16 F': 'PT. KARYA TAJINAN PRIMA',
  'N-30 MILD 20 F': 'PT. KARYA TAJINAN PRIMA',
  'N-30 MILD SR 16 FILTER': 'PT. KARYA TAJINAN PRIMA',
  'NAVAJO 16 F': 'PT. KARYA TAJINAN PRIMA',
  'ON LINE ES TELER 16 F': 'PT. KARYA TAJINAN PRIMA',
  'ON LINE FRESH GRAPE 16 F': 'PT. KARYA TAJINAN PRIMA',
  'ON LINE FRESH GRAPE 20 F': 'PT. KARYA TAJINAN PRIMA',
  'ON LINE PINEAPPLE 16 F': 'PT. KARYA TAJINAN PRIMA',
  'ON POWER 12 F': 'PT. CAKRA GUNA CIPTA',
  'POTENZA BLUEBERRY 20 F': 'PT. KARYA TIMUR PRIMA',
  'POTENZA MILD 16 F': 'PT. KARYA TIMUR PRIMA',
  'POTENZA MILD 20 F': 'PT. KARYA TIMUR PRIMA',
  'CAKRA PRIMA 16 K': 'PT. CAKRA GUNA CIPTA',
  'CAKRA PRIMA 10 K': 'PT. CAKRA GUNA CIPTA',
  'CAKRA PRIMA 12 K': 'PT. CAKRA GUNA CIPTA',
  'CAKRA PRIMA 12 K HARDPACK': 'PT. CAKRA GUNA CIPTA',
  'CAKRA PRIMA 16 K HARDPACK': 'PT. CAKRA GUNA CIPTA',
  'CAKRAM PRIMA 10 KRETEK': 'PT. KARYA TAJINAN PRIMA',
  'CAKRAM PRIMA 12 K': 'PT. KARYA TAJINAN PRIMA',
  'CAKRAM SUPRA 12 K': 'PT. KARYA TAJINAN PRIMA',
  'INTRA LINE 16 K': 'PR. INTRACO',
  'JAGOAN SEJATI 12 K': 'PR. GANESHA PUTRA PRIMA',
  'JAGOAN SEJATI 16 K': 'PR. GANESHA PUTRA PRIMA',
  'JALA 12 K': 'PT. RAGAM RASA RAYA',
  'MAHAYANA 12 K': 'PT. KARYA TIMUR PRIMA',
  'MAHAYANA 16 K': 'PT. KARYA TIMUR PRIMA',
  'ON 12 K': 'PT. CAKRA GUNA CIPTA',
  'ON BOLD 12 K': 'PT. CAKRA GUNA CIPTA',
  'ON CALL 16 K (HTM)': 'PT. RAGAM RASA RAYA',
  'ON CALL BERRY 12 K': 'PT. RAGAM RASA RAYA',
  'ON JASMINE 12 K': 'PT. CAKRA GUNA CIPTA',
  'ON LINE 12 K': 'PT. KARYA TAJINAN PRIMA',
  'ON LINE 16 K': 'PT. KARYA TAJINAN PRIMA',
  'ON LINE JAHE 16 K': 'PT. KARYA TAJINAN PRIMA',
  'ON POWER 16 K': 'PT. CAKRA GUNA CIPTA',
  'POTENZA 16 K': 'PT. KARYA TIMUR PRIMA',
  'PRIYAYI SEJATI 12 K': 'PR. INTRACO',
  'PRIYAYI SEJATI 16 K': 'PR. INTRACO',
  'RAGA 12 K': 'PT. RAGAM RASA RAYA',
  'TALI ROSO SEJATI 12 K': 'PR. GANESHA PUTRA PRIMA',
  'TALI ROSO SEJATI 16 K': 'PR. GANESHA PUTRA PRIMA',
  'ON WHITE 20 F': 'PT. CAKRA GUNA CIPTA',
  'SHUANG LONG 20 F': 'PT. CAKRA GUNA CIPTA'
};

// Default product category mapping
export const defaultProductCategories: ProductCategoryMapping = {
  // SKMR (Sigaret Kretek Mesin Regular)
  'CAKRA KRESNA 12 F': 'SKMR',
  'CAKRA KRESNA 16 F': 'SKMR',
  'CAKRA LUXURY 12 F': 'SKMR',
  'CAKRA ON 20 FILTER': 'SKMR',
  'CAKRAM 12 F': 'SKMR',
  'CAKRAM GOLD 12 F': 'SKMR',
  'CAKRAM SPESIAL 12 F': 'SKMR',
  'FIM BOLD 12 F': 'SKMR',
  'FIM BOLD 20 F': 'SKMR',
  'FIM TEH SEGAR 12 F': 'SKMR',
  'IDE BOLD 20 F': 'SKMR',
  'INA 16 F': 'SKMR',
  'INA BOLD 12 F': 'SKMR',
  'INA BOLD 16 F': 'SKMR',
  'INA BOLD 20 F': 'SKMR',
  'ON BOLD 12 F': 'SKMR',
  'ON BOLD 20 F': 'SKMR',
  'ON CALL 12 F': 'SKMR',
  'ON CLIK 20': 'SKMR',
  'ON LINE 16 F': 'SKMR',
  'ON LINE BOLD 16 F': 'SKMR',
  'ON LINE BOLD 20 F': 'SKMR',
  'ON LINE COOL MINT 16 F': 'SKMR',
  'ON POWER 12 F': 'SKMR',
  'PATIK 20 F': 'SKMR',
  'POTENZA 12 F': 'SKMR',
  'POTENZA 16 F': 'SKMR',
  'POTENZA 20 F': 'SKMR',
  'POTENZA BLUEBERRY 16 F': 'SKMR',
  'POTENZA BOLD 12 F': 'SKMR',
  'POTENZA BOLD 16 F': 'SKMR',
  'POTENZA BOLD 20 F': 'SKMR',
  'POTENZO 16 F': 'SKMR',
  'ULTIMATE 20 F': 'SKMR',

  // SKMM (Sigaret Kretek Mesin Mild)
  'CAKRA ROYAL MILD 16 F': 'SKMM',
  'INA MILD 20 F': 'SKMM',
  'MARCH MILD 16 F': 'SKMM',
  'N-30 BLACK MILD 16 F': 'SKMM',
  'N-30 MENTHOL 16 F': 'SKMM',
  'N-30 MILD 16 F': 'SKMM',
  'N-30 MILD 20 F': 'SKMM',
  'N-30 MILD SR 16 FILTER': 'SKMM',
  'ON 20 F': 'SKMM',
  'NAVAJO 16 F': 'SKMM',
  'ON LINE ES TELER 16 F': 'SKMM',
  'ON LINE FRESH GRAPE 16 F': 'SKMM',
  'ON LINE FRESH GRAPE 20 F': 'SKMM',
  'ON LINE PINEAPPLE 16 F': 'SKMM',
  'POTENZA BLUEBERRY 20 F': 'SKMM',
  'POTENZA MILD 16 F': 'SKMM',
  'POTENZA MILD 20 F': 'SKMM',

  // SKT (Sigaret Kretek Tangan)
  'CAKRA PRIMA 16 K': 'SKT',
  'CAKRA PRIMA 10 K': 'SKT',
  'CAKRA PRIMA 12 K': 'SKT',
  'CAKRA PRIMA 12 K HARDPACK': 'SKT',
  'CAKRA PRIMA 16 K HARDPACK': 'SKT',
  'CAKRAM PRIMA 10 KRETEK': 'SKT',
  'CAKRAM PRIMA 12 K': 'SKT',
  'CAKRAM SUPRA 12 K': 'SKT',
  'INTRA LINE 16 K': 'SKT',
  'JAGOAN SEJATI 12 K': 'SKT',
  'JAGOAN SEJATI 16 K': 'SKT',
  'JALA 12 K': 'SKT',
  'MAHAYANA 12 K': 'SKT',
  'MAHAYANA 16 K': 'SKT',
  'ON 12 K': 'SKT',
  'ON BOLD 12 K': 'SKT',
  'ON CALL 16 K (HTM)': 'SKT',
  'ON CALL BERRY 12 K': 'SKT',
  'ON JASMINE 12 K': 'SKT',
  'ON LINE 12 K': 'SKT',
  'ON LINE 16 K': 'SKT',
  'ON LINE JAHE 16 K': 'SKT',
  'ON POWER 16 K': 'SKT',
  'POTENZA 16 K': 'SKT',
  'PRIYAYI SEJATI 12 K': 'SKT',
  'PRIYAYI SEJATI 16 K': 'SKT',
  'RAGA 12 K': 'SKT',
  'TALI ROSO SEJATI 12 K': 'SKT',
  'TALI ROSO SEJATI 16 K': 'SKT',

  // SPM (Sigaret Putih Mesin)
  'ON WHITE 20 F': 'SPM',
  'SHUANG LONG 20 F': 'SPM'
};

export const defaultProductStickMapping: ProductStickMapping = {
  'CAKRA KRESNA 12 F': 12,
  'CAKRA KRESNA 16 F': 16,
  'CAKRA LUXURY 12 F': 12,
  'CAKRA ON 20 FILTER': 20,
  'CAKRAM 12 F': 12,
  'CAKRAM GOLD 12 F': 12,
  'CAKRAM SPESIAL 12 F': 12,
  'FIM BOLD 12 F': 12,
  'FIM BOLD 20 F': 20,
  'FIM TEH SEGAR 12 F': 12,
  'IDE BOLD 20 F': 20,
  'INA 16 F': 16,
  'INA BOLD 12 F': 12,
  'INA BOLD 16 F': 16,
  'INA BOLD 20 F': 20,
  'INA MILD 20 F': 20,
  'ON 20 F': 20,
  'ON BOLD 12 F': 12,
  'ON BOLD 20 F': 20,
  'ON CALL 12 F': 12,
  'ON CLIK 20': 20,
  'ON LINE 16 F': 16,
  'ON LINE BOLD 16 F': 16,
  'ON LINE BOLD 20 F': 20,
  'ON LINE COOL MINT 16 F': 16,
  'PATIK 20 F': 20,
  'POTENZA 12 F': 12,
  'POTENZA 16 F': 16,
  'POTENZA 20 F': 20,
  'POTENZA BLUEBERRY 16 F': 16,
  'POTENZA BOLD 12 F': 12,
  'POTENZA BOLD 16 F': 16,
  'POTENZA BOLD 20 F': 20,
  'POTENZO 16 F': 16,
  'ULTIMATE 20 F': 20,
  'CAKRA ROYAL MILD 16 F': 16,
  'MARCH MILD 16 F': 16,
  'N-30 BLACK MILD 16 F': 16,
  'N-30 MENTHOL 16 F': 16,
  'N-30 MILD 16 F': 16,
  'N-30 MILD 20 F': 20,
  'N-30 MILD SR 16 FILTER': 16,
  'NAVAJO 16 F': 16,
  'ON LINE ES TELER 16 F': 16,
  'ON LINE FRESH GRAPE 16 F': 16,
  'ON LINE FRESH GRAPE 20 F': 20,
  'ON LINE PINEAPPLE 16 F': 16,
  'ON POWER 12 F': 12,
  'POTENZA BLUEBERRY 20 F': 20,
  'POTENZA MILD 16 F': 16,
  'POTENZA MILD 20 F': 20,
  'CAKRA PRIMA 16 K': 16,
  'CAKRA PRIMA 10 K': 10,
  'CAKRA PRIMA 12 K': 12,
  'CAKRA PRIMA 12 K HARDPACK': 12,
  'CAKRA PRIMA 16 K HARDPACK': 16,
  'CAKRAM PRIMA 10 KRETEK': 10,
  'CAKRAM PRIMA 12 K': 12,
  'CAKRAM SUPRA 12 K': 12,
  'INTRA LINE 16 K': 16,
  'JAGOAN SEJATI 12 K': 12,
  'JAGOAN SEJATI 16 K': 16,
  'JALA 12 K': 12,
  'MAHAYANA 12 K': 12,
  'MAHAYANA 16 K': 16,
  'ON 12 K': 12,
  'ON BOLD 12 K': 12,
  'ON CALL 16 K (HTM)': 16,
  'ON CALL BERRY 12 K': 12,
  'ON JASMINE 12 K': 12,
  'ON LINE 12 K': 12,
  'ON LINE 16 K': 16,
  'ON LINE JAHE 16 K': 16,
  'ON POWER 16 K': 16,
  'POTENZA 16 K': 16,
  'PRIYAYI SEJATI 12 K': 12,
  'PRIYAYI SEJATI 16 K': 16,
  'RAGA 12 K': 12,
  'TALI ROSO SEJATI 12 K': 12,
  'TALI ROSO SEJATI 16 K': 16,
  'ON WHITE 20 F': 20,
  'SHUANG LONG 20 F': 20
};

/**
 * Konversi satuan untuk setiap produk
 * Standar umum industri rokok:
 * - 1 Bungkus = X Batang (tergantung produk: 10, 12, 16, atau 20 batang)
 * - 1 Slop = 10 Bungkus
 * - 1 Bal = 10 Slop = 100 Bungkus
 * - 1 Dos = 10 Bal = 100 Slop = 1000 Bungkus
 */
export const defaultProductUnitMapping: ProductUnitMapping = {
  'CAKRA KRESNA 12 F': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'CAKRA KRESNA 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'CAKRA LUXURY 12 F': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'CAKRA ON 20 FILTER': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'CAKRAM 12 F': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'CAKRAM GOLD 12 F': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'CAKRAM SPESIAL 12 F': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'FIM BOLD 12 F': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'FIM BOLD 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'FIM TEH SEGAR 12 F': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'IDE BOLD 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'INA 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'INA BOLD 12 F': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'INA BOLD 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'INA BOLD 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'INA MILD 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON BOLD 12 F': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'ON BOLD 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON CALL 12 F': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'ON CLIK 20': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON LINE 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON LINE BOLD 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON LINE BOLD 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON LINE COOL MINT 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'PATIK 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'POTENZA 12 F': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'POTENZA 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'POTENZA 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'POTENZA BLUEBERRY 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'POTENZA BOLD 12 F': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'POTENZA BOLD 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'POTENZA BOLD 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'POTENZO 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ULTIMATE 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'CAKRA ROYAL MILD 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'MARCH MILD 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'N-30 BLACK MILD 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'N-30 MENTHOL 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'N-30 MILD 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'N-30 MILD 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'N-30 MILD SR 16 FILTER': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'NAVAJO 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON LINE ES TELER 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON LINE FRESH GRAPE 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON LINE FRESH GRAPE 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON LINE PINEAPPLE 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON POWER 12 F': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'POTENZA BLUEBERRY 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'POTENZA MILD 16 F': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'POTENZA MILD 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'CAKRA PRIMA 16 K': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'CAKRA PRIMA 10 K': { stickPerPack: 10, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'CAKRA PRIMA 12 K': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'CAKRA PRIMA 12 K HARDPACK': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'CAKRA PRIMA 16 K HARDPACK': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'CAKRAM PRIMA 10 KRETEK': { stickPerPack: 10, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'CAKRAM PRIMA 12 K': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'CAKRAM SUPRA 12 K': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'INTRA LINE 16 K': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'JAGOAN SEJATI 12 K': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'JAGOAN SEJATI 16 K': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'JALA 12 K': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'MAHAYANA 12 K': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'MAHAYANA 16 K': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON 12 K': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'ON BOLD 12 K': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'ON CALL 16 K (HTM)': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON CALL BERRY 12 K': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'ON JASMINE 12 K': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'ON LINE 12 K': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'ON LINE 16 K': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON LINE JAHE 16 K': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON POWER 16 K': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'POTENZA 16 K': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'PRIYAYI SEJATI 12 K': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'PRIYAYI SEJATI 16 K': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'RAGA 12 K': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'TALI ROSO SEJATI 12 K': { stickPerPack: 12, packPerSlop: 10, slopPerBal: 20, balPerDos: 4 },
  'TALI ROSO SEJATI 16 K': { stickPerPack: 16, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'ON WHITE 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 },
  'SHUANG LONG 20 F': { stickPerPack: 20, packPerSlop: 10, slopPerBal: 10, balPerDos: 6 }
};

/**
 * Mendapatkan kategori produk berdasarkan nama produk
 * @param productName Nama produk
 * @param customMapping Custom mapping (opsional)
 * @returns Kategori produk
 */
export function getProductCategory(productName: string, customMapping?: ProductCategoryMapping): string {
  const mapping = customMapping || defaultProductCategories;
  
  // Cari exact match terlebih dahulu
  if (mapping[productName]) {
    return mapping[productName];
  }
  
  // Jika tidak ada exact match, coba cari partial match
  const upperProductName = productName.toUpperCase();
  
  // Prioritaskan pattern matching untuk kategori yang spesifik
  for (const [mappedProduct, category] of Object.entries(mapping)) {
    if (mappedProduct.includes(upperProductName) || upperProductName.includes(mappedProduct)) {
      return category;
    }
  }
  
  // Default ke Unknown jika tidak ada match
  return 'Unknown';
}

/**
 * Mendapatkan pabrik produk berdasarkan nama produk
 * @param productName Nama produk
 * @param customMapping Custom mapping (opsional)
 * @returns Nama pabrik
 */
export function getProductFactory(productName: string, customMapping?: ProductFactoryMapping): string {
  const mapping = customMapping || defaultProductFactories;
  return mapping[productName] || 'Unknown';
}

/**
 * Mendapatkan jumlah batang per bungkus
 * @param productName Nama produk
 * @param customMapping Custom mapping (opsional)
 * @returns Jumlah batang per bungkus
 */
export function getStickPerPack(productName: string, customMapping?: ProductStickMapping): number {
  const mapping = customMapping || defaultProductStickMapping;
  return mapping[productName] || 0;
}

/**
 * Mendapatkan konversi satuan produk
 * @param productName Nama produk
 * @param customMapping Custom mapping (opsional)
 * @returns Konversi satuan
 */
export function getProductUnitConversion(productName: string, customMapping?: ProductUnitMapping): ProductUnitConversion | null {
  const mapping = customMapping || defaultProductUnitMapping;
  return mapping[productName] || null;
}

/**
 * Konversi dari satuan ke batang
 * @param productName Nama produk
 * @param quantity Jumlah
 * @param unit Satuan (Bungkus, Slop, Bal, Dos)
 * @returns Jumlah batang
 */
export function convertToSticks(productName: string, quantity: number, unit: 'Bungkus' | 'Slop' | 'Bal' | 'Dos'): number {
  const conversion = getProductUnitConversion(productName);
  if (!conversion) return 0;

  switch (unit) {
    case 'Bungkus':
      return quantity * conversion.stickPerPack;
    case 'Slop':
      return quantity * conversion.packPerSlop * conversion.stickPerPack;
    case 'Bal':
      return quantity * conversion.slopPerBal * conversion.packPerSlop * conversion.stickPerPack;
    case 'Dos':
      return quantity * conversion.balPerDos * conversion.slopPerBal * conversion.packPerSlop * conversion.stickPerPack;
    default:
      return 0;
  }
}

/**
 * Konversi dari satuan ke bungkus
 * @param productName Nama produk
 * @param quantity Jumlah
 * @param unit Satuan (Batang, Slop, Bal, Dos)
 * @returns Jumlah bungkus
 */
export function convertToPacks(productName: string, quantity: number, unit: 'Batang' | 'Slop' | 'Bal' | 'Dos'): number {
  const conversion = getProductUnitConversion(productName);
  if (!conversion) return 0;

  switch (unit) {
    case 'Batang':
      return quantity / conversion.stickPerPack;
    case 'Slop':
      return quantity * conversion.packPerSlop;
    case 'Bal':
      return quantity * conversion.slopPerBal * conversion.packPerSlop;
    case 'Dos':
      return quantity * conversion.balPerDos * conversion.slopPerBal * conversion.packPerSlop;
    default:
      return 0;
  }
}

/**
 * Konversi dari satuan ke slop
 * @param productName Nama produk
 * @param quantity Jumlah
 * @param unit Satuan (Batang, Bungkus, Bal, Dos)
 * @returns Jumlah slop
 */
export function convertToSlops(productName: string, quantity: number, unit: 'Batang' | 'Bungkus' | 'Bal' | 'Dos'): number {
  const conversion = getProductUnitConversion(productName);
  if (!conversion) return 0;

  switch (unit) {
    case 'Batang':
      return quantity / (conversion.stickPerPack * conversion.packPerSlop);
    case 'Bungkus':
      return quantity / conversion.packPerSlop;
    case 'Bal':
      return quantity * conversion.slopPerBal;
    case 'Dos':
      return quantity * conversion.balPerDos * conversion.slopPerBal;
    default:
      return 0;
  }
}

/**
 * Konversi dari satuan ke bal
 * @param productName Nama produk
 * @param quantity Jumlah
 * @param unit Satuan (Batang, Bungkus, Slop, Dos)
 * @returns Jumlah bal
 */
export function convertToBals(productName: string, quantity: number, unit: 'Batang' | 'Bungkus' | 'Slop' | 'Dos'): number {
  const conversion = getProductUnitConversion(productName);
  if (!conversion) return 0;

  switch (unit) {
    case 'Batang':
      return quantity / (conversion.stickPerPack * conversion.packPerSlop * conversion.slopPerBal);
    case 'Bungkus':
      return quantity / (conversion.packPerSlop * conversion.slopPerBal);
    case 'Slop':
      return quantity / conversion.slopPerBal;
    case 'Dos':
      return quantity * conversion.balPerDos;
    default:
      return 0;
  }
}

/**
 * Konversi dari satuan ke dos
 * @param productName Nama produk
 * @param quantity Jumlah
 * @param unit Satuan (Batang, Bungkus, Slop, Bal)
 * @returns Jumlah dos
 */
export function convertToDos(productName: string, quantity: number, unit: 'Batang' | 'Bungkus' | 'Slop' | 'Bal'): number {
  const conversion = getProductUnitConversion(productName);
  if (!conversion) return 0;

  switch (unit) {
    case 'Batang':
      return quantity / (conversion.stickPerPack * conversion.packPerSlop * conversion.slopPerBal * conversion.balPerDos);
    case 'Bungkus':
      return quantity / (conversion.packPerSlop * conversion.slopPerBal * conversion.balPerDos);
    case 'Slop':
      return quantity / (conversion.slopPerBal * conversion.balPerDos);
    case 'Bal':
      return quantity / conversion.balPerDos;
    default:
      return 0;
  }
}

/**
 * Mendapatkan semua kategori yang tersedia
 * @param customMapping Custom mapping (opsional)
 * @returns Array of unique categories
 */
export function getAllCategories(customMapping?: ProductCategoryMapping): string[] {
  const mapping = customMapping || defaultProductCategories;
  return Array.from(new Set(Object.values(mapping)));
}

/**
 * Mendapatkan semua produk dalam kategori tertentu
 * @param category Kategori yang dicari
 * @param customMapping Custom mapping (opsional)
 * @returns Array of product names
 */
export function getProductsByCategory(category: string, customMapping?: ProductCategoryMapping): string[] {
  const mapping = customMapping || defaultProductCategories;
  return Object.entries(mapping)
    .filter(([_, cat]) => cat === category)
    .map(([product, _]) => product);
}

/**
 * Mendapatkan info lengkap produk
 * @param productName Nama produk
 * @returns Object berisi semua informasi produk
 */
export function getProductInfo(productName: string) {
  return {
    name: productName,
    category: getProductCategory(productName),
    factory: getProductFactory(productName),
    stickPerPack: getStickPerPack(productName),
    unitConversion: getProductUnitConversion(productName)
  };
}