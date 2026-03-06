// src/components/views/ExerciseDetailView.tsx

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import {
  calculate1RM,
  calculateExerciseVolume,
  getTopWeight,
} from '../../utils/calculations';
import type { Session, SessionExercise, Set } from '../../types';
import styles from './ExerciseDetailView.module.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ExerciseDetailViewProps {
  exerciseId: string;
  exerciseName: string;
  onBack: () => void;
}

interface ExercisePR {
  type: 'oneRM' | 'volume' | 'repPR';
  label: string;
  value: string;
  date: string;
  details?: string;
}

interface SessionDataPoint {
  date: string;
  formattedDate: string;
  topWeight: number | null;
  volume: number;
  estimated1RM: number | null;
  sessionId: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// Get all sessions where this exercise was performed
function getExerciseSessions(sessions: Session[], exerciseId: string, exerciseName: string): Array<{ session: Session; exercise: SessionExercise }> {
  const results: Array<{ session: Session; exercise: SessionExercise }> = [];

  for (const session of sessions) {
    if (!session.completedAt) continue;

    const exercise = session.exercises.find(
      e => e.exerciseId === exerciseId || e.exerciseName === exerciseName
    );

    if (exercise && exercise.sets.length > 0) {
      results.push({ session, exercise });
    }
  }

  // Sort by date descending
  return results.sort((a, b) => new Date(b.session.date).getTime() - new Date(a.session.date).getTime());
}

// Calculate PRs for an exercise
function calculatePRs(exerciseSessions: Array<{ session: Session; exercise: SessionExercise }>): ExercisePR[] {
  const prs: ExercisePR[] = [];

  // Track best 1RM
  let best1RM = 0;
  let best1RMDate = '';
  let best1RMDetails = '';

  // Track best volume
  let bestVolume = 0;
  let bestVolumeDate = '';

  // Track rep PRs at various weights
  const repPRsByWeight = new Map<number, { reps: number; date: string }>();

  for (const { session, exercise } of exerciseSessions) {
    const sets = exercise.sets.filter(s => !s.isWarmup && s.weight && s.reps);

    // Calculate session volume
    const volume = calculateExerciseVolume(sets);
    if (volume > bestVolume) {
      bestVolume = volume;
      bestVolumeDate = session.date;
    }

    // Check each set for 1RM and rep PRs
    for (const set of sets) {
      if (!set.weight || !set.reps) continue;

      // Calculate estimated 1RM
      const estimated1RM = calculate1RM(set.weight, set.reps);
      if (estimated1RM && estimated1RM > best1RM) {
        best1RM = estimated1RM;
        best1RMDate = session.date;
        best1RMDetails = `${set.weight} x ${set.reps}`;
      }

      // Track rep PRs at specific weights
      const currentPR = repPRsByWeight.get(set.weight);
      if (!currentPR || set.reps > currentPR.reps) {
        repPRsByWeight.set(set.weight, { reps: set.reps, date: session.date });
      }
    }
  }

  // Add 1RM PR
  if (best1RM > 0) {
    prs.push({
      type: 'oneRM',
      label: 'Estimated 1RM',
      value: `${best1RM} lbs`,
      date: formatDate(best1RMDate),
      details: best1RMDetails ? `(${best1RMDetails})` : undefined,
    });
  }

  // Add Volume PR
  if (bestVolume > 0) {
    prs.push({
      type: 'volume',
      label: 'Session Volume',
      value: `${bestVolume.toLocaleString()} lbs`,
      date: formatDate(bestVolumeDate),
    });
  }

  // Add top rep PR (at highest weight with most reps)
  if (repPRsByWeight.size > 0) {
    const weights = Array.from(repPRsByWeight.keys()).sort((a, b) => b - a);
    if (weights.length > 0) {
      const topWeight = weights[0];
      const repPR = repPRsByWeight.get(topWeight)!;
      prs.push({
        type: 'repPR',
        label: 'Rep PR',
        value: `${repPR.reps} reps @ ${topWeight} lbs`,
        date: formatDate(repPR.date),
      });
    }
  }

  return prs;
}

// Generate chart data points
function generateChartDataPoints(
  exerciseSessions: Array<{ session: Session; exercise: SessionExercise }>
): SessionDataPoint[] {
  const dataPoints: SessionDataPoint[] = [];

  // Sort sessions by date ascending for the chart
  const sortedSessions = [...exerciseSessions].sort(
    (a, b) => new Date(a.session.date).getTime() - new Date(b.session.date).getTime()
  );

  for (const { session, exercise } of sortedSessions) {
    const nonWarmupSets = exercise.sets.filter(s => !s.isWarmup && s.weight && s.reps);
    if (nonWarmupSets.length === 0) continue;

    const topWeight = getTopWeight(nonWarmupSets);
    const volume = calculateExerciseVolume(nonWarmupSets);

    // Calculate best estimated 1RM from this session
    let bestEstimated1RM: number | null = null;
    for (const set of nonWarmupSets) {
      if (set.weight && set.reps) {
        const estimated = calculate1RM(set.weight, set.reps);
        if (estimated && (!bestEstimated1RM || estimated > bestEstimated1RM)) {
          bestEstimated1RM = estimated;
        }
      }
    }

    dataPoints.push({
      date: session.date,
      formattedDate: formatShortDate(session.date),
      topWeight,
      volume,
      estimated1RM: bestEstimated1RM,
      sessionId: session.id,
    });
  }

  return dataPoints;
}

function SetHistoryItem({ set, index }: { set: Set; index: number }) {
  if (!set.weight || !set.reps) return null;

  return (
    <div className={`${styles.setHistoryItem} ${set.isWarmup ? styles.warmup : ''}`}>
      <span className={styles.setNumber}>Set {index + 1}</span>
      <span className={styles.setWeight}>{set.weight} lbs</span>
      <span className={styles.setReps}>x {set.reps}</span>
      <span className={styles.setVolume}>{set.weight * set.reps} lbs</span>
    </div>
  );
}

function SessionHistoryCard({
  session,
  exercise,
}: {
  session: Session;
  exercise: SessionExercise;
}) {
  const topWeight = getTopWeight(exercise.sets);
  const volume = calculateExerciseVolume(exercise.sets);
  const nonWarmupSets = exercise.sets.filter(s => !s.isWarmup && s.weight && s.reps);

  return (
    <div className={styles.sessionHistoryCard}>
      <div className={styles.sessionHistoryHeader}>
        <span className={styles.sessionHistoryDate}>{formatDate(session.date)}</span>
        {session.templateName && (
          <span className={styles.sessionTemplate}>{session.templateName}</span>
        )}
      </div>

      {topWeight !== null && (
        <div className={styles.sessionSummary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Top Weight</span>
            <span className={styles.summaryValue}>{topWeight} lbs</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Volume</span>
            <span className={styles.summaryValue}>{volume.toLocaleString()} lbs</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Sets</span>
            <span className={styles.summaryValue}>{nonWarmupSets.length}</span>
          </div>
        </div>
      )}

      <div className={styles.setsHistory}>
        {exercise.sets.map((set, index) => (
          <SetHistoryItem key={index} set={set} index={index} />
        ))}
      </div>

      {exercise.notes && (
        <p className={styles.sessionNotes}>{exercise.notes}</p>
      )}
    </div>
  );
}

export function ExerciseDetailView({
  exerciseId,
  exerciseName,
  onBack,
}: ExerciseDetailViewProps) {
  const { sessions } = useApp();

  // Get all sessions with this exercise
  const exerciseSessions = useMemo(
    () => getExerciseSessions(sessions, exerciseId, exerciseName),
    [sessions, exerciseId, exerciseName]
  );

  // Calculate PRs
  const prs = useMemo(() => calculatePRs(exerciseSessions), [exerciseSessions]);

  // Generate chart data
  const chartDataPoints = useMemo(
    () => generateChartDataPoints(exerciseSessions),
    [exerciseSessions]
  );

  // Chart configuration
  const chartData = {
    labels: chartDataPoints.map(dp => dp.formattedDate),
    datasets: [
      {
        label: 'Top Weight (lbs)',
        data: chartDataPoints.map(dp => dp.topWeight),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: TooltipItem<'line'>) => `${context.parsed.y ?? 0} lbs`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: (value: number | string) => `${value} lbs`,
        },
        beginAtZero: false,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  // Empty state
  if (exerciseSessions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Button variant="ghost" onClick={onBack} className={styles.backButton}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4L6 10L12 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </Button>
          <h2 className={styles.title}>{exerciseName}</h2>
        </div>

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
                d="M28 40C28 42.2091 29.7909 44 32 44C34.2091 44 36 42.2091 36 40C36 37.7909 34.2091 36 32 36C29.7909 36 28 37.7909 28 40ZM32 20C30.895 20 30 20.895 30 22V30C30 31.105 30.895 32 32 32C33.105 32 34 31.105 34 30V22C34 20.895 33.105 20 32 20Z"
                fill="currentColor"
                opacity="0.5"
              />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>No History Yet</h3>
          <p className={styles.emptyMessage}>
            Complete workouts with this exercise to see your progress and personal records.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={onBack} className={styles.backButton}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4L6 10L12 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </Button>
        <h2 className={styles.title}>{exerciseName}</h2>
        <p className={styles.subtitle}>
          {exerciseSessions.length} session{exerciseSessions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Chart Section */}
      <div className={styles.chartSection}>
        <h3 className={styles.sectionTitle}>Weight Progress</h3>
        <div className={styles.chartContainer}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* PRs Section */}
      {prs.length > 0 && (
        <div className={styles.prsSection}>
          <h3 className={styles.sectionTitle}>Personal Records</h3>
          <div className={styles.prsGrid}>
            {prs.map((pr, index) => (
              <div key={index} className={styles.prCard}>
                <div className={styles.prIcon}>
                  {pr.type === 'oneRM' && (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                  {pr.type === 'volume' && (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 20H20M4 20V10L12 4L20 10V20H4Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <rect x="9" y="12" width="6" height="8" fill="currentColor" />
                    </svg>
                  )}
                  {pr.type === 'repPR' && (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M12 6V12L16 14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
                <div className={styles.prContent}>
                  <span className={styles.prLabel}>{pr.label}</span>
                  <span className={styles.prValue}>{pr.value}</span>
                  {pr.details && <span className={styles.prDetails}>{pr.details}</span>}
                  <span className={styles.prDate}>{pr.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session History Section */}
      <div className={styles.historySection}>
        <h3 className={styles.sectionTitle}>Session History</h3>
        <div className={styles.historyList}>
          {exerciseSessions.slice(0, 10).map(({ session, exercise }) => (
            <SessionHistoryCard
              key={session.id}
              session={session}
              exercise={exercise}
            />
          ))}
        </div>
        {exerciseSessions.length > 10 && (
          <p className={styles.moreHistory}>
            Showing 10 most recent sessions of {exerciseSessions.length} total
          </p>
        )}
      </div>
    </div>
  );
}
