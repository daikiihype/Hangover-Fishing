@echo off
rem Hangover Fishing - inicia um servidor local para jogar (computador e celular na mesma rede).
rem Requer Python instalado (comando "py" ou "python"). Nao instala nada.
title Hangover Fishing - servidor local
cd /d "%~dp0"
echo.
echo  ==========================================================
echo   HANGOVER FISHING - servidor local (porta 8765)
echo  ==========================================================
echo.
echo   No computador:  http://localhost:8765/jogo/
echo.
echo   No celular (conectado na MESMA rede Wi-Fi), use um destes:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do for /f "tokens=* delims= " %%b in ("%%a") do echo     http://%%b:8765/jogo/
echo.
echo   Se o Windows perguntar sobre o firewall, permita o acesso em "redes privadas".
echo   Para encerrar: feche esta janela (ou Ctrl+C).
echo.
rem abre o navegador 2 s depois (tempo para o servidor ficar pronto)
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:8765/jogo/'"
py -m http.server 8765 --bind 0.0.0.0 2>nul || python -m http.server 8765 --bind 0.0.0.0
if errorlevel 1 (
  echo.
  echo   Nao foi possivel iniciar o servidor. Verifique se o Python esta instalado
  echo   ou se a porta 8765 ja esta em uso por outra janela.
  pause
)
