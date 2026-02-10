# HRMS SaaS - Modern HR Platform 🚀

A premium, full-stack Human Resources Management System designed for modern organizations. Built with a focus on clean aesthetics ("Donezo" style) and powerful data-driven features.

## ✨ Key Features

- **📊 Dynamic Dashboard**: Live stats, HR activity charts, and upcoming reminders.
- **👥 Employee Lifecycle**: Modern card-based directory with advanced filtering.
- **📅 Leave Management**: Streamlined request and approval workflow.
- **🏢 Core HR**: Department structuring and organization management.
- **🔐 Secure Access**: Multi-tenant architecture with JWT authentication.
- **⏱️ Time & Attendance**: Built-in time tracker and attendance visualization.

## 🛠️ Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS + Shadcn UI + TanStack Query
- **Backend**: Django 5.0 + Django REST Framework
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **Deployment**: Fully Dockerized (Containerized setup)

## 🤝 Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) to learn about our branching strategy and pull request process.

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or `.venv\Scripts\activate` on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🐳 Docker Setup
Run the entire stack with a single command:
```bash
docker-compose up --build
```

---
*Developed with focus on Performance, Security, and User Experience.*
