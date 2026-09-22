/**
 * Generator data kosong sebagai fallback ketika query gagal atau
 * tidak ada records sama sekali. Dipakai di index.ts (fetchSalesData /
 * processSalesRecords).
 */

import {
  QuarterlyData, QuarterlyYoYData, L4WC4WData,
  YearOnYearGrowth, ComparisonWeeks,
} from '@/types/sales';

export function generateEmptyQuarterlyData(): QuarterlyData[] {
  return ['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => ({
    quarter, target: 0, actual: 0, variance: 0, variancePercentage: 0,
    weeklyBreakdown: [], monthlyBreakdown: [],
  }));
}

export function generateEmptyQuarterlyYoYData(): QuarterlyYoYData[] {
  return ['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => ({
    quarter, previous: 0, current: 0, variance: 0, variancePercentage: 0,
  }));
}

export function generateEmptyL4WC4WData(): L4WC4WData {
  return { l4wAverage: 0, c4wAverage: 0, c1wValue: 0, variance: 0, variancePercentage: 0, weeklyTrendData: [], l4wWeekRange: '', c1wWeekNumber: 0 };
}

export function generateEmptyYearOnYearGrowth(): YearOnYearGrowth {
  return { previousYearTotal: 0, currentYearTotal: 0, variance: 0, variancePercentage: 0 };
}

export function generateEmptyComparisonWeeks(): ComparisonWeeks {
  return { previousYear: null, currentYear: null };
}