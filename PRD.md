# 🏏 Cricket Clash — Product Requirements Document (PRD)
> **Tagline:** Predictions Decide Pride

---

## 📌 Product Overview

Cricket Clash is a **social cricket prediction challenge app** where users compete with friends by making predictions about upcoming cricket matches. Users create prediction challenges, share them with friends using a link, and compete to see whose predictions are correct once the match ends.

The app generates **versus-style prediction cards**, tracks results automatically, and displays leaderboards showing the winners. The goal is to make cricket predictions **social, competitive, and fun**.

---

## ❓ Problem Statement

Cricket fans constantly debate match outcomes in WhatsApp groups, Telegram chats, and social media, but there is **no structured way** to track predictions and determine who was actually right. Existing platforms focus on fantasy sports or betting — complex and often require money. Users want a **simple and fun** way to challenge friends and prove their cricket knowledge.

---

## 🎯 Goals & Objectives

| # | Goal |
|---|------|
| 3.1 | Allow users to create prediction challenges |
| 3.2 | Allow friends to join challenges through shareable links |
| 3.3 | Show predictions in a versus comparison format |
| 3.4 | Automatically reveal results after the match ends |
| 3.5 | Display leaderboards for group competitions |

---

## 👥 Target Users

- Cricket fans & IPL viewers
- WhatsApp friend groups & sports communities
- **Age:** 16–35 years
- **Primary Region:** India

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | **React 19 + Vite 6** |
| Styling | Tailwind CSS |
| Animations | GSAP |
| Backend | Node.js + Express |
| Database | MongoDB |
| APIs | Cricket APIs (match schedules, player data, results) |

---

---

# 📋 TASK BREAKDOWN

> Tasks are divided into phases. Each task will be implemented **one by one on command**.

---

## 🔷 PHASE 0 — Project Setup

### ✅ TASK-01: Initialize React + Vite Project with Tailwind CSS & GSAP
- Set up **React 19 + Vite 6** project in `/CricClash`
- Configured Tailwind CSS + PostCSS
- Installed and configured GSAP with animation presets
- Set up folder structure: `pages/`, `components/`, `lib/`, `types/`, `constants/`, `hooks/`, `utils/`
- Configured TypeScript paths (`@/*` alias)
- Set up environment variable files (`.env.local` with `VITE_` prefix)

### ✅ TASK-02: Set Up Backend — Node.js + Express
- Initialized Express server in `/server` with TypeScript
- MongoDB connection via Mongoose in `config/db.ts`
- Folder structure: `routes/`, `models/`, `controllers/`, `middleware/`, `services/`, `utils/`
- Middleware: CORS, Helmet, Morgan, Rate Limiter, JWT Auth guard
- `AppError` class + `asyncHandler` wrapper + global error handler
- All 6 route stubs mounted: `/api/matches`, `/api/challenges`, `/api/predictions`, `/api/leaderboard`, `/api/users`, `/api/admin`
- Health-check: `GET /api/health`

### ✅ TASK-03: Database Schema Design (MongoDB Models)
All 5 Mongoose schemas created in `server/src/models/`:
- `User` — username (unique), avatar, stats (wins/streak/accuracy), badges[], isAdmin, `updateAccuracy()` + `addBadge()` methods, `winRate` virtual
- `Match` — teams[2], date, venue, format, status lifecycle, result sub-doc, `isResultComplete()` method
- `Challenge` — unique short `challengeId`, matchId, creatorId, stake, participants[], TTL index, `addParticipant()` + `lock()` + `complete()` methods
- `Prediction` — compound unique index (one per user per challenge), 5 answer fields, `evaluate()` scoring method with ±10 runs tolerance
- `Leaderboard` — ranked entries, winner/loser flags, tiebreaker by submittedAt, `buildFromPredictions()` static factory

---

## 🔷 PHASE 1 — Core Features

### TASK-04: Cricket API Integration
- Integrate a Cricket API (e.g., CricAPI / RapidAPI cricket)
- Fetch upcoming match schedules
- Fetch player data (top scorers, players of the match)
- Fetch live & completed match results
- Create API wrapper/service layer in `/lib/cricketApi.js`

### TASK-05: Match Selection Page (Frontend)
- Display list of upcoming cricket matches (fetched from API)
- Show match card: Teams, Date, Venue, Format (T20/ODI/Test)
- "Create Challenge" CTA button on each match card
- Loading skeleton & error states
- Responsive design with Tailwind CSS

### TASK-06: Challenge Creation Flow (Frontend + Backend)
- Step 1: Show the selected match details
- Step 2: 5 Prediction questions form:
  1. Toss Winner (Team A / Team B)
  2. Match Winner (Team A / Team B)
  3. Top Run Scorer (player name input / dropdown)
  4. Total Runs by Winning Team (number input)
  5. Player of the Match (player name input / dropdown)
- Step 3: Set Stake/Punishment (text input or dropdown with examples: "Buy biryani", "Wear opponent's jersey", "Post an Instagram story", custom)
- On submit → POST `/api/challenges` → store in MongoDB → return challenge URL

### TASK-07: Shareable Challenge Link System (Backend)
- Generate a unique short challenge ID (e.g., `abc123`)
- Challenge URL format: `cricketclash.app/challenge/abc123`
- API route: `GET /api/challenges/:id` → returns challenge + match + creator predictions
- Share buttons for: WhatsApp, Instagram, Telegram, Copy Link

### TASK-08: Join Challenge Flow (Frontend + Backend)
- Friend opens `/challenge/abc123`
- Prompted to enter a Username
- Shown the 5 prediction questions for the same match
- Submits predictions → POST `/api/predictions`
- Redirected to the **Versus Battle Card** page

---

## 🔷 PHASE 2 — Versus & Social Features

### TASK-09: Versus Battle Card (Frontend)
- UFC/Dream11-style fight poster design
- Show: Creator vs Challenger
- List each prediction side-by-side:
  - Toss Winner: Sandeep → India | Rahul → Australia
  - Top Scorer: Sandeep → Kohli | Rahul → Smith
- Animated reveal using GSAP
- Shareable image generation (html2canvas or similar)

### TASK-10: Group Challenge Mode (Frontend + Backend)
- Multiple users can join same challenge via the link
- API route: `GET /api/challenges/:id/predictions` → returns all participant predictions
- Show prediction distribution UI:
  - "India — 80% | New Zealand — 20%"
  - Highlight the unique picker (e.g., "Deepak is the only one who picked New Zealand")
- Real-time updates (polling or WebSocket)

### TASK-11: Share to Social Media (Frontend)
- Generate shareable result/battle card image
- Pre-filled share messages:
  - WhatsApp: "I challenged Rahul in Cricket Clash! 🏏 Can you beat me? [link]"
  - Twitter/X: "I beat Rahul in Cricket Clash 🏆 #CricketClash #IPL [link]"
- Share buttons: WhatsApp, Instagram Stories, Twitter/X, Copy Link

---

## 🔷 PHASE 3 — Results & Leaderboard

### TASK-12: Match Result Reveal (Frontend + Backend)
- After match ends, admin updates match results
- Backend evaluates each prediction → correct/wrong
- API route: `GET /api/challenges/:id/results`
- Frontend animated reveal:
  - Prediction card flips one by one (GSAP animation)
  - ✅ Green = Correct | ❌ Red = Wrong
  - Dramatic reveal order (from least important to most important prediction)

### TASK-13: Winner Calculation Logic (Backend)
- Count correct predictions per participant
- Highest correct = Winner
- Tiebreaker 1: Exact total runs prediction
- Tiebreaker 2: Earliest submission timestamp
- Store winner/loser in `Leaderboard` collection

### TASK-14: Leaderboard Page (Frontend + Backend)
- Rank all participants in a challenge
- Show: 🥇 1st, 🥈 2nd, 🥉 3rd, ... Last
- Last place → **Punishment Tag** displayed (e.g., "Rahul must buy biryani for everyone 🍛")
- Animated podium UI using GSAP
- API route: `GET /api/challenges/:id/leaderboard`

---

## 🔷 PHASE 4 — Gamification

### TASK-15: User Stats & Profiles
- Track per-user:
  - Win streak count
  - Prediction accuracy percentage
  - Total challenges played/won
- Profile page: Avatar, Username, Stats dashboard

### TASK-16: Achievement Badges System
- **Perfect Prediction** — All 5 predictions correct
- **Win Streak** — 3/5/10 consecutive wins
- **Weekly Champion** — Most wins in a week
- **Lone Wolf** — Only person to pick the correct team
- Store badges in User model, display on profile

### TASK-17: Weekly Champions Feature
- Track weekly challenge wins
- Compute weekly leaderboard (resets Monday 00:00 IST)
- API route: `GET /api/leaderboard/weekly`
- Display on home page as "This Week's Champions"

---

## 🔷 PHASE 5 — Admin Panel

### TASK-18: Admin Panel — Authentication
- Simple admin login (username + hashed password)
- JWT-based session
- Protected admin routes middleware

### TASK-19: Admin Panel — Match Management
- List all matches (upcoming / live / completed)
- Add new upcoming match manually
- Update match result (Toss winner, Match winner, Top scorer, Total runs, POTM)
- Mark match as completed → triggers result evaluation

### TASK-20: Admin Panel — Challenge Monitoring
- View all active challenges
- View participant list per challenge
- View prediction breakdown per challenge
- Delete/disable a challenge

### TASK-21: Admin Panel — Leaderboard & Punishment Management
- View global leaderboards
- Override winner/loser if needed
- Configure default punishment options
- Broadcast announcements

---

## 🔷 PHASE 6 — Polish & Optimization

### TASK-22: UI/UX Polish & Animations
- GSAP scroll-triggered animations on home page
- Page transition animations
- Micro-interactions on buttons, cards, inputs
- Dark mode support
- Mobile-first responsive design (primary target: mobile web in India)

### TASK-23: SEO & Meta Tags
- Open Graph tags for challenge links (so WhatsApp/Telegram previews look great)
- Twitter Card tags
- Dynamic meta titles/descriptions for each challenge page
- Favicon and PWA manifest

### TASK-24: Performance Optimization
- Image optimization (Next.js Image component)
- API response caching (Redis or in-memory)
- Lazy loading components
- Code splitting

### TASK-25: Testing & QA
- Unit tests for backend: winner calculation logic, prediction scoring
- Integration tests for API routes
- Frontend component tests (React Testing Library)
- End-to-end user flow testing

### TASK-26: Deployment
- Frontend: Deploy to Vercel
- Backend: Deploy to Railway / Render / AWS EC2
- Database: MongoDB Atlas
- Configure production environment variables
- Set up custom domain: `cricketclash.app`

---

## 🔮 Future Enhancements (Backlog)

| # | Feature |
|---|---------|
| 11.1 | AI Prediction Assistant |
| 11.2 | IPL Tournament Mode |
| 11.3 | Team vs Team Challenges |
| 11.4 | Private Leagues |
| 11.5 | Prediction Analytics Dashboard |
| — | Highest Wicket Taker prediction |
| — | Powerplay Score prediction |
| — | Margin of Victory prediction |

---

## 📊 Task Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 0 | TASK-01 to TASK-03 | Project Setup |
| Phase 1 | TASK-04 to TASK-08 | Core Features |
| Phase 2 | TASK-09 to TASK-11 | Versus & Social |
| Phase 3 | TASK-12 to TASK-14 | Results & Leaderboard |
| Phase 4 | TASK-15 to TASK-17 | Gamification |
| Phase 5 | TASK-18 to TASK-21 | Admin Panel |
| Phase 6 | TASK-22 to TASK-26 | Polish & Deployment |

> **Total Tasks: 26**

---

*PRD Version: 1.0 | Created: March 2026 | Product: Cricket Clash*
