<div align="center">

# 🧭 CareerFlow

**A full-stack job search command center** — track companies, applications, interviews, recruiters, referrals, and follow-ups in one clean dashboard.

[![CI](https://github.com/VKGarg7/CareerFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/VKGarg7/CareerFlow/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-415%20passing-brightgreen)](#-testing)
[![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Testing](#-testing) • [API Docs](#-api-overview) • [Deployment](#-deployment)

🌐 **[Live App](https://YOUR-VERCEL-URL.vercel.app)** · 📘 **[Live API Docs (Swagger)](https://careerflow-backend-ravi.onrender.com/swagger-ui/index.html)**

> ℹ️ The backend runs on Render's free tier — the first request after a period of inactivity may take ~30s while the instance wakes up.

</div>

---

## 📖 Overview

CareerFlow is a personal career management tool built for job seekers who want to stay organized during their search. Instead of juggling spreadsheets and sticky notes, CareerFlow gives you a centralized dashboard to track every company you're targeting, every application you've submitted, every interview round, and every recruiter or referral contact you've spoken with — with real-time status updates and a clean, intuitive UI.

---

## ✨ Features

| | |
|---|---|
| 🔐 **Authentication** | JWT login/signup + Google, GitHub & LinkedIn OAuth2 social sign-in, BCrypt hashing, token blacklisting on logout, password reset via email |
| 📊 **Dashboard** | At-a-glance summary of your job search progress |
| 🏢 **Company Tracking** | Full pipeline: `Targeting → Applied → Interviewing → Offer / Rejected` |
| 📝 **Application Management** | Detailed statuses (`OA Scheduled`, `Interview Cleared`, `Offer Received`) & source (`LinkedIn`, `Referral`, `Naukri`) |
| 🎤 **Interview Management** | Interview rounds with timelines, notes, and outcomes |
| 🤝 **Recruiter Contacts** | Manage recruiter interactions with notes and status tracking |
| 🔗 **Referrals** | Track referral requests and their outcomes |
| ⏰ **Follow-Ups** | Keep on top of pending follow-up actions |
| 👤 **Profile Management** | Education, experience, projects, resume & cover letter uploads |
| 📁 **Document Storage** | Upload and retrieve resume and cover letter files |
| 🕓 **Activity Log** | Full audit trail of actions across the platform |
| 🛠️ **Admin Dashboard** | Role-based access, user management, audit logging, system health monitoring |
| ♻️ **Soft Deletes** | Nothing is permanently lost; deleted records are safely archived |

---

## 🧱 Tech Stack

<div align="center">

| Layer | Technology |
|:---:|:---|
| **Frontend** | React 19 · Vite · Tailwind CSS · Material-UI |
| **Backend** | Spring Boot 3.3 · Java 17 |
| **Database** | PostgreSQL |
| **Auth** | JWT (jjwt 0.12.6) · OAuth2 (Google / GitHub / LinkedIn) · BCrypt |
| **API Docs** | Swagger / SpringDoc OpenAPI |
| **HTTP Client** | Axios |
| **Testing** | JUnit 5 · Mockito · AssertJ (backend) · Vitest · React Testing Library (frontend) |
| **CI/CD** | GitHub Actions (build + full test suite on every push/PR) |
| **Build Tools** | Maven (backend) · npm (frontend) |

</div>

---

## 🗂️ Project Structure

```
CareerFlow/
├── backend/                          # Spring Boot application
│   └── src/main/java/com/careerflow/
│       ├── auth/                     # Login, signup, password reset
│       ├── user/                     # Profile & document management
│       ├── company/                  # Company tracking
│       ├── application/              # Job application tracking
│       ├── interview/                # Interview rounds, notes, outcomes
│       ├── recruiter/                # Recruiter contact management
│       ├── referral/                 # Referral tracking
│       ├── followup/                 # Follow-up reminders
│       ├── document/                 # File upload/download
│       ├── admin/                    # Admin dashboard & user management
│       ├── audit/                    # Audit logging
│       ├── config/                   # Security, JWT, OAuth2, CORS, Swagger, file storage
│       ├── common/                   # Base entities, soft delete, utilities
│       └── exception/                # Global error handling
│   └── src/test/java/com/careerflow/ # 211 JUnit 5 + Mockito tests mirroring the main packages
│
└── frontend/                         # React + Vite application
    └── src/
        ├── pages/                    # Login, Dashboard, Companies, Applications, Interviews, Recruiters, Referrals, FollowUps, Profile, Admin, Activity
        ├── components/               # Shared UI components (Layout, StatusBadge, etc.)
        ├── api/                      # Axios API client modules
        ├── hooks/                    # Custom hooks (pagination, filters, modals, shortcuts)
        ├── context/                  # ProfileContext (global profile state)
        └── utils/                    # Shared frontend utilities
                                      # *.test.js(x) files sit next to the code they test (204 Vitest tests)
```

---

## 🚀 Getting Started

### Prerequisites

- ☕ Java 17+
- 📦 Maven (or use the included `mvnw` wrapper)
- 🟢 Node.js 18+ and npm
- 🐘 PostgreSQL 14+

### Backend Setup

```bash
cd backend
cp src/main/resources/application.properties.example src/main/resources/application.properties
```

Edit `application.properties` with your local PostgreSQL credentials, JWT secret, and mail settings (see [Environment Variables](#-environment-variables)).

```bash
./mvnw spring-boot:run
```

> The API will be available at `http://localhost:8080`, with Swagger UI at `http://localhost:8080/swagger-ui/`.

### Frontend Setup

```bash
cd frontend
cp .env.example .env   # optional — defaults to http://localhost:8080/api
npm install
npm run dev
```

> The app will be available at `http://localhost:5173`.

---

## 🧪 Testing

**415 automated tests** run on every push and pull request via GitHub Actions.

| Suite | Count | Stack | Command |
|---|---|---|---|
| **Backend** | 211 tests · 33 classes | JUnit 5 · Mockito · AssertJ · in-memory H2 | `cd backend && ./mvnw test` |
| **Frontend** | 204 tests · 29 files | Vitest · React Testing Library · jsdom | `cd frontend && npm test` |

**What's covered:**

- **Backend** — every service (business rules, ownership checks, status-transition matrices), every controller (`@WebMvcTest` HTTP slices: routing, validation, status codes), plus JWT utilities, OAuth2 handlers, file storage, pagination helpers, and the global exception handler. Tests run against in-memory H2 — no database setup needed.
- **Frontend** — all utility modules and custom hooks, the API client layer (every endpoint wrapper), auth page flows (login, signup, password reset/change, OAuth callback), interactive components, and mount smoke tests for every page.

Run a single backend test class with `./mvnw test -Dtest=CompanyServiceTest`, or frontend watch mode with `npm run test:watch`.

---

## 🔧 Environment Variables

<details>
<summary><strong>Backend</strong> — <code>backend/src/main/resources/application.properties</code></summary>

<br>

| Property | Description |
|---|---|
| `spring.datasource.url` / `.username` / `.password` | PostgreSQL connection |
| `jwt.secret` | Hex-encoded 256-bit secret used to sign JWTs |
| `jwt.expiration-ms` | Token expiry in milliseconds (default 24h) |
| `spring.mail.username` / `.password` | Gmail SMTP credentials for password-reset emails |
| `app.frontend-url` | Base URL of the frontend, used in password-reset email links |
| `app.cors.allowed-origins` | Comma-separated list of origins allowed to call the API |
| `app.upload-dir` | Directory where uploaded documents are stored |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth2 credentials for social sign-in |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth2 credentials for social sign-in |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth2 credentials for social sign-in |

See `application.properties.example` for a full template.

</details>

<details>
<summary><strong>Frontend</strong> — <code>frontend/.env</code></summary>

<br>

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API (e.g. `http://localhost:8080/api`) |

See `frontend/.env.example`.

</details>

---

## 📚 API Overview

Full interactive API documentation is available via Swagger UI once the backend is running:

```
http://localhost:8080/swagger-ui/
```

**Key resource groups:** `/api/auth` · `/api/companies` · `/api/applications` · `/api/interviews` · `/api/recruiters` · `/api/referrals` · `/api/followups` · `/api/documents` · `/api/admin`

---

## ☁️ Deployment

CareerFlow deploys as two independent services:

| Service | What it is | Where it fits |
|---|---|---|
| **Backend** | Spring Boot JAR (Maven build) + PostgreSQL | Any container/PaaS host (e.g. Render, Railway) |
| **Frontend** | Static Vite build (`npm run build` → `dist/`) | Any static host/CDN (e.g. Vercel, Netlify) |

Configure `VITE_API_URL` on the frontend host and `app.frontend-url` / `app.cors.allowed-origins` on the backend host to point at each other's deployed URLs.

---

## 🤝 Contributing

Issues and pull requests are welcome. Please open an issue to discuss significant changes before submitting a PR.

<div align="center">

Made with ☕ and late-night debugging.

</div>
