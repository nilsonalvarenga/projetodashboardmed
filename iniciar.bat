@echo off
setlocal
set "ROOT=%~dp0"
set "PATH=%ROOT%.runtime\node-v20.18.1-win-x64;%PATH%"
cd /d "%ROOT%"
echo ============================================================
echo   Dashboard Medico RAG
echo   Iniciando servidor de desenvolvimento...
echo   Abra no navegador:  http://localhost:3000
echo   (Pressione Ctrl+C nesta janela para parar)
echo ============================================================
echo.
call npm run dev
pause
