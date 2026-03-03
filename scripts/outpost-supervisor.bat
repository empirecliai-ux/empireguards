@echo off
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0.."
set "LOG_DIR=%ROOT_DIR%\logs"
set "RUNTIME_DIR=%ROOT_DIR%\.runtime"
set "PID_FILE=%RUNTIME_DIR%\outpost.pid"
set "SUPERVISOR_SH=%ROOT_DIR%\scripts\outpost-supervisor.sh"

if "%~1"=="" goto :usage

if /I "%~1"=="start" goto :start
if /I "%~1"=="stop" goto :stop
if /I "%~1"=="status" goto :status
if /I "%~1"=="restart" goto :restart

goto :usage

:start
if exist "%PID_FILE%" (
  set /p PID=<"%PID_FILE%"
  tasklist /FI "PID eq !PID!" | find "!PID!" >nul
  if not errorlevel 1 (
    echo outpost supervisor already running ^(pid !PID!^)
    exit /b 0
  )
  del "%PID_FILE%" >nul 2>&1
)

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "%RUNTIME_DIR%" mkdir "%RUNTIME_DIR%"

for /f %%I in ('wsl bash -lc "nohup '%SUPERVISOR_SH:\=/%' start >/dev/null 2>&1 & echo $!"') do set "PID=%%I"
if "%PID%"=="" (
  echo Failed to start supervisor via WSL.
  exit /b 1
)

echo !PID!>"%PID_FILE%"
echo outpost supervisor started ^(pid !PID!^)
exit /b 0

:stop
if not exist "%PID_FILE%" (
  echo outpost supervisor is not running
  exit /b 0
)
set /p PID=<"%PID_FILE%"
taskkill /PID !PID! /T /F >nul 2>&1
if errorlevel 1 (
  echo Could not stop pid !PID! directly. If using WSL, run scripts\outpost-supervisor.sh stop from bash.
) else (
  echo outpost supervisor stopped
)
del "%PID_FILE%" >nul 2>&1
exit /b 0

:status
if not exist "%PID_FILE%" (
  echo outpost supervisor is not running
  exit /b 1
)
set /p PID=<"%PID_FILE%"
tasklist /FI "PID eq !PID!" | find "!PID!" >nul
if errorlevel 1 (
  echo outpost supervisor is not running
  exit /b 1
)
echo outpost supervisor is running ^(pid !PID!^)
exit /b 0

:restart
call "%~f0" stop
call "%~f0" start
exit /b %errorlevel%

:usage
echo Usage: %~nx0 ^<start^|stop^|status^|restart^>
exit /b 1
