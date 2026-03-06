// src/utils/calculations.ts

import type { Set } from '../types';

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
