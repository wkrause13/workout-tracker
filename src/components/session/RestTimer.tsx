// src/components/session/RestTimer.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './RestTimer.module.css';

interface RestTimerProps {
  duration: number; // in seconds
  exerciseName: string;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export function RestTimer({ duration, exerciseName, onComplete, onDismiss }: RestTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playCompleteSound = useCallback(() => {
    // Create a simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880; // A5 note
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
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            playCompleteSound();
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, playCompleteSound, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = () => {
    setIsRunning(!isRunning);
  };

  const handleAddTime = (seconds: number) => {
    setTimeRemaining((prev) => prev + seconds);
    if (isComplete) {
      setIsComplete(false);
      setIsRunning(true);
    }
  };

  const handleDismiss = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onDismiss?.();
  };

  const progress = ((duration - timeRemaining) / duration) * 100;

  return (
    <div className={`${styles.timer} ${isComplete ? styles.complete : ''}`}>
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
            <circle
              className={styles.progressBg}
              cx="50"
              cy="50"
              r="45"
            />
            <circle
              className={styles.progressBar}
              cx="50"
              cy="50"
              r="45"
              strokeDasharray={`${progress * 2.83} 283`}
            />
          </svg>
          <span className={styles.timeText}>{formatTime(timeRemaining)}</span>
        </div>
      </div>

      {isComplete ? (
        <div className={styles.completeMessage}>
          Rest complete! Get after it!
        </div>
      ) : (
        <div className={styles.timerControls}>
          <button className={styles.controlBtn} onClick={() => handleAddTime(-30)}>
            -30s
          </button>
          <button className={`${styles.controlBtn} ${styles.primary}`} onClick={handlePauseResume}>
            {isRunning ? 'Pause' : 'Resume'}
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
