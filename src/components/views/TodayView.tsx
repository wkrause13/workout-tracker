// src/components/views/TodayView.tsx

import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { SessionExercise } from '../../types';
import { ExerciseCard } from '../session/ExerciseCard';
import { Button } from '../common/Button';
import styles from './TodayView.module.css';

export function TodayView() {
  const {
    exercises,
    addExercise,
    templates,
    getCurrentSession,
    startSession,
    updateSession,
  } = useApp();

  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');

  const currentSession = getCurrentSession();

  // No active session - show start workout UI
  if (!currentSession) {
    return (
      <div className={styles.container}>
        {showTemplatePicker ? (
          <div className={styles.templatePicker}>
            <h2 className={styles.title}>Choose a Template</h2>
            <div className={styles.templateList}>
              {templates.length === 0 ? (
                <p className={styles.emptyMessage}>No templates available</p>
              ) : (
                templates.map((template) => (
                  <Button
                    key={template.id}
                    variant="secondary"
                    className={styles.templateButton}
                    onClick={() => {
                      startSession(template.id);
                      setShowTemplatePicker(false);
                    }}
                  >
                    {template.name}
                  </Button>
                ))
              )}
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowTemplatePicker(false)}
              className={styles.cancelButton}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h2 className={styles.title}>Start a Workout</h2>
            <div className={styles.startButtons}>
              <Button
                variant="primary"
                onClick={() => startSession()}
                className={styles.startButton}
              >
                Freestyle
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowTemplatePicker(true)}
                className={styles.startButton}
                disabled={templates.length === 0}
              >
                From Template
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active session - show session UI
  const handleAddExercise = () => {
    if (!newExerciseName.trim() || !currentSession) return;

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
      notes: undefined,
    };

    updateSession({
      ...currentSession,
      exercises: [...currentSession.exercises, newExercise],
    });

    setNewExerciseName('');
    setShowAddExercise(false);
  };

  const handleUpdateExercise = (index: number, exercise: SessionExercise) => {
    const updatedExercises = [...currentSession.exercises];
    updatedExercises[index] = exercise;
    updateSession({ ...currentSession, exercises: updatedExercises });
  };

  const handleRemoveExercise = (index: number) => {
    const updatedExercises = currentSession.exercises.filter((_, i) => i !== index);
    updateSession({ ...currentSession, exercises: updatedExercises });
  };

  const sessionDate = new Date(currentSession.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={styles.container}>
      <div className={styles.sessionHeader}>
        <h2 className={styles.sessionTitle}>
          {currentSession.templateName || 'Freestyle Workout'}
        </h2>
        <p className={styles.sessionDate}>{sessionDate}</p>
      </div>

      <div className={styles.exercisesContainer}>
        {currentSession.exercises.length === 0 ? (
          <p className={styles.noExercises}>No exercises yet. Add one to get started!</p>
        ) : (
          currentSession.exercises.map((exercise, index) => (
            <ExerciseCard
              key={exercise.exerciseId}
              exercise={exercise}
              onUpdate={(updated) => handleUpdateExercise(index, updated)}
              onRemove={() => handleRemoveExercise(index)}
            />
          ))
        )}
      </div>

      {showAddExercise ? (
        <div className={styles.addExerciseModal}>
          <input
            type="text"
            className={styles.addExerciseInput}
            placeholder="Exercise name"
            value={newExerciseName}
            onChange={(e) => setNewExerciseName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddExercise();
              if (e.key === 'Escape') {
                setShowAddExercise(false);
                setNewExerciseName('');
              }
            }}
            autoFocus
          />
          <div className={styles.addExerciseButtons}>
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddExercise(false);
                setNewExerciseName('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddExercise}
              disabled={!newExerciseName.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          className={styles.addExerciseButton}
          onClick={() => setShowAddExercise(true)}
        >
          + Add Exercise
        </Button>
      )}
    </div>
  );
}
