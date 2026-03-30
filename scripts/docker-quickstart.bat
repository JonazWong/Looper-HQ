@echo off
REM =============================================================================
REM Looper HQ - Docker Quick Start (Windows)
REM =============================================================================

setlocal enabledelayedexpansion

echo ==============================================
echo    Looper HQ Docker Quick Start
echo ==============================================
echo.

REM Check Docker
docker info >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker is not running. Please start Docker Desktop.
  exit /b 1
)

echo [INFO] Docker is running
echo.

REM Check for .env file
if not exist ".env" (
  echo [INFO] Creating .env file from .env.example...
  copy .env.example .env
  echo [SUCCESS] Created .env file - please review and update if needed
  echo.
)

echo Choose setup mode:
echo   1. Development (infrastructure only)
echo   2. Full stack (all services in Docker)
echo   3. Exit
echo.
set /p choice="Enter choice [1-3]: "

if "%choice%"=="1" goto :dev_mode
if "%choice%"=="2" goto :full_mode
if "%choice%"=="3" goto :exit
echo [ERROR] Invalid choice
exit /b 1

:dev_mode
echo.
echo [INFO] Starting infrastructure services only...
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
if errorlevel 1 (
  echo [ERROR] Failed to start services
  exit /b 1
)
goto :show_urls

:full_mode
echo.
echo [INFO] Building and starting all services...
docker compose up -d --build
if errorlevel 1 (
  echo [ERROR] Failed to start services
  exit /b 1
)
goto :show_urls

:show_urls
echo.
echo ==============================================
echo [SUCCESS] Looper HQ Docker Environment Ready!
echo ==============================================
echo.
echo Services:
echo   PostgreSQL:     localhost:5433
echo   Redis:          localhost:6380
echo   Keycloak:       http://localhost:8080
echo.

docker compose ps | findstr /C:"looper-hq-web" >nul
if not errorlevel 1 (
  echo   Web App:        http://localhost:3005
)

docker compose ps | findstr /C:"looper-hq-legal" >nul
if not errorlevel 1 (
  echo   Legal Search:   http://localhost:3001
)

docker compose ps | findstr /C:"looper-hq-pgadmin" >nul
if not errorlevel 1 (
  echo   pgAdmin:        http://localhost:5050
)

echo.
echo Useful commands:
echo   View logs:      docker compose logs -f
echo   Stop services:  docker compose down
echo   Restart:        docker compose restart
echo.

if "%choice%"=="1" (
  echo Next steps:
  echo   1. Run: pnpm install
  echo   2. Run: pnpm db:migrate
  echo   3. Run: pnpm dev
  echo.
)

goto :eof

:exit
echo [INFO] Exiting...
exit /b 0
