# SmartPark AI - Production Readiness Checklist

This document outlines the security, operations, performance, and configurations checks required before promoting the SmartPark AI application to a production environment.

---

## 1. Security Compliance Check

- [ ] **Secure Communication (SSL/TLS)**
  - All communication is routed over HTTPS / WSS.
  - HTTP Strict Transport Security (HSTS) is enabled with a 1-year max-age (`max-age=31536000`), including subdomains and preloading.
- [ ] **Cross-Origin Resource Sharing (CORS)**
  - Hardcoded wildcards (`*`) or dev endpoints (`http://localhost:5173`) are removed or set to fail back.
  - Allowed origins are loaded dynamically from the `ALLOWED_ORIGINS` environment variable.
  - `Access-Control-Allow-Credentials` is set to `true` to allow bearer headers/cookies, but restrict origins to explicit domains.
- [ ] **Clickjacking & Content Type Security**
  - `X-Frame-Options` is set to `DENY` to prevent clickjacking attacks.
  - `X-Content-Type-Options` is set to `nosniff` to avoid MIME sniffing exploits.
- [ ] **Content Security Policy (CSP)**
  - CSP is configured on both the Nginx runner and Vercel hosting, restricting script and resource load targets to `'self'` and authorized content origins.
- [ ] **Authentication & Signatures**
  - JWT Signature uses a secure 256-bit key injected via the `JWT_SECRET` environment variable.
  - Key signature length is verified (minimum 32 bytes) to prevent Spring Security initialization failures.
  - Endpoints other than public routes (`/api/auth/**`, `/v3/api-docs/**`, `/swagger-ui/**`, and WebSocket `/ws/**`) require authentication.

---

## 2. Database Durability & Operations

- [ ] **Schema Maintenance Policy**
  - `spring.jpa.hibernate.ddl-auto` is set to `validate` in the `prod` profile.
  - Schema modifications must be applied using database migration scripts (e.g., Flyway/Liquibase or direct Neon SQL execution), not automatically by Hibernate.
- [ ] **Connection Pool Limits**
  - Hikari configuration limit `spring.datasource.hikari.maximum-pool-size` is set (default `10`).
  - Active idle connection timeouts (`spring.datasource.hikari.idle-timeout=30000`) prevent leaked sockets in serverless Neon environments.
- [ ] **Backups**
  - Auto-snapshots are active in the Neon DB console.

---

## 3. Configuration Safety

- [ ] **No Hardcoded Secrets**
  - Zero plain-text credentials, database tokens, or JWT keys exist in the codebase.
  - Checked all properties files (`application.properties` and `application-prod.properties`) for raw strings.
- [ ] **Active Profiles**
  - The runtime container is hardcoded to run with the `-Dspring.profiles.active=prod` flag, ensuring configuration values are loaded correctly from `application-prod.properties`.

---

## 4. Performance & Build Optimizations

- [ ] **Frontend Package Sizing**
  - Compiles without error via `npm run build` using the Vite builder.
  - Bundle split configuration prevents heavy individual file sizes (Vite automatically warning on chunks larger than 500kB).
- [ ] **Nginx Serving & Static Files Caching**
  - `nginx.conf` has static assets caching enabled (`/assets/` set to expire in 1 year).
  - Gzip compression is enabled for text, CSS, JS, and JSON data.
- [ ] **Backend Run Footprint**
  - Running on Java 21 JRE, using Eclipse Temurin minimal headless execution base.
  - Spring Boot logging level is set to `INFO` (disable debug SQL printing: `spring.jpa.show-sql=false`).

---

## 5. Deployment Readiness Verification

- [ ] CI/CD pipeline validates compiles on both backend and frontend projects.
- [ ] Dockerfiles build successfully on native and CI runners.
- [ ] Test coverage checks succeed prior to image creation.
