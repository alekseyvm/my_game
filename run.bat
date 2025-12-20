@echo off
REM Переходим в директорию, где лежит этот .bat (и websitino.exe)
cd /d "%~dp0"

REM Порт, на котором будет работать websitino
set PORT=8080

REM Запускаем websitino в отдельном окне
start "" "%~dp0\server\websitino.exe" --port %PORT% --index

REM Небольшая пауза, чтобы сервер успел подняться
timeout /t 2 >nul

REM Открываем URL в браузере по умолчанию
start "" "http://localhost:%PORT%/"
