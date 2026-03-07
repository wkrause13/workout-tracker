// src/components/views/TodayView.tsx

import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { SessionExercise, Exercise } from '../../types';
import { ExerciseCard } from '../session/ExerciseCard';
import { RestTimer } from '../session/RestTimer';
import { Button } from '../common/Button';
import styles from './TodayView.module.css';

interface ActiveTimer {
  exerciseName: string;
  exerciseId: string;
  duration: number;
}

export function TodayView() {
  const {
    exercises,
    addExercise,
    sessions,
    templates,
    getCurrentSession,
    startSession,
    updateSession,
    completeSession,
    deleteSession,
    settings,
  } = useApp();

  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const currentSession = getCurrentSession();

  // Get the last completed sets for an exercise, or default to 4 empty sets
  const getLastCompletedSets = (exerciseId: string) => {
    const completedSessions = sessions
      .filter(s => s.completedAt)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const session of completedSessions) {
      const exercise = session.exercises.find(e => e.exerciseId === exerciseId);
      if (exercise && exercise.sets.some(s => s.weight && s.reps)) {
        // Return sets with values, filtering out empty trailing sets
        const filledSets = exercise.sets.filter(s => s.weight && s.reps);
        return filledSets;
      }
    }
    // Default to 4 empty sets if no history
    return [
      { weight: null, reps: null },
      { weight: null, reps: null },
      { weight: null, reps: null },
      { weight: null, reps: null },
    ];
  };

  // Filter and group exercises for the picker
  const filteredExercises = useMemo(() => {
    if (!exerciseSearch.trim()) return exercises;
    const search = exerciseSearch.toLowerCase();
    return exercises.filter(e =>
      e.name.toLowerCase().includes(search) ||
      e.muscleGroups.some(mg => mg.toLowerCase().includes(search))
    );
  }, [exercises, exerciseSearch]);

  const exercisesByCategory = useMemo(() => {
    const compound = filteredExercises.filter(e => e.category === 'compound');
    const accessory = filteredExercises.filter(e => e.category === 'accessory');
    return { compound, accessory };
  }, [filteredExercises]);

  // Check if an exercise is already in the session
  const exerciseInSession = (exerciseId: string) => {
    return currentSession?.exercises.some(e => e.exerciseId === exerciseId) ?? false;
  };

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
  const handleSelectExercise = (exercise: Exercise) => {
    if (!currentSession || exerciseInSession(exercise.id)) return;

    // Get previous sets for this exercise (defaults to 4 empty sets)
    const sets = getLastCompletedSets(exercise.id);

    const newExercise: SessionExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets,
      notes: undefined,
    };

    updateSession({
      ...currentSession,
      exercises: [...currentSession.exercises, newExercise],
    });

    setExerciseSearch('');
    setShowAddExercise(false);
  };

  const handleAddCustomExercise = () => {
    if (!exerciseSearch.trim() || !currentSession) return;

    const existingExercise = exercises.find(
      e => e.name.toLowerCase() === exerciseSearch.trim().toLowerCase()
    );

    let exerciseId: string;
    let sets: { weight: number | null; reps: number | null }[];

    if (existingExercise) {
      exerciseId = existingExercise.id;
      sets = getLastCompletedSets(existingExercise.id);
    } else {
      exerciseId = addExercise({
        name: exerciseSearch.trim(),
        category: 'accessory',
        muscleGroups: [],
      });
      // New exercise - default to 4 empty sets
      sets = [
        { weight: null, reps: null },
        { weight: null, reps: null },
        { weight: null, reps: null },
        { weight: null, reps: null },
      ];
    }

    const newExercise: SessionExercise = {
      exerciseId,
      exerciseName: exerciseSearch.trim(),
      sets,
      notes: undefined,
    };

    updateSession({
      ...currentSession,
      exercises: [...currentSession.exercises, newExercise],
    });

    setExerciseSearch('');
    setShowAddExercise(false);
  };

  const handleUpdateExercise = (index: number, updatedExercise: SessionExercise) => {
    // Get the previous exercise state before updating
    const prevExercise = currentSession.exercises[index];

    // Count filled sets before and after
    const prevFilledCount = prevExercise.sets.filter(s => s.weight && s.reps).length;
    const newFilledCount = updatedExercise.sets.filter(s => s.weight && s.reps).length;

    // Update the session
    const updatedExercises = [...currentSession.exercises];
    updatedExercises[index] = updatedExercise;
    updateSession({ ...currentSession, exercises: updatedExercises });

    // If a new set was completed, start the rest timer
    if (newFilledCount > prevFilledCount) {
      const exerciseData = exercises.find(e => e.id === updatedExercise.exerciseId);
      const isCompound = exerciseData?.category === 'compound';
      const duration = isCompound ? settings.compoundRestSeconds : settings.assistanceRestSeconds;

      setActiveTimer({
        exerciseName: updatedExercise.exerciseName,
        exerciseId: updatedExercise.exerciseId,
        duration,
      });
    }
  };

  const handleRemoveExercise = (index: number) => {
    const updatedExercises = currentSession.exercises.filter((_, i) => i !== index);
    updateSession({ ...currentSession, exercises: updatedExercises });
  };

  const handleStartTimer = () => {
    setActiveTimer({
      exerciseName: 'Manual Timer',
      exerciseId: '',
      duration: settings.compoundRestSeconds,
    });
  };

  const handleFinishWorkout = () => {
    completeSession(currentSession.id);
  };

  const handleCancelWorkout = () => {
    deleteSession(currentSession.id);
    setShowCancelConfirm(false);
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
        <button className={styles.timerButton} onClick={handleStartTimer}>
          Start Timer
        </button>
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

      {/* Rest Timer */}
      {activeTimer && (
        <RestTimer
          duration={activeTimer.duration}
          exerciseName={activeTimer.exerciseName}
          onDismiss={() => setActiveTimer(null)}
        />
      )}

      {showAddExercise ? (
        <div className={styles.addExerciseModal}>
          <input
            type="text"
            className={styles.addExerciseInput}
            placeholder="Search exercises..."
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
            autoFocus
          />

          <div className={styles.exercisePickerList}>
            {exercisesByCategory.compound.length > 0 && (
              <div className={styles.exerciseGroup}>
                <h4 className={styles.exerciseGroupLabel}>Compound</h4>
                {exercisesByCategory.compound.map(exercise => (
                  <button
                    key={exercise.id}
                    className={`${styles.exerciseOption} ${exerciseInSession(exercise.id) ? styles.disabled : ''}`}
                    onClick={() => handleSelectExercise(exercise)}
                    disabled={exerciseInSession(exercise.id)}
                  >
                    <span className={styles.exerciseOptionName}>{exercise.name}</span>
                    <span className={styles.exerciseOptionMuscles}>
                      {exercise.muscleGroups.join(', ')}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {exercisesByCategory.accessory.length > 0 && (
              <div className={styles.exerciseGroup}>
                <h4 className={styles.exerciseGroupLabel}>Accessory</h4>
                {exercisesByCategory.accessory.map(exercise => (
                  <button
                    key={exercise.id}
                    className={`${styles.exerciseOption} ${exerciseInSession(exercise.id) ? styles.disabled : ''}`}
                    onClick={() => handleSelectExercise(exercise)}
                    disabled={exerciseInSession(exercise.id)}
                  >
                    <span className={styles.exerciseOptionName}>{exercise.name}</span>
                    <span className={styles.exerciseOptionMuscles}>
                      {exercise.muscleGroups.join(', ')}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {filteredExercises.length === 0 && exerciseSearch.trim() && (
              <div className={styles.noResults}>
                <p>No exercises found</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddCustomExercise}
                >
                  Create &quot;{exerciseSearch.trim()}&quot;
                </Button>
              </div>
            )}
          </div>

          <div className={styles.addExerciseButtons}>
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddExercise(false);
                setExerciseSearch('');
              }}
            >
              Done
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

      {/* Session Actions */}
      <div className={styles.sessionActions}>
        <Button
          variant="primary"
          className={styles.finishButton}
          onClick={handleFinishWorkout}
        >
          Finish Workout
        </Button>

        {showCancelConfirm ? (
          <div className={styles.cancelConfirm}>
            <span className={styles.cancelConfirmText}>Discard this workout?</span>
            <div className={styles.cancelConfirmButtons}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep Going
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCancelWorkout}
                className={styles.discardButton}
              >
                Discard
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className={styles.cancelWorkoutButton}
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancel Workout
          </Button>
        )}
      </div>
    </div>
  );
}
