@echo off
echo =====================================================
echo FIX CROSS-YEAR DATA - DASHBOARD SALES
echo =====================================================
echo.
echo ⚠️  WARNING: This will modify database data!
echo Make sure you have backup first!
echo.
pause

echo.
echo 🔄 Running SQL fix script...
echo.

psql dashboard_db < fix_cross_year.sql

echo.
echo ✅ Fix completed!
echo.
echo 📊 Please refresh your dashboard to see the results
echo.
echo 📋 Expected results:
echo    Year 2025: 471,933 records
echo    Year 2026: 5,857 records
echo.
echo If there are any issues, run rollback script.
echo.
pause
