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
