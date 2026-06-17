# InterviewForge
### AI-Powered Mock Interview Platform


> Practice technical interviews with AI-generated questions, instant feedback, and progress tracking — all in one place.

🔗 **Live Demo**: not yet deployed 
🌐 **Backend API**: not yet deployed 
📦 **Repository**: https://github.com/chandni5033/prepedge

---

## 🎯 Problem
Practicing for technical interviews alone is hard to do well. Question banks are static, self-assessment is unreliable, and there's no structured way to track whether you're actually improving across sessions.

## 💡 Solution
InterviewForge generates a fresh, tailored set of interview questions for a chosen category and difficulty, walks the user through answering them, and uses an LLM to evaluate each answer — explaining what was right, what was missing, and how to improve. Past sessions and aggregate progress are tracked over time, so practice compounds instead of resetting every session.

---

## ✨ Features
| Feature |	Description |
|---|---|
|🔐 **Auth**	| Email/password and Google OAuth login (JWT-based sessions) |
|🤖 **AI Question Generation** |	Fresh questions generated per session via Groq LLM, avoiding repeats from past sessions |
|📝 **AI Answer Evaluation**	| Each submitted answer is scored and explained by the LLM |
|📊 **Interview History** | Every past session is stored and viewable in full |
|📈 **Analytics Dashboard** | Aggregate progress and performance trends across sessions |
|🚦 **Input Validation**	| Joi-based request validation on every route, with field-level error messages |
|🔒 **Rate Limiting**	| Stricter limits on AI-cost-incurring endpoints than general API traffic |
|🧾 **Centralized Error Handling** |	No internal error details ever leak to the client in production |
|🌐 **Multi-category** |	DSA, web development, ML, and CS fundamentals |

---

## 🧠 How It Works
```
User selects category + difficulty
        ↓
Backend checks past sessions to avoid repeat questions
        ↓
Groq LLM generates a fresh set of questions
        ↓
Questions + interview session saved to MongoDB
        ↓
User answers each question in sequence
        ↓
Each answer evaluated by the LLM on submission
        ↓
Session marked complete, full report available in History
```
---

## 🛠️ Tech Stack
| Layer	| Technology |
|---|---|
| **Frontend** | React (Vite), React Router, Axios |
| **Backend** |	Node.js, Express |
| **Database** | MongoDB (Mongoose) |
| **Auth** | JWT + Google OAuth (Passport) |
| **AI Model** | Groq Cloud LLM |
| **Validation** | Joi |
| **Logging** |	Winston |
| **Testing** |	Jest, Supertest, mongodb-memory-server |

---

## 🧪 Testing
The backend has an integration test suite covering authentication (register, login, profile) and the full interview flow (create, history, fetch-by-id), running against an in-memory MongoDB instance — no external database required.

```bash
cd backend
npm test
```

The AI service is mocked in tests, so the suite runs without a real Groq API key or network call. 20 tests, 2 suites, all passing.

---

## 🚀 Local Setup
### Prerequisites
- Node.js 18+
- A MongoDB instance (local, or a free MongoDB Atlas cluster)
- A Groq API key — free at console.groq.com
- Google OAuth credentials (optional, only needed for Google sign-in)

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

### Environment Variables

#### Backend `.env`

```env
MONGODB_URI=mongodb://localhost:27017/interviewforge
JWT_SECRET=replace_with_a_long_random_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GROQ_API_KEY=your_groq_api_key
CLIENT_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

#### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📁 Project Structure

```text
prepedge/
├── backend/
│   ├── config/         # DB connection, Passport strategy
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth guard, rate limiter, validation, error handler
│   ├── models/         # Mongoose schemas (User, Interview, Question)
│   ├── routes/         # Express routers
│   ├── services/       # Groq AI integration
│   ├── validators/     # Joi schemas
│   ├── tests/          # Jest + Supertest integration tests
│   ├── app.js          # Express app (used directly by tests)
│   └── server.js       # Entry point
│
└── frontend/
    └── src/
        ├── components/  # Shared UI (ProtectedRoute, etc.)
        ├── context/     # Auth context
        ├── pages/       # Landing, Login, Register, Dashboard,
        │                # CreateInterview, InterviewSession, Feedback,
        │                # History, Analytics, Profile
        └── services/    # API client
```

---

## ⚙️ API Reference

### `POST /api/auth/register`
Create a new account.

```json
Request:  { "name": "...", "email": "...", "password": "..." }
Response: { "token": "...", "user": { "_id", "name", "email" } }
```

### `POST /api/auth/login`
Log in with email and password.

```json
Request:  { "email": "...", "password": "..." }
Response: { "token": "...", "user": { "_id", "name", "email" } }
```

### `POST /api/interview/create`
Start a new interview session. Requires auth.

```json
Request:  { "category": "dsa|webdev|ml|cs", "difficulty": "easy|medium|hard", "numQuestions": 5 }
Response: { "interview": {...}, "questions": [...] }
```

### `POST /api/interview/submit-answer`
Submit and evaluate an answer. Requires auth.

```json
Request:  { "interviewId": "...", "questionId": "...", "questionText": "...", "userAnswer": "..." }
Response: { "feedback": { "score", "explanation", ... } }
```

### `GET /api/interview/history`
List past interviews for the logged-in user. Requires auth.

```json
Response: { "interviews": [...], "total": 0 }
```
---

## 💼 Why This Project Matters
InterviewForge demonstrates a full-stack application built with production-minded practices, not just feature completeness:

- Full-stack MERN development with clean separation of routes, controllers, services, and models
- AI integration via LLM APIs for both content generation and evaluation
- JWT and OAuth-based authentication
- Schema-based request validation (Joi) on every input-accepting route
- Centralized error handling that never leaks internals to clients in production
- Structured logging (Winston) instead of scattered console statements
- A real integration test suite (Jest + Supertest) running against an in-memory database, with the AI dependency mocked

---

## 🗺️ Roadmap
- Deploy backend + frontend
- CI pipeline (GitHub Actions) running tests on every push
- Voice-based interview mode
- Per-question difficulty adaptation based on prior performance
- Shareable interview reports

---

## 📄 License
MIT License — feel free to use, modify, and build on this project.
