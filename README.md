# Tendon — Injury Risk Predictor

A web app where gym users log workouts and see an interactive human body avatar that color-codes each muscle group by current injury risk.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)
- Python 3.11+ if running without Docker
- Docker Desktop if using the recommended Docker flow

Check your versions:
```bash
node -v
npm -v
```

---

## Setup

**1. Clone the repo**
```bash
git clone https://github.com/SoulNims/CS220_Final_Project_Workout_Risk.git
cd CS220_Final_Project_Workout_Risk
```

**2. Install client dependencies**
```bash
cd client
npm install
```

---

## Running the App With Docker

From the project root:

```bash
cp .env.example .env
docker compose up --build
```

Then open:

- Frontend: **http://localhost:5173**
- Backend Swagger: **http://localhost:8000/docs**

Gemini is optional. To use real Gemini responses, edit the root `.env`:

```text
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
AUTH_SECRET=replace_with_a_long_random_secret
VITE_API_BASE_URL=http://localhost:8000/api
TURSO_DATABASE_URL=file:tendon.db
TURSO_AUTH_TOKEN=
```

If `GEMINI_API_KEY` is blank, AI insights run in deterministic demo mode.
For deployment, set `AUTH_SECRET` to a long random value in Render and use your real Turso URL/token there. Do not put backend secrets in Vercel.

Stop Docker:

```bash
docker compose down
```

---

## Running Without Docker

Backend:

```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

Frontend in another terminal:

```bash
cd client
cp .env.example .env
npm run dev
```

Then open **http://localhost:5173**.

---

## Project Structure

```
project-root/
├── client/          ← React + Vite frontend with 3D body avatar
├── server/          ← FastAPI backend, tests, Gemini AI endpoints
├── postman/         ← API verification collection
├── design/          ← Design docs and change logs
└── docker-compose.yml
```

---

## Tech Stack

| Layer    | Tech                                      |
|----------|-------------------------------------------|
| Frontend | React 19, Vite, Tailwind CSS              |
| Backend  | Python, FastAPI, Pytest                   |
| AI       | Gemini API with demo-mode fallback        |
| 3D Model | Three.js, @react-three/fiber, drei        |
| Routing  | react-router-dom                          |
| Calendar | react-calendar                            |

---

## Troubleshooting

**Network Error** — make sure the backend is running at `http://localhost:8000` and `client/.env` contains `VITE_API_BASE_URL=http://localhost:8000/api`.

**`npm install` fails** — make sure you're inside the `client/` folder, not the project root.

**Port already in use** — kill whatever is on port 5173 or run `npm run dev -- --port 3000` to use a different port.

**3D model doesn't load** — the `.glb` file is in `client/public/`. Make sure it wasn't accidentally deleted.

**Run tests**

```bash
cd server
pytest -v
```
