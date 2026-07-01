# PriorIX

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Built with Electron](https://img.shields.io/badge/Built%20with-Electron-47848F?logo=electron)
![Expo SDK 54](https://img.shields.io/badge/Mobile-Expo%20SDK%2054-000020?logo=expo)
![Node.js](https://img.shields.io/badge/Backend-Node.js%2022-339933?logo=node.js)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

**Open-source industrial production management system with automatic priority classification via the Eisenhower Matrix.**

PriorIX helps factory teams manage work orders, assign tasks, and focus on what truly matters — automatically sorting every incoming order into one of four Eisenhower quadrants (Q1 Urgent+Important → Q4 Neither) based on deadline and business impact.

---

```
┌─────────────────────────────────────────────────────────────┐
│  PriorIX Dashboard                          [admin]  🏭     │
├────────────────┬────────────────┬────────────────┬──────────┤
│  Q1 URGENT     │  Q2 IMPORTANT  │  Q3 URGENT     │ Q4 DEFER │
│  ● 4 orders    │  ● 11 orders   │  ● 3 orders    │ ● 8 ord  │
│  Do NOW        │  Schedule      │  Delegate      │ Eliminate│
├────────────────┴────────────────┴────────────────┴──────────┤
│  At Risk (deadline < 48h)        Weekly Throughput          │
│  ⚠ ORDER-0042  Línea B  Q1       ████████░░  23 completed   │
│  ⚠ ORDER-0039  Línea A  Q1       Worker Load: 85%           │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

- **Automatic Eisenhower Engine** — Every order is classified into Q1/Q2/Q3/Q4 on creation based on deadline urgency and business priority; manual override available for managers
- **Autonomous Windows Desktop App** — Self-contained Electron installer (~183 MB) bundles Node.js runtime, Express backend, Prisma ORM, and SQLite database — zero external dependencies required on the target machine
- **Mobile App (iOS & Android)** — React Native + Expo app for plant workers: task list with one-tap start/complete, order overview with quadrant badges, real-time notifications
- **Full REST API** — JWT-authenticated endpoints for orders, tasks, users, plants, audit log, notifications, and dashboard metrics
- **Embedded SQLite** — No database server required; production DB is pre-migrated and ships inside the installer
- **Role-Based Access Control** — Four roles with granular permissions: Admin, Manager, Office, Worker
- **Audit Trail** — Every manual override and sensitive action is recorded with before/after values
- **Dashboard Metrics** — Orders by quadrant, at-risk alerts (<48h), worker load, weekly throughput

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js 22, Express 4, Prisma 5, SQLite (`better-sqlite3`) |
| **Desktop** | Electron 33, React 19, Vite 8, Tailwind CSS 3, Recharts |
| **Mobile** | React Native 0.81, Expo SDK 54, Expo Router 6, SecureStore |
| **Auth** | JWT (`jsonwebtoken`), bcrypt |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- For mobile testing: [Expo Go](https://expo.dev/go) on your phone (SDK 54)

### 1. Clone & install

```bash
git clone https://github.com/Porras-Dev/priorIXEngine.git
cd priorIXEngine
npm install
```

### 2. Start the backend

```bash
cd backend
cp .env.example .env        # set JWT_SECRET and DATABASE_URL
npx prisma migrate deploy
npx prisma db seed
node src/server.js          # API available at http://localhost:3001
```

### 3. Desktop app — development

```bash
cd desktop
npm run electron:dev        # opens Electron window + Vite dev server
```

### 4. Desktop app — production installer

```bash
cd desktop
npm run electron:build      # outputs desktop/release/PriorIX Setup 0.1.0.exe
```

> Run the installer on any Windows machine — no Node.js or database setup required.

### 5. Mobile app

```bash
cd mobile
npx expo start              # scan QR code with Expo Go
```

> Update `mobile/api/client.js` `BASE_URL` to your machine's local network IP before testing on a physical device.

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@priorix.com | `admin123` |
| **Manager** | manager.norte@priorix.com | `manager123` |
| **Manager** | manager.sur@priorix.com | `manager123` |
| **Office** | office1@priorix.com | `office123` |
| **Office** | office2@priorix.com | `office123` |
| **Office** | office3@priorix.com | `office123` |
| **Worker** | worker1@priorix.com | `worker123` |
| **Worker** | worker2–10@priorix.com | `worker123` |

---

## Project Structure

```
priorIXEngine/
├── backend/                  # Express REST API
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma data models
│   │   ├── seed.js           # Demo data (users, plants, orders, tasks)
│   │   └── dev.db            # SQLite development database (gitignored)
│   └── src/
│       ├── server.js         # Entry point — Express app + route registration
│       ├── routes/           # auth, orders, tasks, users, plants, dashboard…
│       ├── middleware/        # JWT auth + role guards
│       └── lib/
│           └── prisma.js     # PrismaClient singleton (sets DATABASE_URL in prod)
│
├── desktop/                  # Electron + React desktop app
│   ├── electron/
│   │   ├── main.js           # Electron main process (spawns backend, HashRouter)
│   │   └── preload.js        # Context bridge
│   ├── src/
│   │   ├── main.jsx          # React root with HashRouter
│   │   ├── pages/            # Dashboard, Orders, Tasks, Users, Audit, Notifications
│   │   ├── components/       # Layout, Sidebar, shared UI components
│   │   └── api/client.js     # axios with localStorage JWT interceptor
│   └── resources/
│       └── node/             # Bundled node.exe — gitignored, ~88 MB
│
├── mobile/                   # React Native + Expo mobile app
│   ├── app/
│   │   ├── _layout.jsx       # Root layout (AuthProvider + Stack navigator)
│   │   ├── index.jsx         # Splash — redirects to login or tabs
│   │   ├── login.jsx         # Login screen with large buttons
│   │   └── (tabs)/
│   │       ├── index.jsx     # My Tasks — filter pills, start/complete actions
│   │       ├── orders.jsx    # Orders with Eisenhower quadrant badges
│   │       └── notifications.jsx  # Alerts with tap-to-read
│   ├── api/client.js         # axios + SecureStore JWT interceptor
│   └── context/AuthContext.jsx
│
└── README.md
```

---

## License

[MIT](LICENSE) © 2026 PriorIX Contributors
