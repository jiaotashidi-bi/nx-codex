@echo off
setlocal
pushd "%~dp0..\mcp"
call npm.cmd ci
if errorlevel 1 exit /b %errorlevel%
call npm.cmd run verify
set NX_CODEX_RESULT=%errorlevel%
popd
exit /b %NX_CODEX_RESULT%

