@echo off
echo ========================================
echo Load Test Dashboard Sales - 300 Users
echo ========================================
echo.

echo Checking if K6 is installed...
k6 version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: K6 is not installed!
    echo Please install K6 first:
    echo   choco install k6
    echo   or visit https://k6.io/
    pause
    exit /b 1
)

echo K6 is installed.
echo.

echo Checking if dashboard is running...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Dashboard might not be running on localhost:3000
    echo Please start the dashboard with: npm run dev
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i "!continue!" neq "y" (
        exit /b 1
    )
)

echo Starting load test...
echo This will run for approximately 14 minutes
echo Press Ctrl+C to stop the test
echo.

k6 run load-test.mjs

echo.
echo Load test completed!
echo Check the results above for performance metrics
pause
