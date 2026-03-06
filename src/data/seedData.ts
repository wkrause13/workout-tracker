// src/data/seedData.ts

// Seed data for default exercises and templates

export interface SeedExercise {
  name: string;
  category: 'compound' | 'accessory';
  muscleGroups: string[];
}

export interface SeedTemplateExercise {
  exerciseName: string;
  targetSets?: string;
  targetReps?: string;
  restSeconds?: number;
  priority: 'main' | 'support' | 'optional';
  notes?: string;
}

export interface SeedTemplate {
  name: string;
  exercises: SeedTemplateExercise[];
}

// Default exercises with common workout movements
export const defaultExercises: SeedExercise[] = [
  // Compound exercises
  { name: 'Back Squat', category: 'compound', muscleGroups: ['quads', 'glutes'] },
  { name: 'Barbell Bench Press', category: 'compound', muscleGroups: ['chest', 'shoulders', 'triceps'] },
  { name: 'Chest-Supported Row', category: 'compound', muscleGroups: ['back', 'biceps'] },
  { name: 'Romanian Deadlift', category: 'compound', muscleGroups: ['hamstrings', 'glutes'] },
  { name: 'Trap Bar Deadlift', category: 'compound', muscleGroups: ['back', 'glutes', 'hamstrings'] },
  { name: 'Overhead Press', category: 'compound', muscleGroups: ['shoulders', 'triceps'] },
  { name: 'Pull-ups', category: 'compound', muscleGroups: ['back', 'biceps'] },
  { name: 'Lat Pulldown', category: 'compound', muscleGroups: ['back', 'biceps'] },
  { name: 'Front Squat', category: 'compound', muscleGroups: ['quads', 'core'] },
  { name: 'Incline Bench Press', category: 'compound', muscleGroups: ['chest', 'shoulders'] },
  { name: 'Barbell Row', category: 'compound', muscleGroups: ['back', 'biceps'] },

  // Accessory exercises
  { name: 'Leg Curl', category: 'accessory', muscleGroups: ['hamstrings'] },
  { name: 'Split Squat', category: 'accessory', muscleGroups: ['quads', 'glutes'] },
  { name: 'Leg Press', category: 'accessory', muscleGroups: ['quads'] },
  { name: 'Ab Wheel', category: 'accessory', muscleGroups: ['core'] },
  { name: 'Dead Bug', category: 'accessory', muscleGroups: ['core'] },
  { name: 'Hip Thrust', category: 'accessory', muscleGroups: ['glutes'] },
];

// Default Program A
export const programA: SeedTemplate = {
  name: 'Program A',
  exercises: [
    { exerciseName: 'Back Squat', targetSets: '4-5', targetReps: '3-6', restSeconds: 180, priority: 'main' },
    { exerciseName: 'Barbell Bench Press', targetSets: '4-5', targetReps: '3-6', restSeconds: 180, priority: 'main' },
    { exerciseName: 'Chest-Supported Row', targetSets: '3-4', targetReps: '6-10', restSeconds: 90, priority: 'main' },
    { exerciseName: 'Romanian Deadlift', targetSets: '2-3', targetReps: '6-10', restSeconds: 90, priority: 'support' },
    { exerciseName: 'Leg Curl', targetSets: '2-3', targetReps: '10-15', restSeconds: 60, priority: 'optional' },
  ],
};

// Default Program B
export const programB: SeedTemplate = {
  name: 'Program B',
  exercises: [
    { exerciseName: 'Trap Bar Deadlift', targetSets: '3-5', targetReps: '3-6', restSeconds: 180, priority: 'main' },
    { exerciseName: 'Overhead Press', targetSets: '4', targetReps: '5-8', restSeconds: 180, priority: 'main' },
    { exerciseName: 'Pull-ups', targetSets: '4', targetReps: '6-10', restSeconds: 90, priority: 'main' },
    { exerciseName: 'Split Squat', targetSets: '2-3', targetReps: '8-12', restSeconds: 60, priority: 'support' },
    { exerciseName: 'Ab Wheel', targetSets: '2-3', targetReps: '-', restSeconds: 60, priority: 'support' },
  ],
};

// Default Program C
export const programC: SeedTemplate = {
  name: 'Program C',
  exercises: [
    { exerciseName: 'Front Squat', targetSets: '3-4', targetReps: '5-8', restSeconds: 180, priority: 'main' },
    { exerciseName: 'Incline Bench Press', targetSets: '3-4', targetReps: '6-10', restSeconds: 180, priority: 'main' },
    { exerciseName: 'Barbell Row', targetSets: '3-4', targetReps: '8-12', restSeconds: 90, priority: 'main' },
    { exerciseName: 'Hip Thrust', targetSets: '2-3', targetReps: '8-12', restSeconds: 60, priority: 'optional' },
  ],
};

// All default templates
export const defaultTemplates: SeedTemplate[] = [programA, programB, programC];
