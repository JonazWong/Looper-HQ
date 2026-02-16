@echo off
REM =============================================================================
REM Looper HQ - Docker Build Script (Windows)
REM =============================================================================
REM Builds all Docker images for the Looper HQ platform
REM
REM Usage:
REM   scripts\docker-build.bat [--no-cache] [--push]

setlocal enabledelayedexpansion

REM Configuration
set "DOCKER_REGISTRY=%DOCKER_REGISTRY%"
set "IMAGE_TAG=latest"
set "BUILD_ARGS="
set "PUSH_IMAGES=false"

REM Parse arguments
:parse_args
if "%~1"=="" goto :build
if /I "%~1"=="--no-cache" (
  set "BUILD_ARGS=!BUILD_ARGS! --no-cache"
  shift
  goto :parse_args
)
if /I "%~1"=="--push" (
  set "PUSH_IMAGES=true"
  shift
  goto :parse_args
)
if /I "%~1"=="--tag" (
  set "IMAGE_TAG=%~2"
  shift
  shift
  goto :parse_args
)
if /I "%~1"=="--registry" (
  set "DOCKER_REGISTRY=%~2"
  shift
  shift
  goto :parse_args
)
echo Unknown option: %~1
exit /b 1

:build
echo [INFO] Starting Docker build process...
echo [INFO] Image tag: %IMAGE_TAG%

if not "%DOCKER_REGISTRY%"=="" (
  echo [INFO] Registry: %DOCKER_REGISTRY%
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker is not running. Please start Docker and try again.
  exit /b 1
)

set "FAILED=0"

REM Build web application
call :build_image "web-runner" "web" || set /a FAILED+=1

REM Build legal case search application
call :build_image "legal-runner" "legal-case-search" || set /a FAILED+=1

REM Summary
echo.
echo ==============================================
if %FAILED%==0 (
  echo [SUCCESS] All images built successfully!
) else (
  echo [ERROR] %FAILED% image(s) failed to build
  exit /b 1
)

REM Show built images
echo.
echo [INFO] Built images:
docker images "looper-hq/*:%IMAGE_TAG%" --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}"

exit /b 0

REM =============================================================================
REM Helper function to build an image
REM =============================================================================
:build_image
set "TARGET=%~1"
set "NAME=%~2"

if not "%DOCKER_REGISTRY%"=="" (
  set "IMAGE_NAME=%DOCKER_REGISTRY%/%NAME%:%IMAGE_TAG%"
) else (
  set "IMAGE_NAME=looper-hq/%NAME%:%IMAGE_TAG%"
)

echo [INFO] Building %NAME% image (target: %TARGET%)...

docker build --target "%TARGET%" --tag "%IMAGE_NAME%" %BUILD_ARGS% -f Dockerfile .
if errorlevel 1 (
  echo [ERROR] Failed to build %IMAGE_NAME%
  exit /b 1
)

echo [SUCCESS] Built %IMAGE_NAME%

if "%PUSH_IMAGES%"=="true" (
  echo [INFO] Pushing %IMAGE_NAME%...
  docker push "%IMAGE_NAME%"
  if errorlevel 1 (
    echo [ERROR] Failed to push %IMAGE_NAME%
    exit /b 1
  )
  echo [SUCCESS] Pushed %IMAGE_NAME%
)

exit /b 0
