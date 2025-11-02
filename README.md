# Yu-Gi-Oh! Collection Manager

A full-stack web application for managing your Yu-Gi-Oh! card collection. Built with React frontend and Node.js backend, featuring card data management, image storage, and quantity tracking.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![Express](https://img.shields.io/badge/Express-5.1.0-lightgrey)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## 🚀 Features

- **Card Collection Management**: Track your Yu-Gi-Oh! card quantities
- **Card Data**: Complete card information including descriptions, types, and metadata
- **Image Support**: Display card images from local storage
- **Search & Filter**: Find cards quickly in your collection
- **Responsive UI**: Built with Chakra UI for a modern interface
- **Docker Support**: Containerized deployment ready
- **API Backend**: RESTful API for card data and collection management

## 🏗️ Architecture

```
yugioh-collection-manager/
├── backend/                # Node.js/Express API server
│   ├── database/           # Card data and SQLite database
│   ├── scripts/            # Utility scripts for data management
│   └── server.js           # Main backend server
├── frontend/               # React application
│   ├── public/images       # Card image storage
│   ├── src/                # React components and logic
│   └── dist/               # Built frontend assets
├── docker-compose.yml      # Multi-container setup
└── package.json            # Monorepo scripts and dependencies
```

## 📋 Prerequisites

- **Node.js** 18+ and npm 8+
- **Docker** and Docker Compose (optional, for containerized deployment)

## 🔧 Installation

### Method 1: Local Development (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd yugioh
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Start both backend and frontend**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:3000`
   - Frontend development server on `http://localhost:5173`

### Method 2: Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   npm run docker:up:build
   ```

   This will start:
   - Backend on `http://localhost:3000`
   - Frontend on `http://localhost`

### Method 3: Server Deployment (Debian/Ubuntu)

For production deployment on a Debian server:

1. **One-command deployment**
   ```bash
   curl -sSL https://raw.githubusercontent.com/chappomann/yugioh/main/scripts/deploy-server.sh | bash
   ```

2. **Manual deployment**
   ```bash
   git clone https://github.com/chappomann/yugioh.git /opt/yugioh
   cd /opt/yugioh
   ./scripts/deploy-server.sh
   ```

   See [SERVER-SETUP.md](SERVER-SETUP.md) for detailed server deployment guide.

## 📦 Available Scripts

### Root Level Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both backend and frontend in development mode |
| `npm start` | Alias for `npm run dev` |
| `npm run install:all` | Install dependencies for all packages |
| `npm run build` | Build frontend for production |
| `npm run docker:up` | Start Docker containers (production) |
| `npm run docker:up:build` | Build and start Docker containers (production) |
| `npm run docker:up:detach` | Start Docker containers in background |
| `npm run docker:down` | Stop Docker containers |
| `npm run docker:dev` | Start Docker containers (development with hot-reload) |
| `npm run docker:dev:build` | Build and start Docker containers (development) |
| `npm run docker:logs` | View logs from all containers |
| `npm run docker:clean` | Stop containers and clean up Docker resources |
| `npm run setup` | Complete setup (install + build Docker) |

### Data Management Scripts

| Script | Description |
|--------|-------------|
| `npm run get-cards` | Fetch latest card data from API |
| `npm run get-images` | Download card images |
| `npm run sql-to-json` | Convert SQLite data to JSON |

### Individual Package Scripts

**Backend (`cd backend`):**
- `npm run dev` - Start backend server
- `npm run start` - Start backend server
- `npm run get-cards` - Fetch card data
- `npm run get-images` - Download images

**Frontend (`cd frontend`):**
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🐳 Docker Usage

### Development with Docker
### Production Deployment
```bash
# Build and start production containers
npm run docker:up:build

# Start in background
npm run docker:up:detach

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### Development with Docker (Hot-Reload)
```bash
# Start development containers with hot-reload
npm run docker:dev:build

# Backend: http://localhost:3000
# Frontend: http://localhost:5173

# Stop development containers
npm run docker:dev:down
```

### Docker Architecture
The Docker setup includes:
- **Backend**: Node.js Alpine container with security hardening
- **Frontend**: Nginx Alpine container serving optimized React build
- **Health Checks**: Automatic health monitoring for both services
- **Networking**: Internal Docker network for secure service communication
- **Volumes**: Persistent storage for card data and images
- **Security**: Non-root users, minimal attack surface

### Docker Commands
```bash
# Production (Nginx + Node.js)
npm run docker:up:build    # Build and start
npm run docker:logs        # View all logs
npm run docker:restart     # Restart services
npm run docker:clean       # Clean up resources

# Development (Hot-reload)
npm run docker:dev:build   # Build and start dev environment
npm run docker:dev:down    # Stop dev environment

# Individual service logs
npm run docker:logs:backend   # Backend logs only
npm run docker:logs:frontend  # Frontend logs only
```

## 🔧 Configuration

### Backend Configuration
- **Port**: 3000 (configurable via PORT environment variable)
- **Database**: SQLite database in `backend/database/`
- **Images**: Stored in `backend/images/`
- **CORS**: Enabled for frontend communication
- **Health Check**: Built-in health monitoring

### Frontend Configuration
- **Development Port**: 5173 (Vite default)
- **Production**: Served via Nginx on port 80
- **API Proxy**: Nginx routes `/api/*` requests to backend
- **Image Proxy**: Nginx routes `/images/*` requests to backend

## 📁 Project Structure

```
├── backend/
│   ├── Dockerfile              # Backend container config
│   ├── package.json            # Backend dependencies
│   ├── server.js              # Express server
│   ├── database/
│   │   └── yugioh_card_data.json
│   ├── images/                # Card images directory
│   └── scripts/
│       ├── cardinfo.js        # Card data fetching
│       ├── images.js          # Image downloading
│       └── update_quantities.js
├── frontend/
│   ├── Dockerfile             # Frontend container config
│   ├── nginx.conf             # Nginx configuration
│   ├── package.json           # Frontend dependencies
│   ├── index.html             # Entry HTML
│   ├── vite.config.js         # Vite configuration
│   └── src/
│       ├── App.jsx            # Main React component
│       └── main.jsx           # React entry point
├── docker-compose.yml         # Multi-container orchestration
└── package.json               # Root package with scripts
```

## 🌐 API Endpoints

The backend provides the following API endpoints:

- `GET /api/cards` - Get all cards with quantities
- `GET /api/cards/:id` - Get specific card details
- `PUT /api/cards/:id` - Update card quantity
- `GET /images/:filename` - Serve card images
- `GET /health` - Health check endpoint

## 🔄 Development Workflow

1. **Start Development**
   ```bash
   npm run dev
   ```

2. **Make Changes**
   - Backend changes auto-restart the server
   - Frontend changes hot-reload in browser

3. **Update Card Data**
   ```bash
   npm run get-cards    # Fetch latest card data
   npm run get-images   # Download missing images
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

5. **Deploy with Docker**
   ```bash
   npm run docker:up:build
   ```

## 🧩 Technology Stack

### Frontend
- **React** 18.3.1 - UI framework
- **Chakra UI** 2.10.9 - Component library
- **Framer Motion** 11.x - Animations
- **Axios** - HTTP client
- **Vite** - Build tool and dev server

### Backend
- **Node.js** 18+ - Runtime
- **Express** 5.1.0 - Web framework
- **CORS** - Cross-origin support
- **SQLite** - Local database (via scripts)

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Frontend web server and reverse proxy
- **Concurrently** - Parallel script execution

## 🚨 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Check what's using the port
lsof -i :3000
lsof -i :5173

# Kill the process
kill -9 <PID>
```

**Docker build fails:**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

**Frontend won't connect to backend:**
- Ensure backend is running on port 3000
- Check CORS configuration in backend
- Verify API proxy in nginx.conf (Docker) or vite.config.js (dev)

**Missing card images:**
```bash
# Download images
npm run get-images
```

## 📄 License

ISC License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Test Docker build with `npm run docker:up:build`
6. Submit a pull request

---

For more help, check the individual README files in the `backend/` and `frontend/` directories or open an issue on GitHub.