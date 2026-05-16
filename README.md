# TaskFlow — Enterprise Team Task Manager

TaskFlow is a modern, full-stack team task management application built with the **MERN Stack** (MongoDB, Express, React, Node.js). Designed with a premium, high-contrast minimalistic dark UI, TaskFlow provides teams with the necessary tools to organize workspaces, manage projects, track tasks, and analyze productivity metrics seamlessly.

Live URL - https://team-task-manager-production-f754.up.railway.app

## ✨ Features

- **Professional Dashboard:** Real-time metrics, KPI cards, and Recharts-powered data visualization (donut charts, bar charts, completion trends).
- **Workspaces & Projects:** Organize your team into dedicated workspaces and isolated projects.
- **Task Management:** Create, assign, prioritize, and track tasks with intuitive data tables.
- **Role-Based Access Control (RBAC):** Secure authorization differentiating between Admins and Members.
- **Premium UI/UX:** A highly responsive, fast, and sleek dark-mode design system with micro-animations and glassmorphism accents.
- **Authentication:** Secure JWT-based authentication system.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Vanilla CSS with custom design system variables
- **Routing:** React Router DOM v6
- **Data Visualization:** Recharts
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ORM)
- **Authentication:** JSON Web Tokens (JWT) & bcrypt

## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sagarnishad2526-code/Team-Task-Manager.git
   cd Team-Task-Manager
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_key
   ```
   Start the backend server:
   ```bash
   npm run dev
   ```

3. **Frontend Setup:**
   Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
   Start the Vite development server:
   ```bash
   npm run dev
   ```

4. **Access the application:**
   Open your browser and navigate to `http://localhost:5173`.

## 📁 Project Structure

```
Team-Task-Manager/
├── backend/
│   ├── src/
│   │   ├── app.js         # Main Express application entry point
│   │   ├── models/        # Mongoose schemas (User, Task, Project, Workspace)
│   │   └── ...
│   ├── package.json
│   └── .env               
└── frontend/
    ├── src/
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # Application views (Dashboard, Projects, etc.)
    │   ├── App.jsx        # React application root
    │   ├── index.css      # Global design system & theme variables
    │   └── api.js         # Axios interceptors and API configuration
    ├── index.html
    └── vite.config.js
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/sagarnishad2526-code/Team-Task-Manager/issues).

## 📝 License

This project is licensed under the MIT License.
