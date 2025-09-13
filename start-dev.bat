@echo off
echo Starting EXP Technology Development Environment...
echo.

echo Building and starting containers...
docker-compose -f docker-compose.dev.yml up --build

echo.
echo Development environment started!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5001
echo.
pause
