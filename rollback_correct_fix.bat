@echo off
echo =====================================================
echo ROLLBACK CORRECT CROSS-YEAR FIX
echo =====================================================
echo.
echo ⚠️  WARNING: This will restore data from backup!
echo =====================================================
echo.
pause

echo.
echo 🔄 Rolling back correct fix...
echo.

node run_migration.cjs rollback_004_fix_cross_year_correct.sql

echo.
echo ✅ Rollback completed!
echo.
echo 📊 Data has been restored to previous state
echo.
pause
