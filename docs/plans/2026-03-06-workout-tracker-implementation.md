# Workout Tracker Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the COMPOUND//FIRST workout tracker as a React/TypeScript/Vite app with session-based logging, exercise library, templates, and progress tracking.

**Architecture:** Session-based logging replaces fixed programs. Users start sessions from templates or freestyle, log exercises with sets/reps/weight. Exercise library tracks variations. Progress views show history, charts, PRs, and summaries. All data persists to localStorage, offline-first.

**Tech Stack:** React 18, TypeScript, Vite, Chart.js, date-fns, gh-pages

---

## Phase 1: Project Setup

### Task 1: Initialize Vite Project

**Files:**
- Create: Project structure via Vite CLI

**Step 1: Create Vite project**

```bash
cd /Users/williamkrause/development/workout
npm create vite@latest . -- --template react-ts
```

When prompted, select: "Current directory" then proceed.

**Step 2: Install dependencies**

```bash
npm install chart.js react-chartjs-2 date-fns
npm install -D gh-pages @types/node
```

**Step 3: Verify dev server works**

```bash
npm run dev
```

Expected: Dev server starts at http://localhost:5173

**Step 4: Commit**

```bash
git add .
git commit -m "$(cat <<'EOF'
chore: initialize Vite React TypeScript project

- React 18 + TypeScript + Vite
- Added chart.js, react-chartjs-2, date-fns
- Added gh-pages for deployment

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Configure Vite for GitHub Pages

**Files:**
- Modify: `vite.config.ts`

**Step 1: Update vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/workout/',
})
```

**Step 2: Update package.json scripts**

Add to `package.json` scripts section:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  "preview": "vite preview",
  "deploy": "npm run build && gh-pages -d dist"
}
```

**Step 3: Verify build works**

```bash
npm run build
```

Expected: Build succeeds, creates `dist/` folder

**Step 4: Commit**

```bash
git add vite.config.ts package.json
git commit -m "$(cat <<'EOF'
chore: configure Vite for GitHub Pages deployment

- Set base path to /workout/
- Add deploy script

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create TypeScript Types

**Files:**
- Create: `src/types/index.ts`

**Step 1: Create types file**

```typescript
// src/types/index.ts

export interface Exercise {
  id: string;
  name: string;
  category: 'compound' | 'accessory';
  muscleGroups: string[];
  variationOf?: string;
  createdAt: string;
}

export interface Set {
  weight: number | null;
  reps: number | null;
  isWarmup?: boolean;
}

export interface SessionExercise {
  exerciseId: string;
  exerciseName: string;
  sets: Set[];
  notes?: string;
}

export interface Session {
  id: string;
  date: string;
  exercises: SessionExercise[];
  notes?: string;
  templateId?: string;
  templateName?: string;
  completedAt?: string;
}

export interface TemplateExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets?: string;
  targetReps?: string;
  restSeconds?: number;
  priority: 'main' | 'support' | 'optional';
  notes?: string;
}

export interface Template {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  theme: 'dark' | 'light';
  units: 'lbs' | 'kg';
  compoundRestSeconds: number;
  assistanceRestSeconds: number;
}

export interface AppState {
  exercises: Exercise[];
  sessions: Session[];
  templates: Template[];
  settings: Settings;
  currentSessionId?: string;
}

export type ViewType = 'today' | 'history' | 'exercises' | 'templates' | 'settings';
```

**Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "$(cat <<'EOF'
feat: add TypeScript type definitions

Core types for Exercise, Session, Template, Settings, and AppState

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2: State Management & Persistence

### Task 4: Create Utility Functions

**Files:**
- Create: `src/utils/helpers.ts`
- Create: `src/utils/calculations.ts`

**Step 1: Create helpers utility**

```typescript
// src/utils/helpers.ts

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function formatVolume(volume: number): string {
  return volume.toLocaleString();
}
```

**Step 2: Create calculations utility**

```typescript
// src/utils/calculations.ts

import { Set } from '../types';

/**
 * Calculate estimated 1RM using Brzycki formula
 */
export function calculate1RM(weight: number, reps: number): number | null {
  if (reps <= 0 || weight <= 0) return null;
  if (reps === 1) return weight;
  return Math.round(weight * (36 / (37 - reps)));
}

/**
 * Calculate total volume for a set
 */
export function calculateSetVolume(set: Set): number {
  if (!set.weight || !set.reps) return 0;
  return set.weight * set.reps;
}

/**
 * Calculate total volume for an exercise
 */
export function calculateExerciseVolume(sets: Set[]): number {
  return sets.reduce((sum, set) => sum + calculateSetVolume(set), 0);
}

/**
 * Get the top weight from sets
 */
export function getTopWeight(sets: Set[]): number | null {
  const weights = sets.filter(s => s.weight).map(s => s.weight as number);
  return weights.length > 0 ? Math.max(...weights) : null;
}

/**
 * Get the best reps at a given weight
 */
export function getBestRepsAtWeight(sets: Set[], weight: number): number {
  const matchingSets = sets.filter(s => s.weight === weight && s.reps);
  if (matchingSets.length === 0) return 0;
  return Math.max(...matchingSets.map(s => s.reps as number));
}

/**
 * Get total reps across all sets
 */
export function getTotalReps(sets: Set[]): number {
  return sets.reduce((sum, set) => sum + (set.reps || 0), 0);
}
```

**Step 3: Commit**

```bash
git add src/utils/
git commit -m "$(cat <<'EOF'
feat: add utility functions for IDs, dates, and calculations

- generateId, formatDate, formatTime, formatVolume
- 1RM calculation (Brzycki), volume, top weight helpers

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Create App Context and Hooks

**Files:**
- Create: `src/context/AppContext.tsx`
- Create: `src/hooks/useLocalStorage.ts`

**Step 1: Create useLocalStorage hook**

```typescript
// src/hooks/useLocalStorage.ts

import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
```

**Step 2: Create AppContext**

```typescript
// src/context/AppContext.tsx

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { AppState, Session, Template, Exercise, Settings } from '../types';
import { generateId } from '../utils/helpers';

const STORAGE_KEY = 'compound-first-v2';

const defaultSettings: Settings = {
  theme: 'dark',
  units: 'lbs',
  compoundRestSeconds: 180,
  assistanceRestSeconds: 90,
};

const initialState: AppState = {
  exercises: [],
  sessions: [],
  templates: [],
  settings: defaultSettings,
};

interface AppContextType extends AppState {
  // Session actions
  startSession: (templateId?: string) => string;
  updateSession: (session: Session) => void;
  completeSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  getCurrentSession: () => Session | undefined;

  // Template actions
  addTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTemplate: (template: Template) => void;
  deleteTemplate: (templateId: string) => void;

  // Exercise actions
  addExercise: (exercise: Omit<Exercise, 'id' | 'createdAt'>) => string;
  updateExercise: (exercise: Exercise) => void;
  deleteExercise: (exerciseId: string) => void;

  // Settings actions
  updateSettings: (settings: Partial<Settings>) => void;

  // Data actions
  exportData: () => string;
  importData: (json: string) => boolean;

  // View state
  currentView: string;
  setCurrentView: (view: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useLocalStorage<AppState>(STORAGE_KEY, initialState);
  const [currentView, setCurrentView] = useState('today');

  // Session actions
  const startSession = useCallback((templateId?: string): string => {
    const sessionId = generateId();
    const template = templateId ? state.templates.find(t => t.id === templateId) : undefined;

    const newSession: Session = {
      id: sessionId,
      date: new Date().toISOString(),
      exercises: template ? template.exercises.map(te => ({
        exerciseId: te.exerciseId || generateId(),
        exerciseName: te.exerciseName,
        sets: [],
        notes: te.notes,
      })) : [],
      templateId,
      templateName: template?.name,
    };

    setState(prev => ({
      ...prev,
      sessions: [...prev.sessions, newSession],
      currentSessionId: sessionId,
    }));

    return sessionId;
  }, [state.templates, setState]);

  const updateSession = useCallback((session: Session) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.id === session.id ? session : s),
    }));
  }, [setState]);

  const completeSession = useCallback((sessionId: string) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(s =>
        s.id === sessionId ? { ...s, completedAt: new Date().toISOString() } : s
      ),
      currentSessionId: undefined,
    }));
  }, [setState]);

  const deleteSession = useCallback((sessionId: string) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.filter(s => s.id !== sessionId),
      currentSessionId: prev.currentSessionId === sessionId ? undefined : prev.currentSessionId,
    }));
  }, [setState]);

  const getCurrentSession = useCallback((): Session | undefined => {
    if (!state.currentSessionId) return undefined;
    return state.sessions.find(s => s.id === state.currentSessionId);
  }, [state.currentSessionId, state.sessions]);

  // Template actions
  const addTemplate = useCallback((template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const id = generateId();
    const now = new Date().toISOString();
    setState(prev => ({
      ...prev,
      templates: [...prev.templates, { ...template, id, createdAt: now, updatedAt: now }],
    }));
    return id;
  }, [setState]);

  const updateTemplate = useCallback((template: Template) => {
    setState(prev => ({
      ...prev,
      templates: prev.templates.map(t =>
        t.id === template.id ? { ...template, updatedAt: new Date().toISOString() } : t
      ),
    }));
  }, [setState]);

  const deleteTemplate = useCallback((templateId: string) => {
    setState(prev => ({
      ...prev,
      templates: prev.templates.filter(t => t.id !== templateId),
    }));
  }, [setState]);

  // Exercise actions
  const addExercise = useCallback((exercise: Omit<Exercise, 'id' | 'createdAt'>): string => {
    const id = generateId();
    setState(prev => ({
      ...prev,
      exercises: [...prev.exercises, { ...exercise, id, createdAt: new Date().toISOString() }],
    }));
    return id;
  }, [setState]);

  const updateExercise = useCallback((exercise: Exercise) => {
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => e.id === exercise.id ? exercise : e),
    }));
  }, [setState]);

  const deleteExercise = useCallback((exerciseId: string) => {
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.filter(e => e.id !== exerciseId),
    }));
  }, [setState]);

  // Settings actions
  const updateSettings = useCallback((settings: Partial<Settings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  }, [setState]);

  // Data actions
  const exportData = useCallback((): string => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importData = useCallback((json: string): boolean => {
    try {
      const data = JSON.parse(json) as AppState;
      setState(data);
      return true;
    } catch {
      return false;
    }
  }, [setState]);

  const value: AppContextType = {
    ...state,
    startSession,
    updateSession,
    completeSession,
    deleteSession,
    getCurrentSession,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    addExercise,
    updateExercise,
    deleteExercise,
    updateSettings,
    exportData,
    importData,
    currentView,
    setCurrentView,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
```

**Step 3: Commit**

```bash
git add src/context/ src/hooks/
git commit -m "$(cat <<'EOF'
feat: add state management with context and localStorage

- useLocalStorage hook for persistence
- AppContext with all actions for sessions, templates, exercises, settings
- Export/import data functionality

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3: Basic UI Components

### Task 6: Create CSS Variables and Global Styles

**Files:**
- Create: `src/index.css`
- Modify: `src/main.tsx`

**Step 1: Create global CSS**

```css
/* src/index.css */

:root {
  --bg: #0a0a0a;
  --bg-elevated: #111111;
  --bg-card: #161616;
  --fg: #f5f5f5;
  --fg-muted: #888888;
  --fg-dim: #444444;
  --accent: #c8ff00;
  --accent-dim: #9acc00;
  --accent-glow: rgba(200, 255, 0, 0.15);
  --danger: #ff4444;
  --border: #2a2a2a;
  --border-active: #3a3a3a;
  --radius: 4px;
  --radius-lg: 8px;
  --font-display: 'Bebas Neue', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-body: 'Inter', sans-serif;
}

[data-theme="light"] {
  --bg: #f8f8f8;
  --bg-elevated: #ffffff;
  --bg-card: #ffffff;
  --fg: #1a1a1a;
  --fg-muted: #666666;
  --fg-dim: #999999;
  --accent: #00aa44;
  --accent-dim: #008833;
  --accent-glow: rgba(0, 170, 68, 0.15);
  --border: #e0e0e0;
  --border-active: #cccccc;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--fg);
  min-height: 100vh;
  line-height: 1.5;
  overflow-x: hidden;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    linear-gradient(90deg, var(--border) 1px, transparent 1px),
    linear-gradient(var(--border) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.3;
  pointer-events: none;
  z-index: -1;
}

.display-font {
  font-family: var(--font-display);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.mono-font {
  font-family: var(--font-mono);
}

#root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
```

**Step 2: Update main.tsx to import CSS**

```typescript
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Step 3: Update index.html with fonts**

Replace the contents of `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Offline-first workout tracking">
    <meta name="theme-color" content="#0a0a0a">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <title>COMPOUND//FIRST</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 4: Commit**

```bash
git add src/index.css src/main.tsx index.html
git commit -m "$(cat <<'EOF'
feat: add global styles with CSS variables and fonts

- Dark/light theme CSS variables
- Grid background pattern
- Bebas Neue, JetBrains Mono, Inter fonts

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Create Common UI Components

**Files:**
- Create: `src/components/common/Button.tsx`
- Create: `src/components/common/Input.tsx`
- Create: `src/components/common/index.ts`

**Step 1: Create Button component**

```typescript
// src/components/common/Button.tsx

import { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

**Step 2: Create Button CSS module**

```css
/* src/components/common/Button.module.css */

.button {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border: none;
  cursor: pointer;
  border-radius: var(--radius);
  transition: all 0.15s ease;
}

.primary {
  background: var(--accent);
  color: var(--bg);
}

.primary:hover {
  filter: brightness(1.1);
}

.secondary {
  background: var(--bg-card);
  color: var(--fg);
  border: 1px solid var(--border);
}

.secondary:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.ghost {
  background: transparent;
  color: var(--fg-muted);
}

.ghost:hover {
  color: var(--fg);
}

.sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.65rem;
}

.md {
  padding: 0.6rem 1rem;
}

.lg {
  padding: 0.8rem 1.5rem;
  font-size: 0.85rem;
}
```

**Step 3: Create Input component**

```typescript
// src/components/common/Input.tsx

import { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={`${styles.input} ${className}`} {...props} />
    </div>
  );
}
```

**Step 4: Create Input CSS module**

```css
/* src/components/common/Input.module.css */

.wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.input {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.6rem 0.75rem;
  color: var(--fg);
  transition: all 0.15s ease;
}

.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.input::placeholder {
  color: var(--fg-dim);
}
```

**Step 5: Create index export**

```typescript
// src/components/common/index.ts

export { Button } from './Button';
export { Input } from './Input';
```

**Step 6: Commit**

```bash
git add src/components/common/
git commit -m "$(cat <<'EOF'
feat: add common UI components (Button, Input)

CSS modules for styling, variants for different use cases

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Create Layout Components

**Files:**
- Create: `src/components/Layout.tsx`
- Create: `src/components/Header.tsx`

**Step 1: Create Header component**

```typescript
// src/components/Header.tsx

import { useApp } from '../context/AppContext';
import { Button } from './common';
import styles from './Header.module.css';

const NAV_ITEMS = [
  { id: 'today', label: 'Today' },
  { id: 'history', label: 'History' },
  { id: 'exercises', label: 'Exercises' },
  { id: 'templates', label: 'Templates' },
  { id: 'settings', label: 'Settings' },
];

export function Header() {
  const { currentView, setCurrentView, settings, updateSettings } = useApp();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <div className={styles.logoMain}>
            COMPOUND<span className={styles.accent}>//</span>FIRST
          </div>
          <div className={styles.logoSub}>Workout Tracker</div>
        </div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map(item => (
            <Button
              key={item.id}
              variant={currentView === item.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView(item.id)}
            >
              {item.label}
            </Button>
          ))}
          <button
            className={styles.themeBtn}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {settings.theme === 'dark' ? '☀' : '☾'}
          </button>
        </nav>
      </div>
    </header>
  );
}
```

**Step 2: Create Header CSS module**

```css
/* src/components/Header.module.css */

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  padding: 1rem;
}

.inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.logo {
  display: flex;
  flex-direction: column;
}

.logoMain {
  font-family: var(--font-display);
  font-size: 1.75rem;
  letter-spacing: 0.1em;
}

.accent {
  color: var(--accent);
}

.logoSub {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

.nav {
  display: flex;
  gap: 0.25rem;
  background: var(--bg-elevated);
  padding: 0.25rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.themeBtn {
  font-size: 1.1rem;
  padding: 0.5rem 0.6rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--fg);
  cursor: pointer;
  border-radius: var(--radius);
  transition: all 0.15s ease;
  margin-left: 0.25rem;
}

.themeBtn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

@media (max-width: 768px) {
  .inner {
    flex-direction: column;
    align-items: stretch;
  }

  .nav {
    justify-content: center;
    flex-wrap: wrap;
  }
}
```

**Step 3: Create Layout component**

```typescript
// src/components/Layout.tsx

import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { settings } = useApp();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  return (
    <div className={styles.app}>
      <Header />
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p className={styles.footerText}>Data stored locally | Works offline</p>
      </footer>
    </div>
  );
}
```

**Step 4: Create Layout CSS module**

```css
/* src/components/Layout.module.css */

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main {
  flex: 1;
  padding: 2rem 1rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.footer {
  padding: 2rem 1rem;
  border-top: 1px solid var(--border);
  text-align: center;
}

.footerText {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--fg-dim);
  text-transform: uppercase;
  letter-spacing: 0.2em;
}
```

**Step 5: Commit**

```bash
git add src/components/Header.tsx src/components/Header.module.css src/components/Layout.tsx src/components/Layout.module.css
git commit -m "$(cat <<'EOF'
feat: add Layout and Header components

- Header with navigation and theme toggle
- Layout wrapper with footer
- Responsive design

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4: Today View (Session Logging)

### Task 9: Create Exercise Card Component

**Files:**
- Create: `src/components/session/ExerciseCard.tsx`

**Step 1: Create ExerciseCard component**

```typescript
// src/components/session/ExerciseCard.tsx

import { useState } from 'react';
import { SessionExercise, Set } from '../../types';
import { calculateSetVolume } from '../../utils/calculations';
import styles from './ExerciseCard.module.css';

interface ExerciseCardProps {
  exercise: SessionExercise;
  onUpdate: (exercise: SessionExercise) => void;
  onRemove: () => void;
}

export function ExerciseCard({ exercise, onUpdate, onRemove }: ExerciseCardProps) {
  const [showAllSets, setShowAllSets] = useState(false);

  const visibleSets = showAllSets ? 8 : 5;
  const setsToShow = exercise.sets.length >= visibleSets ? exercise.sets : [
    ...exercise.sets,
    ...Array(visibleSets - exercise.sets.length).fill(null).map(() => ({ weight: null, reps: null } as Set))
  ];

  const updateSet = (index: number, field: 'weight' | 'reps', value: number | null) => {
    const newSets = [...exercise.sets];
    if (!newSets[index]) {
      newSets[index] = { weight: null, reps: null };
    }
    newSets[index] = { ...newSets[index], [field]: value };
    onUpdate({ ...exercise, sets: newSets.filter(s => s.weight || s.reps) });
  };

  const handleInputChange = (index: number, field: 'weight' | 'reps', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    updateSet(index, field, numValue);
  };

  const completedSets = exercise.sets.filter(s => s.weight && s.reps);
  const isCompleted = completedSets.length > 0;

  const totalVolume = completedSets.reduce((sum, s) => sum + calculateSetVolume(s), 0);
  const topWeight = completedSets.length > 0 ? Math.max(...completedSets.map(s => s.weight || 0)) : 0;
  const totalReps = completedSets.reduce((sum, s) => sum + (s.reps || 0), 0);

  return (
    <div className={`${styles.card} ${isCompleted ? styles.completed : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.name}>{exercise.exerciseName}</h3>
        <button className={styles.removeBtn} onClick={onRemove} aria-label="Remove exercise">
          ×
        </button>
      </div>

      <div className={styles.sets}>
        <div className={styles.setHeader}>
          <span className={styles.setHeaderItem}>Set</span>
          <span className={styles.setHeaderItem}>Weight</span>
          <span className={styles.setHeaderItem}>Reps</span>
          <span className={styles.setHeaderItem}>Vol</span>
        </div>
        {setsToShow.slice(0, visibleSets).map((set, index) => {
          const volume = set?.weight && set?.reps ? set.weight * set.reps : null;
          const isFilled = set?.weight || set?.reps;

          return (
            <div key={index} className={styles.setRow}>
              <span className={styles.setNumber}>{index + 1}</span>
              <input
                type="number"
                className={`${styles.setInput} ${isFilled ? styles.filled : ''}`}
                placeholder="lbs"
                value={set?.weight ?? ''}
                onChange={(e) => handleInputChange(index, 'weight', e.target.value)}
                step="2.5"
              />
              <input
                type="number"
                className={`${styles.setInput} ${isFilled ? styles.filled : ''}`}
                placeholder="reps"
                value={set?.reps ?? ''}
                onChange={(e) => handleInputChange(index, 'reps', e.target.value)}
              />
              <span className={styles.setVolume}>
                {volume ? <span className={styles.volValue}>{volume}</span> : ''}
              </span>
            </div>
          );
        })}
      </div>

      {showAllSets === false && exercise.sets.length >= 5 && (
        <button className={styles.moreBtn} onClick={() => setShowAllSets(true)}>
          + Add more sets
        </button>
      )}

      {isCompleted && (
        <div className={styles.summary}>
          <div className={styles.summaryStat}>
            <dt>Top Wt</dt>
            <dd>{topWeight}</dd>
          </div>
          <div className={styles.summaryStat}>
            <dt>Total Reps</dt>
            <dd>{totalReps}</dd>
          </div>
          <div className={styles.summaryStat}>
            <dt>Volume</dt>
            <dd className={styles.accent}>{totalVolume.toLocaleString()}</dd>
          </div>
        </div>
      )}

      <div className={styles.notes}>
        <input
          type="text"
          className={styles.notesInput}
          placeholder="Notes..."
          value={exercise.notes || ''}
          onChange={(e) => onUpdate({ ...exercise, notes: e.target.value })}
        />
      </div>
    </div>
  );
}
```

**Step 2: Create ExerciseCard CSS module**

```css
/* src/components/session/ExerciseCard.module.css */

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.2s ease;
}

.card:hover {
  border-color: var(--border-active);
}

.completed {
  border-color: var(--accent);
  box-shadow: 0 0 30px var(--accent-glow);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  background: var(--bg-elevated);
}

.name {
  font-family: var(--font-display);
  font-size: 1.5rem;
  letter-spacing: 0.05em;
}

.removeBtn {
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 50%;
  color: var(--fg-muted);
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  transition: all 0.15s ease;
}

.removeBtn:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.sets {
  padding: 0.75rem;
}

.setHeader {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 60px;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  margin-bottom: 0.25rem;
}

.setHeaderItem {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--fg-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.setRow {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 60px;
  gap: 0.5rem;
  align-items: center;
  padding: 0.5rem;
  border-radius: var(--radius);
  transition: background 0.15s ease;
}

.setRow:hover {
  background: var(--bg-elevated);
}

.setNumber {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--fg-dim);
  text-align: center;
}

.setInput {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 500;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.6rem 0.75rem;
  color: var(--fg);
  width: 100%;
  transition: all 0.15s ease;
}

.setInput:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.setInput::placeholder {
  color: var(--fg-dim);
}

.filled {
  background: var(--bg-elevated);
  border-color: var(--accent);
}

.setVolume {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--fg-muted);
  text-align: right;
}

.volValue {
  color: var(--accent);
  font-weight: 600;
}

.moreBtn {
  width: 100%;
  padding: 0.5rem;
  background: var(--bg-elevated);
  border: none;
  border-top: 1px solid var(--border);
  color: var(--fg-muted);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.moreBtn:hover {
  color: var(--accent);
}

.summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--border);
  border-top: 1px solid var(--border);
  margin-top: 0.5rem;
}

.summaryStat {
  background: var(--bg-elevated);
  padding: 0.75rem 1rem;
  text-align: center;
}

.summaryStat dt {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--fg-dim);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 0.25rem;
}

.summaryStat dd {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 600;
  color: var(--fg);
  margin: 0;
}

.accent {
  color: var(--accent) !important;
}

.notes {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--border);
}

.notesInput {
  font-family: var(--font-body);
  font-size: 0.8rem;
  background: transparent;
  border: none;
  color: var(--fg-muted);
  width: 100%;
  padding: 0;
}

.notesInput:focus {
  outline: none;
  color: var(--fg);
}

.notesInput::placeholder {
  color: var(--fg-dim);
}

@media (max-width: 768px) {
  .setRow {
    grid-template-columns: 32px 1fr 1fr;
  }

  .setVolume {
    display: none;
  }
}
```

**Step 3: Commit**

```bash
git add src/components/session/
git commit -m "$(cat <<'EOF'
feat: add ExerciseCard component for session logging

- Set input with weight/reps
- Auto-calculated volume
- Summary stats when completed
- Notes field

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Create Today View

**Files:**
- Create: `src/components/views/TodayView.tsx`
- Create: `src/components/views/index.ts`

**Step 1: Create TodayView component**

```typescript
// src/components/views/TodayView.tsx

import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SessionExercise } from '../../types';
import { ExerciseCard } from '../session/ExerciseCard';
import { Button } from '../common';
import styles from './TodayView.module.css';

export function TodayView() {
  const { getCurrentSession, updateSession, startSession, templates, exercises, addExercise } = useApp();
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');

  const session = getCurrentSession();

  const handleStartFromTemplate = (templateId: string) => {
    startSession(templateId);
    setShowTemplates(false);
  };

  const handleStartFreestyle = () => {
    startSession();
    setShowTemplates(false);
  };

  const handleAddExercise = () => {
    if (!newExerciseName.trim() || !session) return;

    const existingExercise = exercises.find(
      e => e.name.toLowerCase() === newExerciseName.trim().toLowerCase()
    );

    let exerciseId: string;
    if (existingExercise) {
      exerciseId = existingExercise.id;
    } else {
      exerciseId = addExercise({
        name: newExerciseName.trim(),
        category: 'accessory',
        muscleGroups: [],
      });
    }

    const newExercise: SessionExercise = {
      exerciseId,
      exerciseName: newExerciseName.trim(),
      sets: [],
    };

    updateSession({
      ...session,
      exercises: [...session.exercises, newExercise],
    });

    setNewExerciseName('');
    setShowAddExercise(false);
  };

  const handleUpdateExercise = (index: number, exercise: SessionExercise) => {
    if (!session) return;
    const newExercises = [...session.exercises];
    newExercises[index] = exercise;
    updateSession({ ...session, exercises: newExercises });
  };

  const handleRemoveExercise = (index: number) => {
    if (!session) return;
    const newExercises = session.exercises.filter((_, i) => i !== index);
    updateSession({ ...session, exercises: newExercises });
  };

  if (!session) {
    return (
      <div className={styles.empty}>
        <h2 className={styles.emptyTitle}>Start a Workout</h2>
        <p className={styles.emptyText}>Choose a template or start freestyle</p>

        <div className={styles.actions}>
          <Button variant="primary" size="lg" onClick={handleStartFreestyle}>
            Freestyle
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setShowTemplates(true)}>
            From Template
          </Button>
        </div>

        {showTemplates && (
          <div className={styles.templateList}>
            {templates.length === 0 ? (
              <p className={styles.noTemplates}>No templates yet. Create one in Templates view.</p>
            ) : (
              templates.map(template => (
                <button
                  key={template.id}
                  className={styles.templateBtn}
                  onClick={() => handleStartFromTemplate(template.id)}
                >
                  <span className={styles.templateName}>{template.name}</span>
                  <span className={styles.templateInfo}>
                    {template.exercises.length} exercises
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.today}>
      <div className={styles.sessionHeader}>
        <div>
          <h2 className={styles.sessionTitle}>
            {session.templateName || 'Freestyle Workout'}
          </h2>
          <p className={styles.sessionDate}>
            {new Date(session.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowAddExercise(true)}>
          + Add Exercise
        </Button>
      </div>

      <div className={styles.exercises}>
        {session.exercises.map((exercise, index) => (
          <ExerciseCard
            key={`${exercise.exerciseId}-${index}`}
            exercise={exercise}
            onUpdate={(e) => handleUpdateExercise(index, e)}
            onRemove={() => handleRemoveExercise(index)}
          />
        ))}
      </div>

      {session.exercises.length === 0 && (
        <div className={styles.noExercises}>
          <p>No exercises yet. Add one to get started.</p>
        </div>
      )}

      {showAddExercise && (
        <div className={styles.addExerciseModal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Add Exercise</h3>
            <input
              type="text"
              className={styles.exerciseInput}
              placeholder="Exercise name..."
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
              autoFocus
            />
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setShowAddExercise(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddExercise}>
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create TodayView CSS module**

```css
/* src/components/views/TodayView.module.css */

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
}

.emptyTitle {
  font-family: var(--font-display);
  font-size: 3rem;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.emptyText {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--fg-muted);
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.templateList {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 400px;
}

.templateBtn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s ease;
}

.templateBtn:hover {
  border-color: var(--accent);
}

.templateName {
  font-weight: 600;
}

.templateInfo {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--fg-muted);
}

.noTemplates {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--fg-muted);
}

.today {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.sessionHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.sessionTitle {
  font-family: var(--font-display);
  font-size: 2rem;
  letter-spacing: 0.05em;
}

.sessionDate {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--fg-muted);
  margin-top: 0.25rem;
}

.exercises {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.noExercises {
  text-align: center;
  padding: 3rem;
  color: var(--fg-muted);
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

.addExerciseModal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  animation: fadeIn 0.15s ease;
}

.modalContent {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  width: 90%;
  max-width: 400px;
}

.modalTitle {
  font-family: var(--font-display);
  font-size: 1.5rem;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.exerciseInput {
  font-family: var(--font-mono);
  font-size: 1rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  color: var(--fg);
  width: 100%;
  margin-bottom: 1rem;
}

.exerciseInput:focus {
  outline: none;
  border-color: var(--accent);
}

.modalActions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
```

**Step 3: Create views index**

```typescript
// src/components/views/index.ts

export { TodayView } from './TodayView';
```

**Step 4: Commit**

```bash
git add src/components/views/
git commit -m "$(cat <<'EOF'
feat: add TodayView with session start and exercise logging

- Start from template or freestyle
- Add exercises to session
- Real-time set logging

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5: Wire Up App Component

### Task 11: Create Main App Component

**Files:**
- Modify: `src/App.tsx`

**Step 1: Update App.tsx**

```typescript
// src/App.tsx

import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { TodayView } from './components/views/TodayView';

function AppContent() {
  const { currentView } = useApp();

  const renderView = () => {
    switch (currentView) {
      case 'today':
        return <TodayView />;
      case 'history':
        return <div style={{ padding: '2rem', textAlign: 'center' }}>History view coming soon...</div>;
      case 'exercises':
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Exercises view coming soon...</div>;
      case 'templates':
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Templates view coming soon...</div>;
      case 'settings':
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Settings view coming soon...</div>;
      default:
        return <TodayView />;
    }
  };

  return (
    <Layout>
      {renderView()}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
```

**Step 2: Verify app runs**

```bash
npm run dev
```

Expected: App loads at http://localhost:5173 with header, navigation, and Today view visible

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "$(cat <<'EOF'
feat: wire up App component with routing

AppProvider wrapper, Layout, view switching via state

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6: Default Templates

### Task 12: Add Seed Data for Default Templates

**Files:**
- Create: `src/data/seedData.ts`
- Modify: `src/context/AppContext.tsx`

**Step 1: Create seed data**

```typescript
// src/data/seedData.ts

import { Template, Exercise } from '../types';

export const defaultExercises: Omit<Exercise, 'id' | 'createdAt'>[] = [
  // Program A
  { name: 'Back Squat', category: 'compound', muscleGroups: ['quads', 'glutes'] },
  { name: 'Barbell Bench Press', category: 'compound', muscleGroups: ['chest', 'shoulders', 'triceps'] },
  { name: 'Chest-Supported Row', category: 'compound', muscleGroups: ['back', 'biceps'] },
  { name: 'Romanian Deadlift', category: 'compound', muscleGroups: ['hamstrings', 'glutes'] },
  { name: 'Leg Curl', category: 'accessory', muscleGroups: ['hamstrings'] },

  // Program B
  { name: 'Trap Bar Deadlift', category: 'compound', muscleGroups: ['back', 'glutes', 'hamstrings'] },
  { name: 'Overhead Press', category: 'compound', muscleGroups: ['shoulders', 'triceps'] },
  { name: 'Pull-ups', category: 'compound', muscleGroups: ['back', 'biceps'] },
  { name: 'Lat Pulldown', category: 'compound', muscleGroups: ['back', 'biceps'] },
  { name: 'Split Squat', category: 'accessory', muscleGroups: ['quads', 'glutes'] },
  { name: 'Leg Press', category: 'accessory', muscleGroups: ['quads'] },
  { name: 'Ab Wheel', category: 'accessory', muscleGroups: ['core'] },
  { name: 'Dead Bug', category: 'accessory', muscleGroups: ['core'] },

  // Program C
  { name: 'Front Squat', category: 'compound', muscleGroups: ['quads', 'core'] },
  { name: 'Incline Bench Press', category: 'compound', muscleGroups: ['chest', 'shoulders'] },
  { name: 'Barbell Row', category: 'compound', muscleGroups: ['back', 'biceps'] },
  { name: 'Hip Thrust', category: 'accessory', muscleGroups: ['glutes'] },
];

export const defaultTemplates: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Program A',
    exercises: [
      { exerciseId: '', exerciseName: 'Back Squat', targetSets: '4-5', targetReps: '3-6', restSeconds: 180, priority: 'main' },
      { exerciseId: '', exerciseName: 'Barbell Bench Press', targetSets: '4-5', targetReps: '3-6', restSeconds: 180, priority: 'main' },
      { exerciseId: '', exerciseName: 'Chest-Supported Row', targetSets: '3-4', targetReps: '6-10', restSeconds: 90, priority: 'main' },
      { exerciseId: '', exerciseName: 'Romanian Deadlift', targetSets: '2-3', targetReps: '6-10', restSeconds: 90, priority: 'support' },
      { exerciseId: '', exerciseName: 'Leg Curl', targetSets: '2-3', targetReps: '10-15', restSeconds: 60, priority: 'optional' },
    ],
  },
  {
    name: 'Program B',
    exercises: [
      { exerciseId: '', exerciseName: 'Trap Bar Deadlift', targetSets: '3-5', targetReps: '3-6', restSeconds: 180, priority: 'main' },
      { exerciseId: '', exerciseName: 'Overhead Press', targetSets: '4', targetReps: '5-8', restSeconds: 180, priority: 'main' },
      { exerciseId: '', exerciseName: 'Pull-ups', targetSets: '4', targetReps: '6-10', restSeconds: 90, priority: 'main' },
      { exerciseId: '', exerciseName: 'Split Squat', targetSets: '2-3', targetReps: '8-12', restSeconds: 60, priority: 'support' },
      { exerciseId: '', exerciseName: 'Ab Wheel', targetSets: '2-3', targetReps: '-', restSeconds: 60, priority: 'support' },
    ],
  },
  {
    name: 'Program C',
    exercises: [
      { exerciseId: '', exerciseName: 'Front Squat', targetSets: '3-4', targetReps: '5-8', restSeconds: 180, priority: 'main' },
      { exerciseId: '', exerciseName: 'Incline Bench Press', targetSets: '3-4', targetReps: '6-10', restSeconds: 180, priority: 'main' },
      { exerciseId: '', exerciseName: 'Barbell Row', targetSets: '3-4', targetReps: '8-12', restSeconds: 90, priority: 'main' },
      { exerciseId: '', exerciseName: 'Hip Thrust', targetSets: '2-3', targetReps: '8-12', restSeconds: 60, priority: 'optional' },
    ],
  },
];
```

**Step 2: Update AppContext to use seed data**

Modify `src/context/AppContext.tsx` to import and use seed data on first load:

```typescript
// Add import at top
import { defaultExercises, defaultTemplates } from '../data/seedData';

// Update initialState:
const getInitialState = (): AppState => {
  const now = new Date().toISOString();
  return {
    exercises: defaultExercises.map((e, i) => ({
      ...e,
      id: `exercise-${i}`,
      createdAt: now,
    })),
    sessions: [],
    templates: defaultTemplates.map((t, i) => ({
      ...t,
      id: `template-${i}`,
      createdAt: now,
      updatedAt: now,
      exercises: t.exercises.map((te, j) => ({
        ...te,
        exerciseId: `exercise-${getExerciseIndex(te.exerciseName)}`,
      })),
    })),
    settings: defaultSettings,
  };
};

function getExerciseIndex(name: string): number {
  const index = defaultExercises.findIndex(e => e.name === name);
  return index >= 0 ? index : 0;
}

// Replace initialState with:
const initialState = getInitialState();
```

**Step 3: Commit**

```bash
git add src/data/seedData.ts src/context/AppContext.tsx
git commit -m "$(cat <<'EOF'
feat: add seed data for default exercises and templates

Program A, B, C templates with common exercises pre-populated

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Remaining Tasks (Summary)

The following tasks follow the same pattern. For brevity, I'm summarizing them:

### Task 13: Templates View
- Create `TemplatesView.tsx` to display, create, edit, delete templates
- Template editor with exercise list, target sets/reps

### Task 14: Exercise Library View
- Create `ExercisesView.tsx` to show all exercises
- Ability to add/edit/delete exercises
- Link variations

### Task 15: History View
- Create `HistoryView.tsx` to list past sessions
- Filter by date range
- Click to view session details

### Task 16: Progress Tracking
- Create `ExerciseDetailView.tsx` for individual exercise history
- Add Chart.js line chart for weight/volume over time
- PR detection and display

### Task 17: Settings View
- Create `SettingsView.tsx`
- Theme toggle, units toggle, timer defaults
- Export/Import JSON buttons

### Task 18: Deployment
- Create `.github/workflows/deploy.yml`
- Test deployment to GitHub Pages
- Update README with setup instructions

---

**End of Plan**
