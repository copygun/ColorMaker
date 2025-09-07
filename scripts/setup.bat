@echo off
REM Initial setup script for Windows development environment

echo Wonlabel Color Maker Development Setup
echo ======================================
echo.

echo Checking Node.js version...
node -v
echo.

echo Installing dependencies...
call npm ci || call npm install
if %errorlevel% neq 0 exit /b %errorlevel%
echo.

echo Running initial validation...
call npm run typecheck
if %errorlevel% neq 0 exit /b %errorlevel%

call npm run lint
if %errorlevel% neq 0 exit /b %errorlevel%

call npm run format:check
if %errorlevel% neq 0 exit /b %errorlevel%
echo.

echo Building project...
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%
echo.

echo.
echo Setup complete!
echo.
echo Available commands:
echo   npm run dev        - Start development server
echo   npm run build      - Build for production
echo   npm run test       - Run tests
echo   npm run validate   - Run all checks
echo.
pause