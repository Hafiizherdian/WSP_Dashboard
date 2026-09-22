@echo off
echo =====================================================
echo ADD PERFORMANCE INDEXES
echo =====================================================
echo.
echo 📋 Adding comprehensive indexes for better query performance:
echo    - Single column indexes for basic filtering
echo    - Composite indexes for common query patterns
echo    - Performance indexes for dashboard queries
echo    - Aggregation indexes for SUM/COUNT operations
echo    - Partial indexes for common filters
echo.
echo ⚠️  This will add indexes to improve database performance!
echo.
pause

echo.
echo 🔄 Adding performance indexes...
echo.

node run_migration.cjs 005_add_performance_indexes.sql

echo.
echo ✅ Performance indexes added successfully!
echo.
echo 📊 Expected improvements:
echo    - Faster dashboard loading
echo    - Quicker filter operations
echo    - Optimized aggregation queries
echo    - Better query planning
echo.
pause
