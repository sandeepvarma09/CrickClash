# 🏏 CricClash — Predictions Decide Pride

> Challenge your friends on cricket predictions. No money, no fantasy — pure bragging rights.

[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20+%20Vite-61DAFB?style=flat-square)](https://vitejs.dev)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20+%20Express-339933?style=flat-square)](https://expressjs.com)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=flat-square)](https://mongodb.com/atlas)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 5-Question Predictions | Toss, Match Winner, Top Scorer, Total Runs, Player of the Match |
| ⚔️ Versus Battle Card | UFC-style head-to-head prediction comparison with GSAP animations |
| 👥 Group Mode | Invite your whole squad, see everyone's picks |
| 🏆 Leaderboard | Global & weekly rankings with animated podium |
| 🎖️ Badges | Perfect Prediction, Win Streaks, Lone Wolf, Weekly Champion |
| 📱 Share | WhatsApp / Telegram / Twitter links with rich OG previews |
| ⚙️ Admin Panel | Match management, result input (triggers auto-evaluation) |
| 👤 User Profiles | Stats dashboard with accuracy ring, badge showcase, recent history |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm

### 1. Clone & Install
```bash
git clone https://github.com/yourname/cricclash.git
cd cricclash

# Install frontend deps
npm install

# Install backend deps
cd server && npm install && cd ..
```

### 2. Configure Environment
```bash
# Frontend (.env.local)
cp .env.example .env.local

# Backend (server/.env)
cp server/.env.example server/.env
# Edit server/.env and fill in MONGO_URI, JWT_SECRET, etc.
```

### 3. Run
```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
npm run dev
```

Open **http://localhost:3000**

---

## 🧪 Testing
```bash
# Unit tests (scoring engine)
cd server && npm run test:scoring

# API integration tests (requires server running)
cd server && npm run test:api
```

---

## 📁 Project Structure

```
cricclash/
├── src/                    # Frontend (React + Vite)
│   ├── pages/              # Route-level pages
│   │   ├── HomePage.tsx        # Landing with GSAP ScrollTrigger
│   │   ├── MatchesPage.tsx     # Browse & filter matches
│   │   ├── CreateChallengePage.tsx  # 3-step challenge wizard
│   │   ├── ChallengePage.tsx   # View + join challenge
│   │   ├── VersusPage.tsx      # Head-to-head battle card
│   │   ├── LeaderboardPage.tsx # Podium + rankings
│   │   ├── ProfilePage.tsx     # User stats + badges
│   │   └── AdminPage.tsx       # Admin panel
│   ├── components/
│   │   ├── match/          # MatchCard, MatchCardSkeleton
│   │   └── shared/         # Navbar, Layout
│   └── hooks/
│       ├── useMatches.ts   # Match data fetching
│       └── useSEO.ts       # Dynamic OG/Twitter meta tags
│
├── server/src/             # Backend (Node + Express)
│   ├── controllers/        # matchController, challengeController, predictionController
│   ├── models/             # Match, Challenge, Prediction, User, Leaderboard
│   ├── routes/             # All API routes
│   ├── services/
│   │   ├── cricketApiService.ts   # CricAPI integration + mock data
│   │   ├── matchSyncService.ts    # Match syncing + seeding
│   │   ├── resultService.ts       # TASK-13: auto-evaluates predictions
│   │   └── badgeService.ts        # TASK-16: badge awards
│   └── tests/
│       ├── scoring.test.ts   # Unit tests for scoring engine
│       └── api.test.ts       # Integration tests for all routes
│
├── vercel.json             # Frontend deployment (Vercel)
├── server/railway.json     # Backend deployment (Railway)
└── public/manifest.json    # PWA manifest
```

---

## 🚢 Deployment (TASK-26)

### Frontend → Vercel
1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard:
   - `VITE_API_URL` = your Railway backend URL + `/api`
   - `VITE_APP_URL` = your Vercel frontend URL
4. Deploy — `vercel.json` handles SPA routing

### Backend → Railway
1. Create a new project in [Railway](https://railway.app)
2. Connect your GitHub repo, set root to `./server`
3. Set environment variables (see `server/.env.example`)
4. Railway auto-detects Node.js and deploys

### Database → MongoDB Atlas
1. Create free cluster at [MongoDB Atlas](https://mongodb.com/atlas)
2. Create a database user
3. Whitelist Railway's IP or use `0.0.0.0/0` for all IPs
4. Copy the connection string to `MONGO_URI` env var

---

## 🔑 Admin Panel

Default credentials (change before deploying!):
- **Username:** `admin`
- **Password:** `admin123`

Access at: `/admin`

---

## 🔮 Future Enhancements

- AI Prediction Assistant
- IPL Tournament Mode
- Team vs Team Challenges
- Private Leagues
- Prediction Analytics Dashboard

---

## 📊 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches` | List upcoming/live matches |
| GET | `/api/matches/seed` | Seed mock matches (dev only) |
| POST | `/api/matches` | Create match (admin) |
| PUT | `/api/matches/:id/result` | Set result → triggers auto-eval |
| POST | `/api/challenges` | Create challenge + creator predictions |
| GET | `/api/challenges/:id` | Get challenge by short ID |
| GET | `/api/challenges/:id/predictions` | Get all predictions for challenge |
| POST | `/api/predictions` | Submit predictions (join challenge) |
| GET | `/api/leaderboard/global` | All-time top players |
| GET | `/api/leaderboard/weekly` | This week's top players |
| GET | `/api/users/:username` | User profile + recent predictions |
| POST | `/api/admin/login` | Admin JWT login |
| GET | `/api/admin/matches` | Admin: all matches paginated |
| GET | `/api/admin/challenges` | Admin: all challenges paginated |

---

*Built with ❤️ for cricket fans. Predictions Decide Pride. 🏏*
