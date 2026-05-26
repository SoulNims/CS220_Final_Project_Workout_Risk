# Tendon — Injury Risk Predictor

A web app where gym users log workouts and see an interactive human body avatar that color-codes each muscle group by current injury risk.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

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

## Running the App

From inside the `client/` directory:
```bash
npm run dev
```

Then open your browser to **http://localhost:5173**

---

## Project Structure

```
project-root/
├── client/          ← React + Vite frontend (run this)
│   └── src/
│       └── components/
└── design/          ← Design docs and change logs
```

---

## Tech Stack

| Layer    | Tech                                      |
|----------|-------------------------------------------|
| Frontend | React 19, Vite, Tailwind CSS              |
| 3D Model | Three.js, @react-three/fiber, drei        |
| Routing  | react-router-dom                          |
| Calendar | react-calendar                            |

---

## Troubleshooting

**`npm install` fails** — make sure you're inside the `client/` folder, not the project root.

**Port already in use** — kill whatever is on port 5173 or run `npm run dev -- --port 3000` to use a different port.

**3D model doesn't load** — the `.glb` file is in `client/public/`. Make sure it wasn't accidentally deleted.
