/**
 * Utility functions untuk dashboard penjualan
 * 
 * Berisi fungsi-fungsi helper untuk formatting dan styling
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Menggabungkan class names dengan clsx dan tailwind-merge
 * @param inputs - Class names yang akan digabungkan
 * @returns {string} Class names yang sudah digabung
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format angka ke mata uang Rupiah (IDR)
 * @param value - Nilai yang akan diformat (bisa undefined)
 * @returns {string} Format mata uang IDR
 */
// export function formatCurrency(value: number | undefined): string {
//   if (value === undefined) return 'Rp 0';
//   return new Intl.NumberFormat('id-ID', {
//     style: 'currency',
//     currency: 'IDR',
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   }).format(value);
// }

/**
 * Format angka ke format numerik Indonesia
 * @param value - Nilai yang akan diformat
 * @returns {string} Format angka Indonesia
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

/**
 * Format angka ke quantity dalam dozen
 * @param value - Nilai yang akan diformat (bisa undefined)
 * @returns {string} Format quantity dalam dozen
 */
export function formatQuantity(value: number | undefined): string {
  if (value === undefined) return '0 DOS';
  return `${formatNumber(value)} `;
}

/**
 * Format angka ke persentase dengan tanda + untuk nilai positif
 * @param value - Nilai persentase (bisa undefined)
 * @returns {string} Format persentase dengan tanda +/- jika perlu
 */
export function formatPercentage(value: number | undefined): string {
  if (value === undefined) return '0%';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * Mendapatkan warna text berdasarkan nilai variance
 * @param value - Nilai variance
 * @returns {string} Class CSS warna text
 */
export function getVarianceColor(value: number): string {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
}

/**
 * Mendapatkan warna background berdasarkan nilai variance
 * @param value - Nilai variance
 * @returns {string} Class CSS warna background
 */
export function getVarianceBgColor(value: number): string {
  if (value > 0) return 'bg-green-100 text-green-800';
  if (value < 0) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}
