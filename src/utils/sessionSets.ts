import type { SessionExercise, Set } from '../types';

export const hasSetData = (set: Set): boolean => set.weight !== null && set.reps !== null;

export const getCompletedSetCount = (exercise: SessionExercise): number => (
  exercise.sets.filter(hasSetData).length
);

export const getCompletedSets = (exercise: SessionExercise): Set[] => (
  exercise.sets.filter(hasSetData)
);
