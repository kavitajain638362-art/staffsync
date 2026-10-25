# StaffSync

StaffSync is a full-stack HR management web application for small organisations. HR administrators manage people and policies, managers review their team's requests, and employees track their own leave, attendance and learning.

Built with **MongoDB, Express, React and Node.js** (MERN).

![StaffSync dashboard](docs/screenshots/overview-desktop.png)

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start (demo)](#quick-start-demo)
- [Use your own MongoDB](#use-your-own-mongodb)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Roles and permissions](#roles-and-permissions)
- [API overview](#api-overview)
- [Data model](#data-model)
- [Project structure](#project-structure)
- [Testing and CI](#testing-and-ci)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Limitations and roadmap](#limitations-and-roadmap)

## Features

- **Authentication and role-based access** — sign in or register, with HR, manager and employee roles enforced on the API.
- **Employee directory** — profiles, departments, designations, manager assignments, search and CSV export.
- **Leave management** — request leave, detect overlapping dates, approve or reject as a manager or HR, and keep a full history.
- **Attendance** — one check-in per employee per day, check-out, hours worked, date filtering and CSV export. All times use India Standard Time.
- **Announcements** — company-wide updates authored by HR or managers, with edit and delete controls.
- **Training** — managers and HR create sessions and assign them to active team members.
- **Notifications** — private notifications for leave decisions and training assignments, with mark-one and mark-all-as-read.
- **Role-aware dashboard** — scoped statistics, today's attendance, pending leave and recent announcements.
- **Responsive UI** — desktop and mobile layouts, keyboard-friendly dialogs, loading, empty and error states.

### Screenshots

| | |
|---|---|
| ![Login](docs/screenshots/login.png) | ![People](docs/screenshots/people.png) |
| **Sign in** | **Employee directory** |
| ![Leave requests](docs/screenshots/leave-requests.png) | ![Attendance](docs/screenshots/attendance.png) |
| **Leave requests** | **Attendance** |
| ![Announcements](docs/screenshots/announcements.png) | ![Training](docs/screenshots/training.png) |
| **Announcements** | **Training** |

A short walkthrough is available at [docs/demo/StaffSync-Demo.mp4](docs/demo/StaffSync-Demo.mp4).

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 7, Lucide icons, hand-written CSS |
| Backend | Node.js 24, Express 5, Mongoose 8 |
| Database | MongoDB (local or hosted) |
| Auth | JSON Web Tokens (HS256) and salted `scrypt` password hashes |
| Validation | Custom validators plus Mongoose schema constraints |
| Testing | Node.js test runner, Supertest, `mongodb-memory-server` |
| Tooling | npm, Prettier, GitHub Actions |

## Quick start (demo)

Requirements: **Node.js 24** and npm. The demo does not need a separately installed MongoDB.

```sh
npm ci
npm run demo
```

Open [http://localhost:5173](http://localhost:5173).

The demo:

1. builds the React client into `dist/`;
2. starts an official MongoDB process with a persistent WiredTiger data directory at `.data/mongo`;
3. seeds fictional people, attendance, leave, announcements and training;
4. serves the API and built client together on port **5173**.

On the first run, MongoDB is downloaded (about 600 MB on Windows) into a temporary binary cache. Later runs reuse the binary and the saved data. Delete `.data/` to reset the demo database.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| HR | `hr@example.test` | `StaffSyncDemo2026!` |
| Manager | `manager@example.test` | `StaffSyncDemo2026!` |
| Employee | `employee@example.test` | `StaffSyncDemo2026!` |

Additional seeded employees: `rohan@example.test`, `ishita@example.test`, `kabir@example.test` (same password).

> The demo secret is generated once and stored in `.data/demo-secret`. Demo data is fictional.

## Use your own MongoDB

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI`, a random `JWT_SECRET` of at least 32 characters, and the bootstrap credentials.
3. Install, build, create the first HR account and start the server:

```sh
npm ci
npm run build
npm run bootstrap
npm start
```

Open [http://localhost:4000](http://localhost:4000).

`npm run bootstrap` refuses to run if an HR account already exists. The bootstrap password must contain 12–128 characters. Remove `BOOTSTRAP_EMAIL` and `BOOTSTRAP_PASSWORD` from `.env` after the HR account is created.

### Development mode

Run the API and Vite dev server in two terminals:

```sh
npm run dev
```

```sh
npm run client
```

The client runs on [http://localhost:5173](http://localhost:5173) and Vite proxies `/api` requests to `http://127.0.0.1:4000`.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API/server port. Defaults to `4000` (`npm start`) or `5173` (`npm run demo`). |
| `MONGODB_URI` | Yes (non-demo) | MongoDB connection string, for example `mongodb://127.0.0.1:27017/staffsync`. |
| `JWT_SECRET` | Yes | Signing secret of at least 32 characters. Generate with a password manager or `openssl rand -hex 32`. |
| `BOOTSTRAP_EMAIL` | Bootstrap only | Email for the first HR administrator. |
| `BOOTSTRAP_PASSWORD` | Bootstrap only | Initial HR password, 12–128 characters. |
| `STAFFSYNC_TEST_CACHE` | No | Directory for the `mongodb-memory-server` binary cache (demo and tests). |

`.env` is git-ignored. Never commit real secrets.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run demo` | Build the client, start a local MongoDB, seed demo data and serve everything on port 5173. |
| `npm start` | Start the production API and serve `dist/` on port 4000. Requires `.env`. |
| `npm run dev` | Start the API with file watching on port 4000. |
| `npm run client` | Start the Vite dev server on port 5173 with API proxying. |
| `npm run build` | Build the React client into `dist/`. |
| `npm run bootstrap` | Create the first HR administrator from `.env`. |
| `npm test` | Run the backend test suite (14 tests) against an in-memory MongoDB. |
| `npm run format` | Format client, server, scripts and configuration with Prettier. |

## Roles and permissions

| Capability | HR | Manager | Employee |
| --- | --- | --- | --- |
| View own profile | Yes | Yes | Yes |
| View employee directory | All people | Direct reports | Self only |
| Create employee accounts | Yes | No | No |
| Edit name and phone | Any employee | Self only | Self only |
| Edit department, designation, manager, role | Yes | No | No |
| Deactivate accounts | Yes (not self) | No | No |
| Request leave | Yes | Yes | Yes |
| Review leave | All teams (not own) | Direct reports (not own) | No |
| Check in / check out | Yes | Yes | Yes |
| View attendance | All people | Direct reports and self | Self only |
| Publish announcements | Yes | Yes | No |
| Edit/delete announcements | Any | Own only | No |
| Create training | Yes | Yes | No |
| View training | All | Created by them or assigned | Assigned only |
| View notifications | Own | Own | Own |

## API overview

All endpoints are JSON under `/api`. Except for the public routes listed below, requests require `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Database readiness (`200` connected, `503` disconnected). |
| `GET` | `/api/config` | Public | Returns whether the instance is running in demo mode. |
| `POST` | `/api/auth/register` | Public | Register an employee account. Privileged fields are ignored. |
| `POST` | `/api/auth/login` | Public | Exchange email and password for a 2-hour JWT. |
| `GET` | `/api/auth/me` | Authenticated | Return the current user. |
| `GET` | `/api/employees` | Authenticated | List employees visible to the caller (max 200). |
| `POST` | `/api/employees` | HR | Create an employee account. |
| `PATCH` | `/api/employees/:userId` | Self or HR | Update profile fields; HR-only fields are role-checked. |
| `DELETE` | `/api/employees/:userId` | HR | Deactivate an account while retaining history. |
| `GET` | `/api/leaves` | Authenticated | List leave requests visible to the caller (max 200). |
| `POST` | `/api/leaves` | Authenticated | Apply for the caller's own leave. |
| `PATCH` | `/api/leaves/:id` | HR or manager | Approve or reject a pending request. |
| `GET` | `/api/attendance` | Authenticated | List attendance records visible to the caller (max 500). |
| `POST` | `/api/attendance/check-in` | Authenticated | Create today's attendance record for the caller. |
| `POST` | `/api/attendance/check-out` | Authenticated | Close today's open attendance record. |
| `GET` | `/api/announcements` | Authenticated | List announcements, newest first (max 100). |
| `POST` | `/api/announcements` | HR or manager | Publish an announcement. |
| `PATCH` | `/api/announcements/:id` | HR or author | Edit an announcement. |
| `DELETE` | `/api/announcements/:id` | HR or author | Delete an announcement. |
| `GET` | `/api/training` | Authenticated | List training visible to the caller (max 100). |
| `POST` | `/api/training` | HR or manager | Create a session and assign team members. |
| `GET` | `/api/notifications` | Authenticated | List the caller's notifications (max 100). |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Mark all of the caller's notifications read. |
| `PATCH` | `/api/notifications/:id` | Authenticated | Mark one of the caller's notifications read. |

Errors use an appropriate HTTP status and `{ "message": "..." }`. Authentication endpoints are limited to 30 requests per 15 minutes per client.

## Data model

| Collection | Key fields | Notes |
| --- | --- | --- |
| `users` | `name`, `email`, `passwordHash`, `role`, `active` | Unique email; password hash excluded from JSON; roles are `hr`, `manager`, `employee`. |
| `employees` | `user`, `department`, `designation`, `phone`, `manager` | One profile per user; `manager` references a user with the manager role. |
| `leaves` | `employee`, `startDate`, `endDate`, `reason`, `status`, `reviewedBy`, `reviewedAt` | ISO dates; status is `pending`, `approved` or `rejected`. |
| `attendances` | `employee`, `date`, `checkedInAt`, `checkedOutAt` | Unique index on employee + date; dates use IST. |
| `announcements` | `title`, `body`, `author` | Authored by HR or a manager. |
| `trainings` | `title`, `description`, `date`, `assignedTo`, `createdBy` | `assignedTo` references active users. |
| `notifications` | `recipient`, `title`, `body`, `section`, `readAt` | Private to the recipient; indexed by recipient and creation time. |

See [docs/architecture.md](docs/architecture.md) for the MVC and ER diagrams.

## Project structure

```text
staffsync/
├─ client/                 React app
│  ├─ components/          Shell, notifications, shared UI
│  ├─ pages/               Login, dashboard, people, leaves, attendance, announcements, training
│  ├─ api.js               Fetch wrapper, IST date helpers, CSV export
│  └─ styles.css           Responsive application styles
├─ server/
│  ├─ config/              MongoDB connection
│  ├─ controllers/         Request handlers and business rules
│  ├─ middleware/          JWT authentication, role guards, team scoping
│  ├─ models/              Mongoose schemas
│  ├─ routes/              Express route definitions
│  ├─ tests/               API and utility tests
│  ├─ app.js               Express app factory
│  ├─ bootstrap.js         First-HR provisioning CLI
│  ├─ lib.js               Validation, password hashing, IST day helper
│  ├─ notifications.js     Best-effort notification delivery
│  └─ server.js            Production entry point
├─ scripts/                Demo launcher and seed data
├─ docs/                   Architecture, SRS, report, screenshots and demo video
├─ public/                 Static assets
├─ .env.example            Environment variable template
├─ vite.config.js          Vite build and API proxy configuration
└─ package.json            Scripts and dependencies
```

## Testing and CI

```sh
npm test
npm run build
```

The suite contains **14 tests**: 11 API integration tests and 3 utility tests. It covers authentication and token invalidation, role escalation attempts, team scoping, leave overlap and double-review rules, attendance uniqueness and IST day boundaries, announcement ownership, training assignment rules, notification privacy, input validation, and password hashing. Tests use a separate in-memory MongoDB; the binary is cached after the first run.

GitHub Actions runs `npm ci`, `npm run build` and `npm test` on every push and pull request (`.github/workflows/ci.yml`).

## Security notes

- Passwords are hashed with salted `scrypt` and compared in constant time; hashes are never returned by the API.
- JWTs use a fixed algorithm (`HS256`), issuer, audience and a 2-hour expiry. The user is reloaded on every request so deactivation takes effect immediately.
- Role and team checks are enforced server-side; client-supplied `role`, `active` and identity fields are ignored.
- `helmet` sets security headers, JSON bodies are limited to 32 KB, and authentication routes are rate-limited.
- CSV export quotes values and prefixes formula-like cells to reduce spreadsheet injection risk.
- Keep `.env` out of version control and use a unique, random `JWT_SECRET` in every environment.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `npm ci` fails with `EPERM ... unlink` on Windows | Stop any running Vite/dev server or `esbuild` process using `node_modules`, close editors scanning the folder, then retry. OneDrive/antivirus can also lock native binaries. |
| Port 5173 or 4000 is already in use | Stop the other process, or set `PORT` for the API/demo. The demo defaults to 5173; the production server defaults to 4000. |
| MongoDB download is slow on first run | It is a one-time ~600 MB download. Set `STAFFSYNC_TEST_CACHE` to reuse an existing binary cache. |
| Login fails in the demo | Use one of the seeded accounts and the password `StaffSyncDemo2026!`. Delete `.data/` and restart to reseed. |
| `JWT_SECRET must contain at least 32 characters` | Set a longer random secret in `.env`. |

## Documentation

- [Software Requirements Specification](docs/SRS.md)
- [Architecture](docs/architecture.md)
- [Project report](docs/StaffSync-Project-Report.pdf)
- [Screenshots](docs/screenshots)
- [Demo video](docs/demo/StaffSync-Demo.mp4)

## Limitations and roadmap

This is an academic capstone project, not a production-hardened HR platform.

Current limitations:

- API lists are bounded (200 employees/leaves, 500 attendance records, 100 announcements/training/notifications) and pagination is client-side.
- Profile updates spanning the `users` and `employees` collections are not transactional.
- Leave overlap checks are not protected by a database constraint under high concurrency.
- Notifications are best-effort after the primary record is saved.
- There is no password recovery, invitation flow, audit log, refresh token, or server-side session revocation list.
- The app is English-only and tuned for India Standard Time.

Planned improvements include transactional profile updates, server-side pagination and filtering, password reset and invitations, audit logging, distributed rate limiting, refresh tokens or secure cookie sessions, accessibility auditing, observability, backups and cloud deployment.
