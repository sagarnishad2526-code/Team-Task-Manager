# TaskFlow — Team Task Manager

A full-stack team task management application with role-based access control, project tracking, and a glassmorphic dark UI.

## 🔗 Live Demo

> **Deployed on Railway** — https://team-task-manager-production-2e084.up.railway.app

## ✨ Features

- **Authentication** — JWT-based signup/login with Admin & Member roles
- **Projects** — Create, manage and track projects with deadlines and progress
- **Task Management** — Create tasks with priority levels, due dates, and assignees
- **Kanban Board** — Visual drag-like board with Todo / In Progress / Review / Done columns
- **Dashboard** — Stats overview with recent tasks and overdue alerts
- **Role-Based Access** — Admins manage members; members contribute to assigned projects
- **Immersive UI** — Dark glassmorphism with animated backgrounds and micro-interactions

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT + bcryptjs |
| Styling | Pure CSS — Glassmorphism design system |
| Deployment | Railway |

## 🚀 Local Development

### Prerequisites
- Node.js 18+

### Backend
```bash
cd backend
npm install
# create .env from .env.example
cp .env.example .env
# Edit JWT_SECRET to a random string
npm run dev
```
Backend runs on **http://localhost:5000**

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on **http://localhost:5173**
The Vite dev server proxies `/api` requests to the backend automatically.

## 🌐 Deploy to Railway

### Backend Service
1. Create a new Railway project
2. Add a service from your GitHub repo, set **Root Directory** to `backend`
3. Add environment variables:
   - `JWT_SECRET` = a long random string
   - `PORT` = 5000 (or Railway will set this automatically)
4. Deploy — Railway auto-detects Node.js

### Frontend Service
1. Add another service in the same Railway project, set **Root Directory** to `frontend`
2. Add environment variables:
   - `VITE_API_URL` = `https://your-backend-service.railway.app/api`
3. Deploy

## 📡 REST API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/auth/users` | ✅ | All users (for assigning) |
| GET | `/api/projects` | ✅ | My projects |
| POST | `/api/projects` | ✅ | Create project |
| GET | `/api/projects/:id` | ✅ | Project detail + tasks |
| PUT | `/api/projects/:id` | ✅ Admin | Update project |
| DELETE | `/api/projects/:id` | ✅ Admin | Delete project |
| POST | `/api/projects/:id/members` | ✅ Admin | Add member |
| DELETE | `/api/projects/:id/members/:uid` | ✅ Admin | Remove member |
| GET | `/api/tasks` | ✅ | List tasks (filterable) |
| POST | `/api/tasks` | ✅ | Create task |
| PUT | `/api/tasks/:id` | ✅ | Update task |
| DELETE | `/api/tasks/:id` | ✅ | Delete task |
| GET | `/api/dashboard` | ✅ | Dashboard stats |

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── src/
│   │   ├── app.js          # Express app + dashboard route
│   │   ├── db.js           # SQLite schema & connection
│   │   ├── middleware/
│   │   │   └── auth.js     # JWT middleware
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── projects.js
│   │       └── tasks.js
│   ├── .env.example
│   ├── package.json
│   └── railway.toml
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Projects.jsx
    │   │   └── ProjectDetail.jsx
    │   ├── App.jsx
    │   ├── AuthContext.jsx
    │   ├── api.js
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── railway.toml
```

## 👥 Role-Based Access

| Action | Member | Admin |
|--------|--------|-------|
| View own projects | ✅ | ✅ |
| Create projects | ✅ | ✅ |
| Edit/Delete own project | ✅ | ✅ |
| Edit/Delete any project | ❌ | ✅ |
| Add members to project | Project Admin only | ✅ |
| Create tasks | ✅ | ✅ |
| Update own tasks | ✅ | ✅ |
| Delete any task | ❌ | ✅ |
