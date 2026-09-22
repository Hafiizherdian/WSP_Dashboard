@echo off
echo =====================================================
echo ROLLBACK WEEK 52 FIX
echo =====================================================
echo.
echo ⚠️  WARNING: This will restore data from backup!
echo =====================================================
echo.
pause

echo.
echo 🔄 Rolling back week fix...
echo.

node run_migration.cjs rollback_003_fix_week_52_to_2025.sql

echo.
echo ✅ Rollback completed!
echo.
echo 📊 W52 records are back in 2026
echo.
pause
