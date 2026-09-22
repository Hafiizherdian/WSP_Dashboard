@echo off
echo =====================================================
echo ROLLBACK CROSS-YEAR DATA - MIGRATION STYLE
echo =====================================================
echo.
echo ⚠️  WARNING: This will restore data from backup!
echo =====================================================
echo.
pause

echo.
echo 🔄 Running rollback migration...
echo.

node run_migration.cjs rollback_001_fix_cross_year.sql

echo.
pause
