# Yugioh Card Collection - Root

This directory contains the Yugioh Card Collection Manager project, including both backend and frontend applications.

## Structure
- `backend/` - Node.js/Express API and database logic
- `frontend/` - React web application (Vite + MUI)

## Getting Started

1. Install dependencies for both backend and frontend:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   note: npm run build:all && npm run start (does it all)
   ```
2. Configure environment variables as needed (see backend/README.md).
3. Start the backend and frontend development servers:
   ```bash
   # In backend
   npm run dev
   # In frontend (in a new terminal)
   npm run dev
   ```

## Build
- Build backend: `npm run build` (in backend)
- Build frontend: `npm run build` (in frontend)

## Usage
- Access the web app at `http://localhost:5173` (or as configured)
- Backend API runs on the port specified in backend/.env

## More Info
- See `backend/README.md` and `frontend/README.md` for details on each part.
