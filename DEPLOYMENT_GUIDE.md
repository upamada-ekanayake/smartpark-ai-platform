# SmartPark AI - Production Deployment Guide

This guide provides step-by-step instructions for setting up and deploying the SmartPark AI application in a production environment.

---

## 1. Architecture Overview
```mermaid
graph TD
    User([User Client]) -->|HTTPS| Frontend[Frontend: Vercel / Nginx]
    Frontend -->|REST APIs / WSS| Backend[Backend: Spring Boot on Cloud Run]
    Backend -->|JDBC Connection Pool| Database[(Database: Neon Serverless PostgreSQL)]
```

---

## 2. Database Provisioning (Neon PostgreSQL)

SmartPark AI utilizes **Neon Serverless PostgreSQL** for its persistence layer.

### Step-by-Step Setup:
1. **Create a Neon Project**:
   - Log in to [Neon Console](https://console.neon.tech/).
   - Click **Create New Project**. Set the name to `smartpark-prod` and select the preferred region close to your Cloud Run application.
2. **Retrieve Connection String**:
   - Navigate to the **Connection Details** section of your Neon Dashboard.
   - Copy the connection string in the `PostgreSQL` format (e.g., `postgresql://user:password@ep-host-1234.region.neon.tech/neondb?sslmode=require`).
3. **Configure Connection Sizing**:
   - Because Neon is serverless and scales down to zero, Hikari connection pool limits should be configured carefully.
   - Set maximum pool connections to `10` to avoid locking the pool in Neon during scaling events.

---

## 3. Backend Deployment (Google Cloud Run)

The Spring Boot backend is packaged as a Docker container and deployed to Google Cloud Run.

### Environment Variables Matrix
Set the following environment variables in the Cloud Run service definition or secret manager:

| Environment Variable | Description | Recommended Value |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Active spring profile | `prod` |
| `PORT` | Container binding port | `8080` (Managed dynamically by Cloud Run) |
| `DB_URL` | Neon JDBC URL (needs `jdbc:` prefix) | `jdbc:postgresql://ep-host-1234.neon.tech/neondb?sslmode=require` |
| `DB_USER` | Neon username | `[provided-by-neon]` |
| `DB_PASSWORD` | Neon password | `[provided-by-neon]` |
| `JWT_SECRET` | Secret key for JWT signing | Use a 256-bit secure key (Base64) |
| `JWT_EXPIRATION` | Expiration limit of JWT (ms) | `86400000` (24 Hours) |
| `ALLOWED_ORIGINS` | Permitted CORS headers | `https://smartpark-frontend.vercel.app` |

### Manual Docker Build and Deploy
If you need to deploy manually from your command line:

```powershell
# 1. Build and tag the Docker image locally
docker build -t gcr.io/[PROJECT_ID]/smartpark-backend:latest ./smartpark-backend

# 2. Push the image to Google Container Registry
docker push gcr.io/[PROJECT_ID]/smartpark-backend:latest

# 3. Deploy to Cloud Run
gcloud run deploy smartpark-backend `
  --image gcr.io/[PROJECT_ID]/smartpark-backend:latest `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --set-env-vars "SPRING_PROFILES_ACTIVE=prod,DB_URL=jdbc:postgresql://[HOST]/neondb?sslmode=require,DB_USER=[USER],DB_PASSWORD=[PASSWORD],JWT_SECRET=[SECRET],ALLOWED_ORIGINS=https://smartpark-frontend.vercel.app"
```

---

## 4. Frontend Deployment (Vercel)

The TypeScript React frontend can be served either via an Nginx container or hosted on Vercel.

### Option A: Hosting on Vercel (Recommended)
Vercel is the easiest method for hosting static single page applications (SPAs).

1. **Vercel CLI / Dashboard Integration**:
   - Link your project repository to Vercel.
   - Choose Vite as the framework preset.
   - Specify the root directory as `smartpark-frontend`.
2. **Environment Variables**:
   - In the Vercel project settings, define:
     - `VITE_API_BASE_URL` = `https://[your-cloud-run-domain]/api`
     - `VITE_WS_URL` = `https://[your-cloud-run-domain]/ws`
3. **Routing Configuration**:
   - Vercel automatically respects the [vercel.json](file:///c:/Users/USER/OneDrive/Documents/PROJECTS/New%20folder/smartpark-frontend/vercel.json) configuration, which enables secure headers and redirects deep links back to `index.html` to prevent 404 errors during client-side navigation.

### Option B: Docker Container Deployment (Nginx)
If deploying the frontend to a server or Kubernetes:

```powershell
# Build the frontend container with build-time environment arguments
docker build `
  --build-arg VITE_API_BASE_URL=https://smartpark-backend-domain/api `
  --build-arg VITE_WS_URL=https://smartpark-backend-domain/ws `
  -t gcr.io/[PROJECT_ID]/smartpark-frontend:latest ./smartpark-frontend

# Run the frontend locally or deploy it to a server
docker run -d -p 80:80 gcr.io/[PROJECT_ID]/smartpark-frontend:latest
```

---

## 5. CI/CD Integration (GitHub Actions)

We have configured a fully automated CI/CD pipeline in `.github/workflows/deploy.yml` that triggers on push events to `main` and `master`.

### Setup Repository Secrets:
Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions** and add the following secrets:

| Secret Name | Purpose | Example Value |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | Your Google Cloud project ID | `smartpark-ai-411200` |
| `GCP_REGION` | Compute region for Google Cloud Run | `us-central1` |
| `GCP_SA_KEY` | Google Service Account Key (JSON format) | `{"type": "service_account", ...}` |
| `DB_URL` | Production Neon JDBC Connection string | `jdbc:postgresql://ep-host-1234.neon.tech/neondb` |
| `DB_USER` | Production Neon DB username | `smartpark_admin` |
| `DB_PASSWORD` | Production Neon DB password | `supersecretpassword` |
| `JWT_SECRET` | Secret signature token | `mySecureBase64StringForSigningJwtTokens` |
| `ALLOWED_ORIGINS` | Whitelisted CORS hostnames | `https://smartpark.vercel.app` |
| `VERCEL_TOKEN` | Vercel Access token | `[generated in vercel user settings]` |
| `VERCEL_ORG_ID` | Vercel organization identifier | `team_abc123` |
| `VERCEL_PROJECT_ID` | Vercel project identifier | `prj_xyz789` |

---

## 6. Local Production Testing

To run the production setup locally using Docker Compose, create a `docker-compose.yml` in the root:

```yaml
version: '3.8'
services:
  backend:
    build: ./smartpark-backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_URL=jdbc:postgresql://host.docker.internal:5432/neondb
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - JWT_SECRET=productionSuperSecretSigningKeyThatIsLongEnoughToPreventErrors
      - ALLOWED_ORIGINS=http://localhost

  frontend:
    build:
      context: ./smartpark-frontend
      args:
        - VITE_API_BASE_URL=http://localhost:8080/api
        - VITE_WS_URL=http://localhost:8080/ws
    ports:
      - "80:80"
    depends_on:
      - backend
```
