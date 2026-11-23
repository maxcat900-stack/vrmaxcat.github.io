@echo off
setlocal
cd /d "%~dp0"
call build.cmd
if errorlevel 1 exit /b 1
start "VR forest server" /min "%~dp0serve.cmd"
ping -n 3 127.0.0.1 >nul
set "EDGE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" (
  start "" "%EDGE%" http://localhost:8080/a.html
) else (
  start "" http://localhost:8080/a.html
)
echo Open http://localhost:8080/a.html in Edge. Server window: close it to stop.
endlocal
