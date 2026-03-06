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
  { name: 'Squat', category: 'compound', muscleGroups: ['quads', 'glutes', 'hamstrings'] },
  { name: 'Bench Press', category: 'compound', muscleGroups: ['chest', 'shoulders', 'triceps'] },
  { name: 'Deadlift', category: 'compound', muscleGroups: ['back', 'glutes', 'hamstrings'] },
  { name: 'Overhead Press', category: 'compound', muscleGroups: ['shoulders', 'triceps'] },
  { name: 'Barbell Row', category: 'compound', muscleGroups: ['back', 'biceps'] },
  { name: 'Pull-up', category: 'compound', muscleGroups: ['back', 'biceps'] },
  { name: 'Dip', category: 'compound', muscleGroups: ['chest', 'triceps'] },
  { name: 'Incline Bench Press', category: 'compound', muscleGroups: ['chest', 'shoulders', 'triceps'] },
  { name: 'Front Squat', category: 'compound', muscleGroups: ['quads', 'glutes'] },
  { name: 'Romanian Deadlift', category: 'compound', muscleGroups: ['hamstrings', 'glutes', 'back'] },

  // Accessory exercises
  { name: 'Bicep Curl', category: 'accessory', muscleGroups: ['biceps'] },
  { name: 'Tricep Extension', category: 'accessory', muscleGroups: ['triceps'] },
  { name: 'Lateral Raise', category: 'accessory', muscleGroups: ['shoulders'] },
  { name: 'Face Pull', category: 'accessory', muscleGroups: ['rear delts', 'traps'] },
  { name: 'Leg Curl', category: 'accessory', muscleGroups: ['hamstrings'] },
  { name: 'Leg Extension', category: 'accessory', muscleGroups: ['quads'] },
  { name: 'Calf Raise', category: 'accessory', muscleGroups: ['calves'] },
  { name: 'Lat Pulldown', category: 'accessory', muscleGroups: ['back', 'biceps'] },
  { name: 'Cable Row', category: 'accessory', muscleGroups: ['back', 'biceps'] },
  { name: 'Chest Fly', category: 'accessory', muscleGroups: ['chest'] },
  { name: 'Hammer Curl', category: 'accessory', muscleGroups: ['biceps', 'forearms'] },
  { name: 'Skull Crusher', category: 'accessory', muscleGroups: ['triceps'] },
  { name: 'Shrug', category: 'accessory', muscleGroups: ['traps'] },
  { name: 'Hanging Leg Raise', category: 'accessory', muscleGroups: ['abs'] },
  { name: 'Plank', category: 'accessory', muscleGroups: ['abs', 'core'] },
];

// Default Program A: Push (Chest, Shoulders, Triceps)
export const programA: SeedTemplate = {
  name: 'Program A - Push',
  exercises: [
    { exerciseName: 'Bench Press', targetSets: '3', targetReps: '5', restSeconds: 180, priority: 'main' },
    { exerciseName: 'Overhead Press', targetSets: '3', targetReps: '8', restSeconds: 120, priority: 'support' },
    { exerciseName: 'Incline Bench Press', targetSets: '3', targetReps: '8', restSeconds: 90, priority: 'support' },
    { exerciseName: 'Tricep Extension', targetSets: '3', targetReps: '12', restSeconds: 60, priority: 'optional' },
    { exerciseName: 'Lateral Raise', targetSets: '3', targetReps: '12', restSeconds: 60, priority: 'optional' },
    { exerciseName: 'Face Pull', targetSets: '3', targetReps: '15', restSeconds: 60, priority: 'optional' },
  ],
};

// Default Program B: Pull (Back, Biceps)
export const programB: SeedTemplate = {
  name: 'Program B - Pull',
  exercises: [
    { exerciseName: 'Deadlift', targetSets: '1', targetReps: '5', restSeconds: 180, priority: 'main' },
    { exerciseName: 'Barbell Row', targetSets: '3', targetReps: '5', restSeconds: 120, priority: 'support' },
    { exerciseName: 'Pull-up', targetSets: '3', targetReps: '8', restSeconds: 90, priority: 'support' },
    { exerciseName: 'Face Pull', targetSets: '3', targetReps: '15', restSeconds: 60, priority: 'optional' },
    { exerciseName: 'Bicep Curl', targetSets: '3', targetReps: '12', restSeconds: 60, priority: 'optional' },
    { exerciseName: 'Hammer Curl', targetSets: '3', targetReps: '12', restSeconds: 60, priority: 'optional' },
  ],
};

// Default Program C: Legs
export const programC: SeedTemplate = {
  name: 'Program C - Legs',
  exercises: [
    { exerciseName: 'Squat', targetSets: '3', targetReps: '5', restSeconds: 180, priority: 'main' },
    { exerciseName: 'Romanian Deadlift', targetSets: '3', targetReps: '8', restSeconds: 120, priority: 'support' },
    { exerciseName: 'Leg Curl', targetSets: '3', targetReps: '12', restSeconds: 60, priority: 'optional' },
    { exerciseName: 'Leg Extension', targetSets: '3', targetReps: '12', restSeconds: 60, priority: 'optional' },
    { exerciseName: 'Calf Raise', targetSets: '5', targetReps: '10', restSeconds: 60, priority: 'optional' },
    { exerciseName: 'Hanging Leg Raise', targetSets: '3', targetReps: '12', restSeconds: 60, priority: 'optional' },
  ],
};

// All default templates
export const defaultTemplates: SeedTemplate[] = [programA, programB, programC];
