# HRMS SaaS - Plateforme Moderne de Gestion RH 🚀

Système complet de gestion des ressources humaines avec architecture SaaS, multi-tenancy, et interface moderne.

## 🎯 Fonctionnalités

### ✅ Actuellement implémenté
- 🔐 **Authentification JWT** avec refresh automatique
- 👥 **Gestion des employés** (CRUD complet)
- 🏢 **Gestion des départements**
- 📅 **Gestion des congés** avec workflow d'approbation
- 🎨 **UI moderne** avec TailwindCSS + shadcn/ui
- 🐳 **Docker** pour développement et production
- 📊 **Dashboard** avec analytics
- 🔍 **Recherche et filtres** avancés

### 🚧 En développement
- Multi-tenancy (organisations)
- Système de rôles et permissions
- Suivi des présences
- Gestion documentaire
- Intégration Stripe pour abonnements
- Notifications en temps réel
- Export PDF/Excel

## 🛠️ Stack Technique

### Backend
- **Django 5.0** + **Django REST Framework**
- **PostgreSQL** (base de données)
- **Redis** (cache & Celery)
- **Celery** (tâches asynchrones)
- **JWT** (authentification)
- **Stripe** (paiements)
- **Docker** (containerisation)

### Frontend
- **React 18** + **Vite**
- **TailwindCSS** (styling)
- **shadcn/ui** (composants)
- **React Router** (navigation)
- **TanStack Query** (state management)
- **React Hook Form** + **Zod** (formulaires)
- **Recharts** (graphiques)

## 🚀 Démarrage Rapide avec Docker

### Prérequis
- Docker Desktop installé
- Git

### Installation

1. **Cloner le projet**
```bash
cd hrms_base_project
```

2. **Lancer avec Docker Compose**
```bash
docker-compose up --build
```

3. **Créer un superuser (dans un nouveau terminal)**
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

4. **Accéder à l'application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Admin Django: http://localhost:8000/admin
- API Docs (Swagger): http://localhost:8000/api/docs

### Services Docker

Le `docker-compose.yml` lance automatiquement :
- ✅ PostgreSQL (port 5432)
- ✅ Redis (port 6379)
- ✅ Django Backend (port 8000)
- ✅ Celery Worker
- ✅ Celery Beat
- ✅ React Frontend (port 5173)

## 📦 Installation Manuelle (sans Docker)

### Backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
copy .env.example .env
# Éditer .env avec vos configurations

# Migrations
python manage.py migrate

# Créer un superuser
python manage.py createsuperuser

# Lancer le serveur
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

## 🔧 Configuration

### Variables d'environnement (Backend)

Créer un fichier `.env` dans `/backend` :

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://hrms_user:hrms_password@db:5432/hrms_db

# Redis
REDIS_URL=redis://redis:6379/0

# Stripe
STRIPE_PUBLIC_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key

# Email
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### Variables d'environnement (Frontend)

Créer un fichier `.env` dans `/frontend` :

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 📚 API Documentation

Une fois le backend lancé, accédez à la documentation interactive :
- **Swagger UI**: http://localhost:8000/api/docs
- **OpenAPI Schema**: http://localhost:8000/api/schema

### Endpoints principaux

#### Authentification
```
POST /api/auth/token/          # Obtenir access + refresh tokens
POST /api/auth/token/refresh/  # Rafraîchir le token
```

#### Employés
```
GET    /api/employees/         # Liste des employés
POST   /api/employees/         # Créer un employé
GET    /api/employees/{id}/    # Détails d'un employé
PUT    /api/employees/{id}/    # Modifier un employé
DELETE /api/employees/{id}/    # Supprimer un employé
```

#### Départements
```
GET    /api/departments/       # Liste des départements
POST   /api/departments/       # Créer un département
GET    /api/departments/{id}/  # Détails d'un département
PUT    /api/departments/{id}/  # Modifier un département
DELETE /api/departments/{id}/  # Supprimer un département
```

#### Congés
```
GET    /api/leaves/            # Liste des demandes de congés
POST   /api/leaves/            # Créer une demande
GET    /api/leaves/{id}/       # Détails d'une demande
PUT    /api/leaves/{id}/       # Modifier une demande
DELETE /api/leaves/{id}/       # Supprimer une demande
```

## 🧪 Tests

### Backend
```bash
cd backend
pytest
pytest --cov=api  # Avec coverage
```

### Frontend
```bash
cd frontend
npm run test
```

## 🐳 Commandes Docker Utiles

```bash
# Démarrer les services
docker-compose up

# Démarrer en arrière-plan
docker-compose up -d

# Arrêter les services
docker-compose down

# Voir les logs
docker-compose logs -f

# Reconstruire les images
docker-compose up --build

# Exécuter une commande dans un container
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser

# Accéder au shell Django
docker-compose exec backend python manage.py shell

# Accéder à PostgreSQL
docker-compose exec db psql -U hrms_user -d hrms_db
```

## 📁 Structure du Projet

```
hrms_base_project/
├── backend/
│   ├── api/                    # Application Django principale
│   │   ├── models.py          # Modèles (Employee, Department, Leave)
│   │   ├── serializers.py     # Serializers DRF
│   │   ├── views.py           # ViewSets API
│   │   ├── urls.py            # Routes API
│   │   └── admin.py           # Configuration admin
│   ├── config/                 # Configuration Django
│   │   ├── settings.py        # Settings avec env variables
│   │   ├── urls.py            # URLs principales
│   │   └── celery.py          # Configuration Celery
│   ├── requirements.txt        # Dépendances Python
│   ├── Dockerfile             # Image Docker backend
│   └── .env                   # Variables d'environnement
├── frontend/
│   ├── src/
│   │   ├── components/        # Composants React
│   │   │   ├── ui/           # Composants shadcn/ui
│   │   │   └── layout/       # Sidebar, Header
│   │   ├── pages/            # Pages de l'application
│   │   │   ├── auth/         # Login, Register
│   │   │   ├── dashboard/    # Dashboard
│   │   │   ├── employees/    # Gestion employés
│   │   │   ├── departments/  # Gestion départements
│   │   │   └── leaves/       # Gestion congés
│   │   ├── layouts/          # Layouts (Dashboard, Auth)
│   │   ├── lib/              # Utilitaires
│   │   │   ├── api-client.js # Client API Axios
│   │   │   └── utils.js      # Helpers
│   │   ├── App.jsx           # Composant principal
│   │   └── main.jsx          # Point d'entrée
│   ├── package.json           # Dépendances Node
│   ├── tailwind.config.js     # Config TailwindCSS
│   ├── Dockerfile            # Image Docker frontend
│   └── vite.config.js        # Config Vite
└── docker-compose.yml         # Orchestration Docker
```

## 🎨 Design System

Le projet utilise **shadcn/ui** avec **TailwindCSS** pour un design moderne et cohérent.

### Couleurs principales
- **Primary**: Indigo (#4F46E5)
- **Secondary**: Purple (#7C3AED)
- **Success**: Green (#10B981)
- **Warning**: Orange (#F59E0B)
- **Error**: Red (#EF4444)

### Composants disponibles
- Button (variants: default, outline, ghost, destructive)
- Input, Select, Textarea
- Card, Dialog, Dropdown
- Toast notifications
- Table, Badge, Avatar

## 🔐 Sécurité

- ✅ JWT avec refresh automatique
- ✅ CORS configuré
- ✅ CSRF protection
- ✅ Password hashing (Django)
- ✅ Environment variables
- ✅ SQL injection protection (ORM)
- ✅ XSS protection

## 📈 Roadmap

### Phase 1 (En cours)
- [x] Docker setup
- [x] TailwindCSS + shadcn/ui
- [x] Authentification moderne
- [x] Dashboard de base
- [ ] Multi-tenancy
- [ ] Système de rôles

### Phase 2
- [ ] Gestion complète des congés
- [ ] Suivi des présences
- [ ] Gestion documentaire
- [ ] Notifications temps réel

### Phase 3
- [ ] Intégration Stripe
- [ ] Analytics avancés
- [ ] Export PDF/Excel
- [ ] API publique

### Phase 4
- [ ] Tests E2E
- [ ] CI/CD
- [ ] Déploiement production
- [ ] Monitoring

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

MIT

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Email: support@hrms-saas.com

---

**Fait avec ❤️ par l'équipe HRMS SaaS**
