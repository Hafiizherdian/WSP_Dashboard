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
echo 🔄 Running Node.js fix script...
echo.

node run_fix_node.js

echo.
pause
