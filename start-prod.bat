@echo off
echo Starting EXP Technology Production Environment...
echo.

echo Building and starting containers...
docker-compose up --build

echo.
echo Production environment started!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5001
echo.
pause
