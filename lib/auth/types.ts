// lib/auth/types.ts

export type UserRole = 'root' | 'admin' | 'user';

export interface SessionUser {
  id:       string;
  username: string;
  email:    string;
  role:     UserRole;
  allowed_areas: string[]; // Array of area IDs this user can access
}

export interface JWTPayload extends SessionUser {
  iat: number;
  exp: number;
}

// ─── Permission map ───────────────────────────────────────────────────────────
export const PERMISSIONS = {
  // File / data
  upload_file:    ['root', 'admin'],
  delete_file:    ['root', 'admin'],
  view_files:     ['root', 'admin', 'user'],
  preview_file:   ['root', 'admin', 'user'],

  // Stats / dashboard
  view_stats:     ['root', 'admin', 'user'],

  // Area management
  manage_areas:   ['root', 'admin'],
  view_areas:     ['root', 'admin', 'user'],

  // User management
  manage_users:   ['root'],
  view_users:     ['root'],

  // Settings
  run_migration:  ['root'],
  view_settings:  ['root'],

  // Admin panel access
  access_admin_panel: ['root', 'admin'],
  view_all_areas: ['root'],
} as const satisfies Record<string, UserRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

// ─── Area-based access control utilities ───────────────────────────────
export function canAccessArea(user: SessionUser, areaId: string): boolean {
  if (user.role === 'root') return true;
  return user.allowed_areas.includes(areaId);
}

export function getAccessibleAreas(user: SessionUser): string[] {
  if (user.role === 'root') return []; // Empty array means all areas
  return user.allowed_areas;
}

export function filterUserAreas(user: SessionUser, allAreas: any[]): any[] {
  if (user.role === 'root') return allAreas;
  return allAreas.filter(area => user.allowed_areas.includes(area.id));
}

export const ROLE_LABELS: Record<UserRole, string> = {
  root:  'Root',
  admin: 'Admin',
  user:  'User',
};

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  root:  { bg: 'rgba(139,92,246,0.1)', text: '#c4b5fd', border: 'rgba(139,92,246,0.3)' },
  admin: { bg: 'rgba(37,99,235,0.1)',  text: '#93c5fd', border: 'rgba(59,130,246,0.3)' },
  user:  { bg: 'rgba(16,185,129,0.08)',text: '#6ee7b7', border: 'rgba(16,185,129,0.2)' },
};

export const ROLE_COLORS_LIGHT: Record<UserRole, { bg: string; text: string; border: string }> = {
  root:  { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
  admin: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  user:  { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
};