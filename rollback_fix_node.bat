@echo off
echo =====================================================
echo ROLLBACK CROSS-YEAR DATA FIX
echo =====================================================
echo.
echo ⚠️  WARNING: This will restore data from backup!
echo =====================================================
echo.
pause

echo.
echo 🔄 Running Node.js rollback script...
echo.

node rollback_fix_node.js

echo.
pause
