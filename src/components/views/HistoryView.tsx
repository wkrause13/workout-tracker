// src/components/views/HistoryView.tsx

import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import {
  calculateExerciseVolume,
  getTopWeight,
  getTotalReps,
} from '../../utils/calculations';
import type { Session, SessionExercise, Set } from '../../types';
import styles from './HistoryView.module.css';

interface SessionCardProps {
  session: Session;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatSetDisplay(set: Set): string {
  if (set.isWarmup) {
    return `Warmup: ${set.weight || 0} x ${set.reps || 0}`;
  }
  return `${set.weight || 0} x ${set.reps || 0}`;
}

function calculateSessionVolume(session: Session): number {
  return session.exercises.reduce((total, exercise) => {
    return total + calculateExerciseVolume(exercise.sets);
  }, 0);
}

function calculateSessionTotalReps(session: Session): number {
  return session.exercises.reduce((total, exercise) => {
    return total + getTotalReps(exercise.sets);
  }, 0);
}

function SessionExerciseCard({ exercise }: { exercise: SessionExercise }) {
  const { viewExerciseDetail } = useApp();
  const topWeight = getTopWeight(exercise.sets);
  const totalReps = getTotalReps(exercise.sets);
  const volume = calculateExerciseVolume(exercise.sets);

  const handleExerciseClick = () => {
    viewExerciseDetail({
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
    });
  };

  return (
    <div className={styles.exerciseCard}>
      <div className={styles.exerciseHeader}>
        <button
          className={styles.exerciseNameButton}
          onClick={handleExerciseClick}
          aria-label={`View details for ${exercise.exerciseName}`}
        >
          <h4 className={styles.exerciseName}>{exercise.exerciseName}</h4>
        </button>
        {topWeight !== null && (
          <span className={styles.topWeight}>Top: {topWeight} lbs</span>
        )}
      </div>

      <div className={styles.setsList}>
        {exercise.sets.map((set, index) => (
          <div
            key={index}
            className={`${styles.setItem} ${set.isWarmup ? styles.warmupSet : ''}`}
          >
            <span className={styles.setNumber}>Set {index + 1}</span>
            <span className={styles.setDetails}>{formatSetDisplay(set)}</span>
          </div>
        ))}
      </div>

      <div className={styles.exerciseStats}>
        <span className={styles.stat}>
          <span className={styles.statLabel}>Volume</span>
          <span className={styles.statValue}>{volume.toLocaleString()} lbs</span>
        </span>
        <span className={styles.stat}>
          <span className={styles.statLabel}>Reps</span>
          <span className={styles.statValue}>{totalReps}</span>
        </span>
      </div>

      {exercise.notes && (
        <p className={styles.exerciseNotes}>{exercise.notes}</p>
      )}
    </div>
  );
}

function SessionCard({ session, isExpanded, onToggle, onDelete }: SessionCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const volume = calculateSessionVolume(session);
  const totalReps = calculateSessionTotalReps(session);
  const exerciseCount = session.exercises.length;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className={`${styles.sessionCard} ${isExpanded ? styles.expanded : ''}`}>
      <button
        className={styles.sessionCardHeader}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`session-details-${session.id}`}
      >
        <div className={styles.sessionMainInfo}>
          <span className={styles.sessionDate}>{formatShortDate(session.date)}</span>
          <h3 className={styles.sessionName}>
            {session.templateName || 'Freestyle'}
          </h3>
        </div>
        <div className={styles.sessionMeta}>
          <span className={styles.sessionStats}>
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
          </span>
          <span className={styles.sessionVolume}>
            {volume.toLocaleString()} lbs
          </span>
          <span className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ''}`}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </button>

      {isExpanded && (
        <div
          id={`session-details-${session.id}`}
          className={styles.sessionDetails}
        >
          <div className={styles.sessionFullDate}>
            {formatSessionDate(session.date)}
          </div>

          {session.exercises.length === 0 ? (
            <p className={styles.noExercises}>No exercises recorded</p>
          ) : (
            <div className={styles.exercisesList}>
              {session.exercises.map((exercise, index) => (
                <SessionExerciseCard key={index} exercise={exercise} />
              ))}
            </div>
          )}

          <div className={styles.sessionTotals}>
            <h4 className={styles.totalsTitle}>Session Totals</h4>
            <div className={styles.totalsGrid}>
              <div className={styles.totalItem}>
                <span className={styles.totalValue}>{volume.toLocaleString()}</span>
                <span className={styles.totalLabel}>Total Volume (lbs)</span>
              </div>
              <div className={styles.totalItem}>
                <span className={styles.totalValue}>{totalReps}</span>
                <span className={styles.totalLabel}>Total Reps</span>
              </div>
              <div className={styles.totalItem}>
                <span className={styles.totalValue}>{exerciseCount}</span>
                <span className={styles.totalLabel}>Exercises</span>
              </div>
            </div>
          </div>

          {session.notes && (
            <div className={styles.sessionNotes}>
              <h4 className={styles.notesTitle}>Notes</h4>
              <p>{session.notes}</p>
            </div>
          )}

          <div className={styles.sessionActions}>
            {showDeleteConfirm ? (
              <div className={styles.deleteConfirm}>
                <span className={styles.deleteConfirmText}>Delete this session?</span>
                <div className={styles.deleteConfirmButtons}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelDelete}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmDelete}
                    className={styles.deleteButton}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className={styles.deleteButton}
                aria-label={`Delete session from ${formatSessionDate(session.date)}`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 4H14M5.33333 4V2.66667C5.33333 2.31304 5.47381 1.9739 5.72386 1.72386C5.97391 1.47381 6.31304 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.9739 10.6667 2.31304 10.6667 2.66667V4M13.3333 4V13.3333C13.3333 13.687 13.1929 14.0261 12.9428 14.2761C12.6928 14.5262 12.3536 14.6667 12 14.6667H4C3.64638 14.6667 3.30724 14.5262 3.05719 14.2761C2.80714 14.0261 2.66667 13.687 2.66667 13.3333V4H13.3333Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Delete Session
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function HistoryView() {
  const { sessions, deleteSession } = useApp();
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Sort sessions by date (most recent first) and filter out incomplete sessions
  const sortedSessions = useMemo(() => {
    return [...sessions]
      .filter(session => session.completedAt)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions]);

  const handleToggleSession = (sessionId: string) => {
    setExpandedSessionId(prev =>
      prev === sessionId ? null : sessionId
    );
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
    }
  };

  if (sortedSessions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M32 8C18.745 8 8 18.745 8 32C8 45.255 18.745 56 32 56C45.255 56 56 45.255 56 32C56 18.745 45.255 8 32 8ZM32 52C20.954 52 12 43.046 12 32C12 20.954 20.954 12 32 12C43.046 12 52 20.954 52 32C52 43.046 43.046 52 32 52Z"
                fill="currentColor"
                opacity="0.3"
              />
              <path
                d="M32 20C30.895 20 30 20.895 30 22V34C30 35.105 30.895 36 32 36H42C43.105 36 44 35.105 44 34C44 32.895 43.105 32 42 32H34V22C34 20.895 33.105 20 32 20Z"
                fill="currentColor"
                opacity="0.5"
              />
            </svg>
          </div>
          <h2 className={styles.emptyTitle}>No Workout History</h2>
          <p className={styles.emptyMessage}>
            Complete a workout to see it here. Your session history will appear in this view.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Workout History</h2>
        <p className={styles.subtitle}>
          {sortedSessions.length} completed session{sortedSessions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className={styles.sessionList}>
        {sortedSessions.map(session => (
          <SessionCard
            key={session.id}
            session={session}
            isExpanded={expandedSessionId === session.id}
            onToggle={() => handleToggleSession(session.id)}
            onDelete={() => handleDeleteSession(session.id)}
          />
        ))}
      </div>
    </div>
  );
}
