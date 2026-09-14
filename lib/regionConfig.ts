// lib/regionConfig.ts
export interface RegionConfig {
  id: string;            // slug, contoh: 'regional_jatim'
  name: string;          // label tampil, contoh: 'Regional Jawa Timur'
  areaIds: string[];     // area IDs yang termasuk regional ini
  description?: string;
}

export const defaultRegions: RegionConfig[] = [];

// Region mana yang bisa dilihat/dipilih user ini
export function getAccessibleRegions(
  regions: RegionConfig[],
  userAllowedAreas: string[],
  isRoot: boolean,
): RegionConfig[] {
  if (isRoot) return regions;
  return regions.filter(r => r.areaIds.some(id => userAllowedAreas.includes(id)));
}

// Resolve region -> area ids yang boleh dipakai user ini (irisan)
export function resolveRegionAreas(
  region: RegionConfig,
  userAllowedAreas: string[],
  isRoot: boolean,
): string[] {
  if (isRoot) return region.areaIds;
  return region.areaIds.filter(id => userAllowedAreas.includes(id));
}