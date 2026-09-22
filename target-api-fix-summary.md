# Target API Fix Summary

## Problem Identified
The target data for Bal, Slop, and Bks units was being calculated incorrectly due to **double multiplication**:
1. First multiplication during POST via `calcDerived()` function 
2. Second multiplication during GET via AVG() on already-multiplied values

## Changes Made

### 1. Fixed GET Method (/api/area-targets)
**Before:**
```sql
SELECT AVG(units_dos) AS dos_total,
       AVG(units_bal) AS bal_total,
       AVG(units_slop) AS slop_total,
       AVG(units_bks) AS bks_total
```

**After:**
```sql
SELECT AVG(units_dos) AS dos_avg
```

**Key Changes:**
- Query only DOS values from database
- Calculate derived units (Bal, Slop, Bks) on-the-fly in JavaScript
- Apply multipliers: Bal = DOS × 10, Slop = DOS × 100, BKS = DOS × 1000
- Filter by `target_type = 'WEEKLY'` for consistency

### 2. Fixed POST Method (/api/area-targets)
**Before:**
```sql
VALUES ($6::numeric, 'UNITS', $6::numeric, $7::numeric, $8::numeric, $9::numeric, ...)
-- Where $7, $8, $9 were derived values
```

**After:**
```sql
VALUES ($6::numeric, 'UNITS', $6::numeric, 0, 0, 0, ...)
-- Store only DOS value, set derived units to 0
```

**Key Changes:**
- Removed `calcDerived()` function usage
- Store only DOS values in database
- Set Bal, Slop, Bks to 0 during insertion
- Simplified INSERT parameters

### 3. Code Cleanup
- Removed unused `calcDerived()` function
- Updated comments to reflect new behavior
- Maintained API contract for frontend compatibility

## Expected Results

### Excel Data Example:
- DOS: 13, 26, 1, 14.54
- Expected Bal: 130, 260, 10, 145.4 (DOS × 10)
- Expected Slop: 1300, 2600, 100, 1454 (DOS × 100)  
- Expected BKS: 13000, 26000, 1000, 14540 (DOS × 1000)

### API Response Should Show:
```json
{
  "products": [
    {
      "product": "FIM BOLD 12 F",
      "q1_dos": 13,
      "q1_bal": 130,    // 13 × 10
      "q1_slop": 1300,  // 13 × 100
      "q1_bks": 13000   // 13 × 1000
    }
  ],
  "areaTotals": {
    "q1_dos": 54.54,
    "q1_bal": 545.4,   // 54.54 × 10
    "q1_slop": 5454,   // 54.54 × 100
    "q1_bks": 54540    // 54.54 × 1000
  }
}
```

## Testing
Created `test-target-api.js` to verify:
- API returns correct DOS values from database
- Derived units are calculated with proper multipliers
- No more double multiplication issue

## Files Modified
- `/app/api/area-targets/route.ts` - Main fix implementation
- `/test-target-api.js` - Test script for verification
- `/target-api-fix-summary.md` - This documentation

## Impact
- ✅ Correct target data display in dashboard
- ✅ Proper quarterly calculations
- ✅ Accurate Bal/Slop/Bks values
- ✅ Maintains frontend compatibility
- ✅ Cleaner, more maintainable code
