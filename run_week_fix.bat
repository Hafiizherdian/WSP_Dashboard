@echo off
echo =====================================================
echo FIX WEEK 52 DATA - MOVE TO CORRECT YEAR 2025
echo =====================================================
echo.
echo 📋 Problem: W52 records are in 2026, should be in 2025
echo 📊 Expected: W52 = Year 2025, W1 = Year 2026
echo.
echo ⚠️  WARNING: This will modify database data!
echo Make sure you have backup first!
echo.
pause

echo.
echo 🔄 Running week-based fix...
echo.

node run_migration.cjs 003_fix_week_52_to_2025.sql

echo.
echo ✅ Week fix completed!
echo.
echo 📊 Expected results:
echo    Year 2024: 175,964 records
echo    Year 2025: 471,933 records (includes W52)
echo    Year 2026: 5,857 records (includes W1)
echo.
echo If there are any issues, run: rollback_week_fix.bat
echo.
pause
