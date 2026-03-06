// src/components/session/ExerciseCard.tsx

import type { SessionExercise } from '../../types';
import {
  calculateSetVolume,
  calculateExerciseVolume,
  getTopWeight,
  getTotalReps,
} from '../../utils/calculations';
import styles from './ExerciseCard.module.css';

interface ExerciseCardProps {
  exercise: SessionExercise;
  onUpdate: (exercise: SessionExercise) => void;
  onRemove: () => void;
}

export function ExerciseCard({ exercise, onUpdate, onRemove }: ExerciseCardProps) {
  const handleSetChange = (setIndex: number, field: 'weight' | 'reps', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    const newSets = [...exercise.sets];
    newSets[setIndex] = { ...newSets[setIndex], [field]: numValue };
    onUpdate({ ...exercise, sets: newSets });
  };

  const handleNotesChange = (notes: string) => {
    onUpdate({ ...exercise, notes });
  };

  const isCompleted = exercise.sets.some(set => set.weight && set.reps);
  const totalVolume = calculateExerciseVolume(exercise.sets);
  const topWeight = getTopWeight(exercise.sets);
  const totalReps = getTotalReps(exercise.sets);

  return (
    <div className={`${styles.card} ${isCompleted ? styles.completed : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.exerciseName}>{exercise.exerciseName}</h3>
        <button
          className={styles.removeButton}
          onClick={onRemove}
          aria-label="Remove exercise"
        >
          ×
        </button>
      </div>

      <div className={styles.setsContainer}>
        {exercise.sets.map((set, index) => (
          <div key={index} className={styles.setRow}>
            <span className={styles.setNumber}>{index + 1}</span>
            <div className={styles.inputGroup}>
              <input
                type="number"
                className={`${styles.input} ${set.weight ? styles.filled : ''}`}
                placeholder="Wt"
                value={set.weight ?? ''}
                onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                min="0"
                step="2.5"
              />
            </div>
            <div className={styles.inputGroup}>
              <input
                type="number"
                className={`${styles.input} ${set.reps ? styles.filled : ''}`}
                placeholder="Reps"
                value={set.reps ?? ''}
                onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                min="0"
              />
            </div>
            <span className={styles.volume}>{calculateSetVolume(set)}</span>
          </div>
        ))}
      </div>

      {isCompleted && (
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Top Wt</span>
            <span className={styles.summaryValue}>{topWeight ?? '-'}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Reps</span>
            <span className={styles.summaryValue}>{totalReps}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Volume</span>
            <span className={styles.summaryValue}>{totalVolume}</span>
          </div>
        </div>
      )}

      <div className={styles.notesContainer}>
        <input
          type="text"
          className={styles.notesInput}
          placeholder="Notes..."
          value={exercise.notes ?? ''}
          onChange={(e) => handleNotesChange(e.target.value)}
        />
      </div>
    </div>
  );
}
