@echo off
REM =============================================================================
REM Looper HQ - Docker Setup Verification Script (Windows)
REM =============================================================================

setlocal enabledelayedexpansion

set "ERRORS=0"
set "WARNINGS=0"

echo ==============================================
echo   Looper HQ Docker Setup Verification
echo ==============================================
echo.

REM Check Docker
echo [INFO] Checking Docker...
where docker >nul 2>&1
if errorlevel 1 (
  echo [X] Docker is not installed
  set /a ERRORS+=1
) else (
  for /f "tokens=3" %%a in ('docker --version') do (
    echo [OK] Docker installed: %%a
    goto :check_docker_running
  )
)

:check_docker_running
docker info >nul 2>&1
if errorlevel 1 (
  echo [X] Docker daemon is not running
  set /a ERRORS+=1
) else (
  echo [OK] Docker daemon is running
)

REM Check Docker Compose
echo [INFO] Checking Docker Compose...
where docker-compose >nul 2>&1
if errorlevel 1 (
  echo [!] docker-compose command not found, checking plugin...
  docker compose version >nul 2>&1
  if errorlevel 1 (
    echo [X] Docker Compose is not available
    set /a ERRORS+=1
  ) else (
    echo [OK] Docker Compose plugin installed
  )
) else (
  for /f "tokens=4" %%a in ('docker-compose --version') do (
    echo [OK] Docker Compose installed: %%a
    goto :check_files
  )
)

:check_files
echo [INFO] Checking required files...

set "FILES=Dockerfile docker-compose.yml docker-compose.dev.yml docker-compose.prod.yml .dockerignore package.json pnpm-workspace.yaml turbo.json"
for %%f in (%FILES%) do (
  if exist "%%f" (
    echo [OK] %%f exists
  ) else (
    echo [X] %%f is missing
    set /a ERRORS+=1
  )
)

REM Check scripts
echo [INFO] Checking build scripts...
set "SCRIPTS=scripts\docker-build.sh scripts\docker-build.bat scripts\docker-quickstart.sh scripts\docker-quickstart.bat"
for %%s in (%SCRIPTS%) do (
  if exist "%%s" (
    echo [OK] %%s exists
  ) else (
    echo [X] %%s is missing
    set /a ERRORS+=1
  )
)

REM Check documentation
echo [INFO] Checking documentation...
set "DOCS=DOCKER.md DOCKER_SETUP.md"
for %%d in (%DOCS%) do (
  if exist "%%d" (
    echo [OK] %%d exists
  ) else (
    echo [!] %%d is missing
    set /a WARNINGS+=1
  )
)

REM Check directory structure
echo [INFO] Checking directory structure...
set "DIRS=apps\web apps\legal-case-search packages\database packages\utils infrastructure\docker"
for %%d in (%DIRS%) do (
  if exist "%%d" (
    echo [OK] %%d exists
  ) else (
    echo [X] %%d is missing
    set /a ERRORS+=1
  )
)

REM Check environment file
echo [INFO] Checking environment configuration...
if exist ".env" (
  echo [OK] .env file exists
  findstr /C:"NEXTAUTH_SECRET=" .env >nul
  if not errorlevel 1 (
    echo [OK] NEXTAUTH_SECRET is set
  ) else (
    echo [!] NEXTAUTH_SECRET needs to be configured
    set /a WARNINGS+=1
  )
) else (
  echo [!] .env file not found (copy from .env.example^)
  set /a WARNINGS+=1
)

REM Validate docker-compose configuration
echo [INFO] Validating docker-compose configuration...
docker-compose -f docker-compose.yml config --quiet >nul 2>&1
if errorlevel 1 (
  echo [X] docker-compose.yml has configuration errors
  set /a ERRORS+=1
) else (
  echo [OK] docker-compose.yml is valid
)

REM Summary
echo.
echo ==============================================
if %ERRORS%==0 (
  if %WARNINGS%==0 (
    echo [SUCCESS] All checks passed! You're ready to start.
    echo.
    echo Next steps:
    echo   1. Review/update .env file if needed
    echo   2. Run: scripts\docker-quickstart.bat
    echo   3. Or use Docker Desktop to start services
  ) else (
    echo [WARNING] Setup complete with %WARNINGS% warning(s^)
    echo.
    echo Please address warnings before proceeding.
  )
) else (
  echo [ERROR] Setup incomplete: %ERRORS% error(s^), %WARNINGS% warning(s^)
  echo.
  echo Please fix errors before proceeding.
  exit /b 1
)
echo ==============================================

endlocal
