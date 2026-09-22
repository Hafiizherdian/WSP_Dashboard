@echo off
echo =====================================================
echo FIX CROSS-YEAR DATA - MIGRATION STYLE
echo =====================================================
echo.
echo ⚠️  WARNING: This will modify database data!
echo Make sure you have backup first!
echo.
pause

echo.
echo 🔄 Running migration...
echo.

node run_migration.cjs 001_fix_cross_year.sql

echo.
pause
