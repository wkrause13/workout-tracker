# Workout Tracker Redesign

**Date:** 2026-03-06
**Status:** Approved

## Overview

Redesign the COMPOUND//FIRST workout tracker from a single HTML file to a modern React/TypeScript/Vite application while maintaining offline-first functionality and GitHub Pages deployment.

## Goals

1. **Program flexibility** - Support exercise swaps, volume variation, and intuitive training
2. **Progress visibility** - Exercise history, trend charts, PR tracking, and summaries
3. **Modern tooling** - React, TypeScript, Vite with automated deployment

---

## 1. Core Data Model

### Sessions Over Fixed Programs

The app logs **sessions**, not fixed programs. Each session records:
- Date
- Exercises performed
- Sets, reps, weight for each exercise
- Optional notes

### Exercise Library

Users build their exercise library over time. Each exercise:
- Has a name and category (compound/accessory)
- Can be tagged with muscle groups
- Can be linked as a variation of another exercise (e.g., Front Squat → variation of Back Squat)

### Data Types

```typescript
interface Exercise {
  id: string;
  name: string;
  category: 'compound' | 'accessory';
  muscleGroups: string[];
  variationOf?: string; // parent exercise ID
  createdAt: string;
}

interface Set {
  weight: number | null;
  reps: number | null;
  isWarmup?: boolean;
}

interface SessionExercise {
  exerciseId: string;
  sets: Set[];
  notes?: string;
}

interface Session {
  id: string;
  date: string; // ISO date
  exercises: SessionExercise[];
  notes?: string;
  templateId?: string; // optional, if started from template
  completedAt?: string;
}

interface Template {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  createdAt: string;
  updatedAt: string;
}

interface TemplateExercise {
  exerciseId: string;
  exerciseName: string; // stored for display if exercise is deleted
  targetSets?: string; // e.g., "4-5"
  targetReps?: string; // e.g., "3-6"
  restSeconds?: number;
  priority: 'main' | 'support' | 'optional';
  notes?: string;
}

interface Settings {
  theme: 'dark' | 'light';
  units: 'lbs' | 'kg';
  compoundRestSeconds: number;
  assistanceRestSeconds: number;
}

interface AppState {
  exercises: Exercise[];
  sessions: Session[];
  templates: Template[];
  settings: Settings;
  currentSessionId?: string;
}
```

---

## 2. Templates & Freestyle

### Two Session Modes

1. **Template-based** - Pick a template, exercises pre-fill, modify freely
2. **Freestyle** - Blank session, add exercises as you go

No smart suggestions or nudges. Templates are just starting points.

### Template Management

- Create, edit, delete templates
- Templates store: exercise, target sets/reps, rest time, priority
- Current Program A/B/C become default templates (fully editable)

### During a Session

- Add/remove exercises anytime
- Swap exercise for a variation (tap exercise name → swap modal)
- Target sets/reps are reference only - log what you actually do
- Rest timer can auto-start after logging a set

---

## 3. Progress Tracking

### Exercise History

- Tap any exercise → see all past sessions
- Each entry: date, sets/reps/weight, volume, estimated 1RM
- Quick summary: "Last time: 3 days ago, top set 225x5"

### Trend Charts

- Line chart for weight/reps/volume over time
- Filter by date range (30/90/all time)
- Chart.js via npm

### PR Tracking

Automatically detect:
- Weight PR (heaviest single)
- Rep PR at weight (most reps at X lbs)
- Estimated 1RM PR

Subtle celebration when logging (small badge). PR history view per exercise.

### Weekly/Monthly Summaries

- Total sessions, volume, sets
- Comparison to previous period ("Volume up 12%")
- PRs hit in that period

---

## 4. App Structure

### Project Layout

```
workout-tracker/
├── src/
│   ├── components/
│   │   ├── common/          # Button, Input, Modal, etc.
│   │   ├── session/         # Session-related components
│   │   ├── exercise/        # Exercise library components
│   │   ├── progress/        # Charts, history, PRs
│   │   └── template/        # Template management
│   ├── hooks/               # useLocalStorage, useTimer, usePRs
│   ├── types/               # TypeScript interfaces
│   ├── utils/               # Calculations, formatting
│   ├── data/                # Default templates, seed data
│   ├── context/             # App state context
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Dependencies

- `react` + `react-dom`
- `typescript`
- `vite`
- `chart.js` + `react-chartjs-2`
- `date-fns`
- `gh-pages` (deployment)

### Views

1. **Today** - Active session or start new (template picker or freestyle)
2. **History** - Browse past sessions, filter by date
3. **Exercises** - Library view, tap for details + history + charts
4. **Templates** - Create/edit/delete
5. **Settings** - Theme, units, timer defaults, export/import

### State Management

- React context for global state
- localStorage for persistence
- No backend (offline-first)

---

## 5. UI/UX

### Design Language

- Dark theme default, light theme option
- Industrial/athletic aesthetic
- Bebas Neue for display text
- JetBrains Mono for data/numbers
- Grid background, sharp edges, high contrast
- Accent color: lime green (#c8ff00) for dark, green (#00aa44) for light

### UX Priorities

- **Quick logging** - Tab between weight/reps, enter to confirm
- **Exercise swap** - Tap name → modal with variations + search + add new
- **Rest timer** - Auto-start option, visible in header
- **Mobile-first** - Optimized for phone use in gym

### Data Safety

- Export to JSON (download)
- Import from JSON (restore/transfer)
- Optional: Google Drive sync in future

---

## 6. Deployment

### GitHub Pages

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

### GitHub Actions (Optional)

Auto-deploy on push to main:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 7. Migration

### From Current App

- Provide import tool for existing localStorage data
- Map Program A/B/C to default templates
- Convert day-based keys to session-based structure

### Data Migration Script

```typescript
function migrateOldData(oldData: OldState): AppState {
  // Convert old workoutData entries to sessions
  // Map exercise names to exercise library
  // Create default templates from Program A/B/C
}
```

---

## 8. Future Considerations

- Google Drive sync for multi-device
- Program builder (multi-week planning)
- Bodyweight/measurements tracking
- Workout sharing
- Apple Watch / Wear OS companion
