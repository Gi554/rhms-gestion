@echo off
REM Script de démarrage rapide pour HRMS SaaS

echo ========================================
echo    HRMS SaaS - Demarrage Docker
echo ========================================
echo.

echo [1/3] Demarrage des services Docker...
docker-compose up --build -d

echo.
echo [2/3] Attente du demarrage de PostgreSQL...
timeout /t 10 /nobreak > nul

echo.
echo [3/3] Execution des migrations...
docker-compose exec -T backend python manage.py migrate

echo.
echo ========================================
echo    Services demarres avec succes!
echo ========================================
echo.
echo Frontend:     http://localhost:5173
echo Backend API:  http://localhost:8000
echo Admin:        http://localhost:8000/admin
echo API Docs:     http://localhost:8000/api/docs
echo.
echo Pour creer un superuser, executez:
echo   docker-compose exec backend python manage.py createsuperuser
echo.
echo Pour voir les logs:
echo   docker-compose logs -f
echo.
echo Pour arreter:
echo   docker-compose down
echo.
pause
