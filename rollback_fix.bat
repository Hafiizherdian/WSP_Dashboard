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
echo 🔄 Running rollback script...
echo.

psql dashboard_db -c "TRUNCATE sales_records;"
psql dashboard_db -c "INSERT INTO sales_records SELECT * FROM sales_records_backup;"
psql dashboard_db -c "DROP TABLE sales_records_backup;"

echo.
echo ✅ Rollback completed!
echo.
echo 📊 Dashboard has been restored to previous state
echo.
pause
