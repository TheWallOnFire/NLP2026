# Professional Fullstack Web Project

This directory contains a professional-grade fullstack application layout featuring a React frontend and a Python (FastAPI/Flask) backend.

## Architecture Overview

- **`/frontend`**: React application built with Vite/Next.js.
  - `src/`: Application source code (components, hooks, state management).
  - `public/`: Static assets.
- **`/backend`**: Python backend API.
  - `app/`: Core application logic, routes, and models.
  - `tests/`: Unit and integration tests.
- **`/infrastructure`**: DevOps and deployment configuration.
  - `docker/`: Dockerfiles for different environments.
  - `nginx/`: Reverse proxy configuration.
- **`docker-compose.yml`**: Local development orchestration.
- **`.github/workflows/`**: CI/CD pipelines for automated testing and deployment.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Docker & Docker Compose

### Development Setup
1. **Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Production Deployment
Use the provided Docker configurations in the `infrastructure` folder to build and deploy your services.
