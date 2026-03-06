// src/context/AppContext.tsx

import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { AppState, Session, Template, Exercise, Settings, TemplateExercise } from '../types';
import { generateId } from '../utils/helpers';
import { defaultExercises, defaultTemplates } from '../data/seedData';

const STORAGE_KEY = 'compound-first-v2';

const defaultSettings: Settings = {
  theme: 'dark',
  units: 'lbs',
  compoundRestSeconds: 180,
  assistanceRestSeconds: 90,
};

// Get initial state with seed data for first-time users
function getInitialState(): AppState {
  const now = new Date().toISOString();

  // Seed exercises with IDs
  const seededExercises: Exercise[] = defaultExercises.map(exercise => ({
    id: generateId(),
    name: exercise.name,
    category: exercise.category,
    muscleGroups: exercise.muscleGroups,
    createdAt: now,
  }));

  // Create a map of exercise names to IDs for template references
  const exerciseIdMap = new Map<string, string>();
  seededExercises.forEach(exercise => {
    exerciseIdMap.set(exercise.name, exercise.id);
  });

  // Seed templates with exercise references
  const seededTemplates: Template[] = defaultTemplates.map(template => ({
    id: generateId(),
    name: template.name,
    exercises: template.exercises.map(te => ({
      exerciseId: exerciseIdMap.get(te.exerciseName) || generateId(),
      exerciseName: te.exerciseName,
      targetSets: te.targetSets,
      targetReps: te.targetReps,
      restSeconds: te.restSeconds,
      priority: te.priority,
      notes: te.notes,
    } as TemplateExercise)),
    createdAt: now,
    updatedAt: now,
  }));

  return {
    exercises: seededExercises,
    sessions: [],
    templates: seededTemplates,
    settings: defaultSettings,
  };
}

const initialState: AppState = getInitialState();

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
