// src/components/session/RestTimer.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './RestTimer.module.css';

interface RestTimerProps {
  timerId: string;
  duration: number; // in seconds
  exerciseName: string;
  startedAt: number;
  onComplete?: () => void;
  onDismiss?: () => void;
}

interface PersistedTimer {
  endsAt: number;
  isRunning: boolean;
  pausedRemaining: number | null;
}

interface TimerState extends PersistedTimer {
  timeRemaining: number;
  isComplete: boolean;
}

const storageKey = (timerId: string) => `rest-timer-${timerId}`;

const getRemainingFromEnd = (endsAt: number): number => {
  const remainingMs = endsAt - Date.now();
  return Math.max(Math.ceil(remainingMs / 1000), 0);
};

const clamp = (value: number): number => Math.max(Math.round(value), 0);

const initializeTimerState = (timerId: string, duration: number, startedAt: number): TimerState => {
  const fallbackEndsAt = startedAt + duration * 1000;
  const fallbackRemaining = getRemainingFromEnd(fallbackEndsAt);

  const fallbackState: TimerState = {
    endsAt: fallbackEndsAt,
    isRunning: fallbackRemaining > 0,
    pausedRemaining: null,
    timeRemaining: fallbackRemaining,
    isComplete: fallbackRemaining <= 0,
  };

  const saved = window.localStorage.getItem(storageKey(timerId));
  if (!saved) {
    window.localStorage.setItem(
      storageKey(timerId),
      JSON.stringify({ endsAt: fallbackState.endsAt, isRunning: fallbackState.isRunning, pausedRemaining: null } satisfies PersistedTimer)
    );
    return fallbackState;
  }

  try {
    const parsed = JSON.parse(saved) as PersistedTimer;
    if (parsed.isRunning) {
      const remaining = getRemainingFromEnd(parsed.endsAt);
      return {
        endsAt: parsed.endsAt,
        isRunning: remaining > 0,
        pausedRemaining: null,
        timeRemaining: remaining,
        isComplete: remaining <= 0,
      };
    }

    const paused = clamp(parsed.pausedRemaining ?? duration);
    return {
      endsAt: parsed.endsAt,
      isRunning: false,
      pausedRemaining: paused,
      timeRemaining: paused,
      isComplete: paused <= 0,
    };
  } catch {
    window.localStorage.removeItem(storageKey(timerId));
    return fallbackState;
  }
};

export function RestTimer({ timerId, duration, exerciseName, startedAt, onComplete, onDismiss }: RestTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>(() => initializeTimerState(timerId, duration, startedAt));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(timerState.isComplete);

  const playCompleteSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 200);
    } catch {
      // Audio not supported
    }
  }, []);

  useEffect(() => {
    if (!timerState.isRunning || timerState.isComplete) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimerState((prev) => {
        const remaining = getRemainingFromEnd(prev.endsAt);
        if (remaining <= 0) {
          return {
            ...prev,
            isRunning: false,
            pausedRemaining: null,
            timeRemaining: 0,
            isComplete: true,
          };
        }

        if (remaining === prev.timeRemaining) {
          return prev;
        }

        return {
          ...prev,
          timeRemaining: remaining,
        };
      });
    }, 250);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.isComplete]);

  useEffect(() => {
    if (timerState.isComplete) {
      window.localStorage.removeItem(storageKey(timerId));
      return;
    }

    window.localStorage.setItem(
      storageKey(timerId),
      JSON.stringify({
        endsAt: timerState.endsAt,
        isRunning: timerState.isRunning,
        pausedRemaining: timerState.isRunning ? null : timerState.timeRemaining,
      } satisfies PersistedTimer)
    );
  }, [timerId, timerState]);

  useEffect(() => {
    if (!timerState.isComplete || hasCompletedRef.current) {
      return;
    }

    hasCompletedRef.current = true;
    playCompleteSound();
    onComplete?.();
  }, [timerState.isComplete, playCompleteSound, onComplete]);

  const handlePauseResume = () => {
    if (timerState.isComplete) return;

    setTimerState((prev) => {
      if (prev.isRunning) {
        const remaining = getRemainingFromEnd(prev.endsAt);
        return {
          ...prev,
          isRunning: false,
          pausedRemaining: remaining,
          timeRemaining: remaining,
        };
      }

      const resumedEndsAt = Date.now() + prev.timeRemaining * 1000;
      return {
        ...prev,
        endsAt: resumedEndsAt,
        isRunning: true,
        pausedRemaining: null,
      };
    });
  };

  const handleAddTime = (seconds: number) => {
    setTimerState((prev) => {
      if (prev.isRunning) {
        const nextEndsAt = Math.max(Date.now(), prev.endsAt + seconds * 1000);
        const nextRemaining = getRemainingFromEnd(nextEndsAt);
        return {
          ...prev,
          endsAt: nextEndsAt,
          timeRemaining: nextRemaining,
          isRunning: nextRemaining > 0,
          pausedRemaining: null,
          isComplete: nextRemaining <= 0,
        };
      }

      const nextRemaining = clamp(prev.timeRemaining + seconds);
      return {
        ...prev,
        timeRemaining: nextRemaining,
        pausedRemaining: nextRemaining,
        isComplete: nextRemaining <= 0,
      };
    });
  };

  const handleDismiss = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    window.localStorage.removeItem(storageKey(timerId));
    onDismiss?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - timerState.timeRemaining) / duration) * 100;

  return (
    <div className={`${styles.timer} ${timerState.isComplete ? styles.complete : ''}`}>
      <div className={styles.timerHeader}>
        <span className={styles.label}>Rest Timer</span>
        <span className={styles.exercise}>{exerciseName}</span>
        <button className={styles.dismissBtn} onClick={handleDismiss} aria-label="Dismiss timer">
          ×
        </button>
      </div>

      <div className={styles.timerDisplay}>
        <div className={styles.progressRing} style={{ '--progress': `${progress}%` } as React.CSSProperties}>
          <svg viewBox="0 0 100 100">
            <circle className={styles.progressBg} cx="50" cy="50" r="45" />
            <circle className={styles.progressBar} cx="50" cy="50" r="45" strokeDasharray={`${progress * 2.83} 283`} />
          </svg>
          <span className={styles.timeText}>{formatTime(timerState.timeRemaining)}</span>
        </div>
      </div>

      {timerState.isComplete ? (
        <div className={styles.completeMessage}>Rest complete! Get after it!</div>
      ) : (
        <div className={styles.timerControls}>
          <button className={styles.controlBtn} onClick={() => handleAddTime(-30)}>
            -30s
          </button>
          <button className={`${styles.controlBtn} ${styles.primary}`} onClick={handlePauseResume}>
            {timerState.isRunning ? 'Pause' : 'Resume'}
          </button>
          <button className={styles.controlBtn} onClick={() => handleAddTime(30)}>
            +30s
          </button>
        </div>
      )}

      <div className={styles.quickAdd}>
        <button className={styles.quickBtn} onClick={() => handleAddTime(60)}>+1min</button>
        <button className={styles.quickBtn} onClick={() => handleAddTime(120)}>+2min</button>
        <button className={styles.quickBtn} onClick={() => handleAddTime(180)}>+3min</button>
      </div>
    </div>
  );
}
