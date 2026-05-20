/**
 * Konfigurasi area grouping
 * Admin bisa mengkonfigurasi area yang tersedia untuk upload data
 */

export interface AreaConfig {
  id: string;
  name: string;
  description?: string;
  quarterlyTargets?: {
    Q1: number;
    Q2: number;
    Q3: number;
    Q4: number;
  };
}

// Default area configuration - bisa diubah oleh admin
export const defaultAreas: AreaConfig[] = [
  {
    id: 'banyuwangi',
    name: 'Area Banyuwangi',
    description: 'Wilayah Banyuwangi dan sekitarnya',
    quarterlyTargets: {
      Q1: 50000,
      Q2: 60000,
      Q3: 55000,
      Q4: 70000
    }
  },
  {
    id: 'jember',
    name: 'Area Jember',
    description: 'Wilayah Jember dan sekitarnya',
    quarterlyTargets: {
      Q1: 45000,
      Q2: 52000,
      Q3: 48000,
      Q4: 65000
    }
  },
  {
    id: 'surabaya',
    name: 'Area Surabaya',
    description: 'Wilayah Surabaya Raya',
    quarterlyTargets: {
      Q1: 80000,
      Q2: 90000,
      Q3: 85000,
      Q4: 100000
    }
  },
  {
    id: 'malang',
    name: 'Area Malang',
    description: 'Wilayah Malang Raya',
    quarterlyTargets: {
      Q1: 65000,
      Q2: 72000,
      Q3: 68000,
      Q4: 82000
    }
  },
  {
    id: 'pasuruan',
    name: 'Area Pasuruan',
    description: 'Wilayah Pasuruan Raya',
    quarterlyTargets: {
      Q1: 38000,
      Q2: 42000,
      Q3: 40000,
      Q4: 52000
    }
  }
];

// Fungsi untuk mendapatkan semua area yang tersedia
export function getAllAreas(areas: AreaConfig[] = defaultAreas): AreaConfig[] {
  return areas;
}

// Fungsi untuk mendapatkan area berdasarkan ID
export function getAreaById(areaId: string, areas: AreaConfig[] = defaultAreas): AreaConfig | null {
  return areas.find(area => area.id === areaId) || null;
}
