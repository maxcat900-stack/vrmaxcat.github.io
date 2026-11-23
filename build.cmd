@echo off
setlocal
cd /d "%~dp0"
if exist a.html del a.html
copy /b src\00-head.html + src\10-core.js + src\20-math.js + src\30-geo.js + src\40-forest.js + src\50-shaders.js + src\60-gl.js + src\70-render.js + src\80-move.js + src\90-xr.js + src\95-boot.js + src\96-selftest.js + src\99-tail.html a.html >nul
if errorlevel 1 (
  echo BUILD FAILED
  exit /b 1
)
for %%F in (a.html) do echo built a.html  %%~zF bytes
endlocal
