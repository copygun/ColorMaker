@echo off
REM Validation script for Windows

echo Starting validation...
echo.

echo Checking TypeScript...
call npm run typecheck
if %errorlevel% neq 0 exit /b %errorlevel%

echo.
echo Running ESLint...
call npm run lint
if %errorlevel% neq 0 exit /b %errorlevel%

echo.
echo Checking code format...
call npm run format:check
if %errorlevel% neq 0 exit /b %errorlevel%

echo.
echo Running tests...
call npm run test
if %errorlevel% neq 0 exit /b %errorlevel%

echo.
echo Building project...
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%

echo.
echo All validations passed!