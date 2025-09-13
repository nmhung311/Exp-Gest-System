@echo off
echo Stopping EXP Technology Docker Environment...
echo.

echo Stopping development containers...
docker-compose -f docker-compose.dev.yml down

echo Stopping production containers...
docker-compose down

echo.
echo All containers stopped!
echo.
pause
