#!/bin/bash
# Script de démarrage rapide pour HRMS SaaS

echo "========================================"
echo "   HRMS SaaS - Démarrage Docker"
echo "========================================"
echo ""

echo "[1/3] Démarrage des services Docker..."
docker-compose up --build -d

echo ""
echo "[2/3] Attente du démarrage de PostgreSQL..."
sleep 10

echo ""
echo "[3/3] Exécution des migrations..."
docker-compose exec -T backend python manage.py migrate

echo ""
echo "========================================"
echo "   Services démarrés avec succès!"
echo "========================================"
echo ""
echo "Frontend:     http://localhost:5173"
echo "Backend API:  http://localhost:8000"
echo "Admin:        http://localhost:8000/admin"
echo "API Docs:     http://localhost:8000/api/docs"
echo ""
echo "Pour créer un superuser, exécutez:"
echo "  docker-compose exec backend python manage.py createsuperuser"
echo ""
echo "Pour voir les logs:"
echo "  docker-compose logs -f"
echo ""
echo "Pour arrêter:"
echo "  docker-compose down"
echo ""
