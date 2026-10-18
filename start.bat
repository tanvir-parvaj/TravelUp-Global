@echo off
title TravelUp Global Server
echo ===================================================
echo 🚀 Starting TravelUp Global Backend & Web Server...
echo 🔗 URL: http://localhost:5000
echo ===================================================
timeout /t 2 /nobreak >nul
start "" http://localhost:5000/login.html
cd /d "%~dp0server"
node server.js
pause
