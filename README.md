# PrepEdge
### AI-Powered Mock Interview Platform

> Practice technical interviews with AI-generated questions, role-based interview loops, instant feedback, practice quizzes, and progress tracking — all in one place.

🔗 **Live Demo**: https://prepedge-kappa.vercel.app
🌐 **Backend API**: https://prepedge-lek5.onrender.com
📦 **Repository**: https://github.com/chandni5033/prepedge

> ⚠️ Backend is hosted on Render's free tier — the first request after inactivity may take 30–60 seconds to respond (cold start). Subsequent requests are fast.

---

## 🎯 Problem

Practicing for technical interviews alone is hard to do well. Question banks are static, self-assessment is unreliable, and there's no structured way to simulate a real multi-round interview loop or track improvement across sessions.

## 💡 Solution

PrepEdge generates fresh, AI-tailored interview questions per session, evaluates answers using an LLM with structured feedback, and tracks progress over time. It also supports role-based multi-round interview loops (like real hiring processes), a DSA code editor with live execution, mixed-difficulty practice quizzes, and curated learning resources — all built on a production-grade MERN backend.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Auth** | Email/password and Google OAuth login (JWT-based sessions) |
| 🤖 **AI Question Generation** | Fresh questions per session via Groq LLM, avoiding repeats from past sessions |
| 📝 **AI Answer Evaluation** | Each answer scored and explained by the LLM with strengths, weaknesses, and ideal answer |
| 🎯 **Role-based Interview Loops** | Multi-round interview sequences per job role (SDE Intern, Backend, Frontend, ML Engineer), each ending in an HR/Behavioral round |
| 🧑‍💻 **Code Editor** | CodeMirror-based editor for DSA questions with syntax highlighting and language switching (C++, Python, Java, JavaScript) |
| 📝 **Practice Quizzes** | AI-generated 15-question mixed-difficulty MCQ quizzes with real exam-style UX (auto-save, free navigation, results revealed at end) |
| 📚 **Learning Resources** | Curated links to GeeksforGeeks, MDN, and official docs across DSA, Web Dev, ML, and CS Fundamentals |
| 📊 **Interview History** | Every past session stored and viewable with full per-question breakdown |
| 📈 **Analytics Dashboard** | Aggregate progress and performance trends across sessions |
| 🚦 **Input Validation** | Joi-based request validation on every route, with field-level error messages |
| 🔒 **Rate Limiting** | Stricter limits on AI-cost-incurring endpoints than general API traffic |
| 🧾 **Centralized Error Handling** | No internal error details ever leak to the client in production |

---

## 🧠 How It Works

### Practice Mode
```
User selects category + difficulty
        ↓
Groq LLM generates fresh questions (avoiding past repeats)
        ↓
User answers each question (text or code editor for DSA)
        ↓
LLM evaluates each answer with score + feedback
        ↓
Full report available in History
```

### Role Mode
```
User picks a job role (e.g. SDE Intern)
        ↓
3-round interview loop defined per role
        ↓
Each round is a full interview session (DSA → CS Fundamentals → HR/Behavioral)
        ↓
Rounds unlock sequentially — complete Round 1 to unlock Round 2
        ↓
Combined report generated across all rounds with overall verdict
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React (Vite), React Router, Axios, Tailwind CSS |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB (Mongoose) |
| **Auth** | JWT + Google OAuth (Passport) |
| **AI Model** | Groq Cloud — llama-3.3-70b-versatile |
| **Code Editor** | CodeMirror 6 |
| **Validation** | Joi |
| **Logging** | Winston |
| **Testing** | Jest, Supertest, mongodb-memory-server |
| **Deployment** | Vercel (frontend) + Render (backend) |

---

## 🧪 Testing

The backend has an integration test suite covering authentication (register, login, profile) and the full interview flow (create, history, fetch-by-id), running against an in-memory MongoDB instance — no external database required.

```bash
cd backend
npm test
```

The AI service is mocked in tests, so the suite runs without a real Groq API key or network call. **20 tests, 2 suites, all passing.**

---

## 🚀 Local Setup

### Prerequisites

- Node.js 18+
- A MongoDB instance (local, or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster)
- A [Groq API key](https://console.groq.com) — free tier available
- Google OAuth credentials — optional, only needed for Google sign-in ([setup guide](https://console.cloud.google.com/apis/credentials))

### Backend

```bash
cd backend
npm install
cp .env.example .env
# fill in MONGODB_URI, JWT_SECRET, GROQ_API_KEY, etc.
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Seed data (required for Role Mode and Resources)

```bash
cd backend
node scripts/seedRoles.js      # seeds the 4 job roles + round definitions
node scripts/seedResources.js  # seeds the 20 curated learning resource links
```

### Environment Variables

#### Backend `.env`

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/prepedge
JWT_SECRET=replace_with_a_long_random_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
GROQ_API_KEY=your_groq_api_key
JUDGE0_API_KEY=your_rapidapi_key
CLIENT_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

#### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000
```

---

## 📁 Project Structure

```text
prepedge/
├── backend/
│   ├── config/         # DB connection, Passport OAuth strategy
│   ├── controllers/    # Route handlers (auth, interview, role, quiz, resource, analytics)
│   ├── middleware/     # Auth guard, rate limiter, Joi validation, error handler
│   ├── models/         # Mongoose schemas (User, Interview, Question, Role, RoleAttempt, Quiz, Resource)
│   ├── routes/         # Express routers
│   ├── scripts/        # DB seed scripts (seedRoles.js, seedResources.js)
│   ├── services/       # Groq AI integration (question gen, answer eval, quiz gen, report gen)
│   ├── validators/     # Joi schemas per route group
│   ├── utils/          # JWT generator, Winston logger
│   ├── tests/          # Jest + Supertest integration tests
│   ├── app.js          # Express app (no DB connect, no listen — used directly by tests)
│   └── server.js       # Entry point: connects DB, starts HTTP server
│
└── frontend/
    └── src/
        ├── components/  # Shared UI (ProtectedRoute, CodeAnswerEditor)
        ├── context/     # Auth context
        ├── pages/       # All pages (Dashboard, Interview, Role Mode, Quiz, Resources, etc.)
        └── services/    # Axios API client
```

---

## ⚙️ API Reference

### Auth
```
POST /api/auth/register          — create account
POST /api/auth/login             — email/password login
GET  /api/auth/profile           — get current user (auth required)
GET  /api/auth/google            — initiate Google OAuth
GET  /api/auth/google/callback   — OAuth callback
```

### Interviews
```
POST /api/interview/create         — generate new interview session
POST /api/interview/submit-answer  — evaluate an answer
POST /api/interview/finish         — generate final report
GET  /api/interview/history        — list past interviews
GET  /api/interview/:id            — get full interview + report
```

### Role Mode
```
GET  /api/roles                                     — list available roles
POST /api/roles/:slug/start                         — start/resume a role attempt
GET  /api/roles/attempts/:id                        — get attempt progress
POST /api/roles/attempts/:id/rounds/:order/begin    — start a round (creates interview)
POST /api/roles/attempts/:id/rounds/:order/complete — mark round complete, unlock next
POST /api/roles/attempts/:id/finish                 — generate combined report
```

### Practice Quiz
```
POST /api/quiz/create      — generate 15-question MCQ quiz
POST /api/quiz/:id/answer  — record answer (no feedback until finish)
POST /api/quiz/:id/finish  — score quiz and return full results
GET  /api/quiz/history     — list completed quizzes
```

### Resources
```
GET /api/resources?category=dsa  — list curated learning links (filterable by category)
```

---

## 💼 Why This Project Matters

PrepEdge is a production-grade full-stack application built with engineering practices that go beyond feature completeness:

- **Full-stack MERN** with clean separation of routes, controllers, services, and models
- **AI integration** via Groq LLM for question generation, answer evaluation, behavioral interview scoring (with a separate rubric), and quiz generation
- **Role-based interview system** modelling real multi-round hiring loops, with sequential round unlocking and aggregated combined reports
- **JWT + Google OAuth** authentication with Passport
- **Schema-based validation** (Joi) on every input-accepting route — including params and query strings, not just request bodies
- **Centralized error handling** that never leaks stack traces or DB internals to clients in production
- **Structured logging** (Winston) with environment-aware output (colorized in dev, JSON in production)
- **Real integration test suite** (Jest + Supertest, 20 tests) running against an in-memory MongoDB instance with the AI dependency mocked — tests don't require any external services
- **Deployed** on Vercel + Render with separate environments for development and production

---

## 🗺️ Roadmap

- [x] Deploy backend + frontend
- [ ] CI pipeline (GitHub Actions running tests on every push)
- [ ] Code execution via Judge0 (requires RapidAPI key)
- [ ] GitHub OAuth for easier onboarding
- [ ] Shareable interview/quiz reports

---

## 📄 License

MIT License — feel free to use, modify, and build on this project.