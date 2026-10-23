import { useState, useEffect, useRef, useCallback } from 'react';
import { SoundAlertSettings } from '../types';
import { playChime, ChimeType } from '../utils/soundSynthesizer';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'overtime';

interface UseSpeechTimerProps {
  initialSeconds: number;
  soundSettings: SoundAlertSettings;
  onTimeExpired?: () => void;
  onStateChange?: (status: TimerStatus) => void;
}

export function useSpeechTimer({
  initialSeconds,
  soundSettings,
  onTimeExpired,
  onStateChange,
}: UseSpeechTimerProps) {
  const safeInitial =
    typeof initialSeconds === 'number' && Number.isFinite(initialSeconds) && initialSeconds > 0
      ? Math.round(initialSeconds)
      : 420;

  const [targetSeconds, setTargetSecondsState] = useState<number>(safeInitial);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(safeInitial);
  const [overtimeSeconds, setOvertimeSeconds] = useState<number>(0);
  const [status, setStatus] = useState<TimerStatus>('idle');

  // Tracking triggered milestones so each bell plays strictly once per rehearsal
  const triggeredAlertsRef = useRef<{
    halfway: boolean;
    oneMinute: boolean;
    thirtySeconds: boolean;
    timeExpired: boolean;
    lastOvertimeMark: number;
  }>({
    halfway: false,
    oneMinute: false,
    thirtySeconds: false,
    timeExpired: false,
    lastOvertimeMark: 0,
  });

  const soundSettingsRef = useRef(soundSettings);
  soundSettingsRef.current = soundSettings;

  const onTimeExpiredRef = useRef(onTimeExpired);
  onTimeExpiredRef.current = onTimeExpired;

  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  // Accurate drift compensation timing via performance.now
  const lastTickTimeRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const resetAlerts = useCallback(() => {
    triggeredAlertsRef.current = {
      halfway: false,
      oneMinute: false,
      thirtySeconds: false,
      timeExpired: false,
      lastOvertimeMark: 0,
    };
  }, []);

  const triggerSoundIfAllowed = useCallback((type: ChimeType) => {
    if (!soundSettingsRef.current.enabled) return;
    playChime(type, soundSettingsRef.current.volume);
  }, []);

  // Main high-precision tick loop
  const tick = useCallback((timestamp: number) => {
    if (lastTickTimeRef.current === null) {
      lastTickTimeRef.current = timestamp;
    }

    const delta = timestamp - lastTickTimeRef.current;
    lastTickTimeRef.current = timestamp;
    if (Number.isFinite(delta) && delta > 0) {
      accumulatedMsRef.current += delta;
    }

    // Advance by full seconds when accumulated >= 1000ms
    if (accumulatedMsRef.current >= 1000) {
      const secondsToAdvance = Math.floor(accumulatedMsRef.current / 1000);
      accumulatedMsRef.current %= 1000;

      setRemainingSeconds((prevRem) => {
        const safePrevRem =
          typeof prevRem === 'number' && Number.isFinite(prevRem) ? prevRem : safeInitial;
        const currentTarget =
          typeof targetSeconds === 'number' && Number.isFinite(targetSeconds) && targetSeconds > 0
            ? targetSeconds
            : safeInitial;

        const nextRem = safePrevRem - secondsToAdvance;
        const halfwayThreshold = Math.floor(currentTarget / 2);

        // Check alerts
        const alerts = triggeredAlertsRef.current;
        const cfg = soundSettingsRef.current;

        // Halfway alert (only if speech >= 60 seconds)
        if (
          currentTarget >= 60 &&
          !alerts.halfway &&
          nextRem <= halfwayThreshold &&
          nextRem > 0
        ) {
          alerts.halfway = true;
          if (cfg.halfwayAlert) triggerSoundIfAllowed('halfway');
        }

        // 1 Minute remaining alert (only if total target > 90 seconds)
        if (
          currentTarget > 90 &&
          !alerts.oneMinute &&
          nextRem <= 60 &&
          nextRem > 30
        ) {
          alerts.oneMinute = true;
          if (cfg.oneMinuteAlert) triggerSoundIfAllowed('oneMinute');
        }

        // 30 Seconds alert (only if total target > 45 seconds)
        if (
          currentTarget > 45 &&
          !alerts.thirtySeconds &&
          nextRem <= 30 &&
          nextRem > 0
        ) {
          alerts.thirtySeconds = true;
          if (cfg.thirtySecondsAlert) triggerSoundIfAllowed('thirtySeconds');
        }

        if (nextRem <= 0) {
          // Time expired transition to overtime
          if (!alerts.timeExpired) {
            alerts.timeExpired = true;
            if (cfg.timeExpiredAlert) triggerSoundIfAllowed('timeExpired');
            if (onTimeExpiredRef.current) onTimeExpiredRef.current();
          }

          setStatus('overtime');
          setOvertimeSeconds((prevOver) => {
            const baseOver = safePrevRem > 0 ? Math.abs(nextRem) : (Number.isFinite(prevOver) ? prevOver : 0) + secondsToAdvance;
            if (cfg.overtimeBeeper && baseOver > 0 && baseOver % 30 === 0 && alerts.lastOvertimeMark !== baseOver) {
              alerts.lastOvertimeMark = baseOver;
              triggerSoundIfAllowed('overtimeWarning');
            }
            return baseOver;
          });

          return 0;
        }

        return nextRem;
      });
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [targetSeconds, safeInitial, triggerSoundIfAllowed]);

  useEffect(() => {
    if (status === 'running' || status === 'overtime') {
      lastTickTimeRef.current = null;
      animationFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTickTimeRef.current = null;
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [status, tick]);

  const startTimer = useCallback(() => {
    if (status === 'idle') {
      triggerSoundIfAllowed('start');
    }
    setStatus((prev) => (prev === 'overtime' ? 'overtime' : 'running'));
    if (onStateChangeRef.current) {
      onStateChangeRef.current(status === 'overtime' ? 'overtime' : 'running');
    }
  }, [status, triggerSoundIfAllowed]);

  const pauseTimer = useCallback(() => {
    setStatus('paused');
    if (onStateChangeRef.current) {
      onStateChangeRef.current('paused');
    }
  }, []);

  const toggleTimer = useCallback(() => {
    if (status === 'running' || status === 'overtime') {
      pauseTimer();
    } else {
      startTimer();
    }
  }, [status, pauseTimer, startTimer]);

  const resetTimer = useCallback(
    (newTarget?: number) => {
      // Guard against React MouseEvent being passed when wired directly to onClick={onResetTimer}
      const isValidNumber =
        typeof newTarget === 'number' && Number.isFinite(newTarget) && newTarget > 0;
      const safeCurrentTarget =
        typeof targetSeconds === 'number' && Number.isFinite(targetSeconds) && targetSeconds > 0
          ? targetSeconds
          : safeInitial;
      const t = isValidNumber ? Math.round(newTarget) : safeCurrentTarget;

      if (isValidNumber) {
        setTargetSecondsState(t);
      } else if (!Number.isFinite(targetSeconds) || targetSeconds <= 0) {
        setTargetSecondsState(safeInitial);
      }
      setRemainingSeconds(t);
      setOvertimeSeconds(0);
      setStatus('idle');
      accumulatedMsRef.current = 0;
      resetAlerts();
      if (onStateChangeRef.current) {
        onStateChangeRef.current('idle');
      }
    },
    [targetSeconds, safeInitial, resetAlerts]
  );

  const addSeconds = useCallback(
    (delta: number) => {
      const safeDelta = typeof delta === 'number' && Number.isFinite(delta) ? Math.round(delta) : 0;
      setRemainingSeconds((prev) => {
        const base = typeof prev === 'number' && Number.isFinite(prev) ? prev : safeInitial;
        return Math.max(10, base + safeDelta);
      });
      setTargetSecondsState((prev) => {
        const base = typeof prev === 'number' && Number.isFinite(prev) ? prev : safeInitial;
        return Math.max(10, base + safeDelta);
      });
    },
    [safeInitial]
  );

  const setTargetSeconds = useCallback(
    (seconds: number) => {
      const safeSec =
        typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0
          ? Math.round(seconds)
          : safeInitial;
      const valid = Math.max(10, safeSec);
      setTargetSecondsState(valid);
      setRemainingSeconds(valid);
      setOvertimeSeconds(0);
      setStatus('idle');
      accumulatedMsRef.current = 0;
      resetAlerts();
    },
    [safeInitial, resetAlerts]
  );

  const safeTargetSec =
    typeof targetSeconds === 'number' && Number.isFinite(targetSeconds) && targetSeconds > 0
      ? targetSeconds
      : safeInitial;
  const safeRemainingSec =
    typeof remainingSeconds === 'number' && Number.isFinite(remainingSeconds) && remainingSeconds >= 0
      ? remainingSeconds
      : safeTargetSec;
  const safeOvertimeSec =
    typeof overtimeSeconds === 'number' && Number.isFinite(overtimeSeconds) && overtimeSeconds >= 0
      ? overtimeSeconds
      : 0;

  // Total elapsed time in current rehearsal
  const elapsedSeconds =
    status === 'overtime'
      ? safeTargetSec + safeOvertimeSec
      : Math.max(0, safeTargetSec - safeRemainingSec);

  // Percentage complete (0 to 100)
  const rawPercent = ((safeTargetSec - safeRemainingSec) / safeTargetSec) * 100;
  const progressPercent = Number.isFinite(rawPercent)
    ? Math.min(100, Math.max(0, rawPercent))
    : 0;

  return {
    targetSeconds: safeTargetSec,
    remainingSeconds: safeRemainingSec,
    overtimeSeconds: safeOvertimeSec,
    elapsedSeconds,
    status,
    progressPercent,
    startTimer,
    pauseTimer,
    toggleTimer,
    resetTimer,
    addSeconds,
    setTargetSeconds,
  };
}

export function formatSecondsToDigital(totalSeconds: number): {
  minutes: string;
  seconds: string;
  isNegative: boolean;
} {
  const safeTotal =
    typeof totalSeconds === 'number' && Number.isFinite(totalSeconds) ? totalSeconds : 0;
  const isNegative = safeTotal < 0;
  const absSec = Math.abs(Math.round(safeTotal));
  const m = Math.floor(absSec / 60);
  const s = absSec % 60;

  return {
    minutes: String(m).padStart(2, '0'),
    seconds: String(s).padStart(2, '0'),
    isNegative,
  };
}

export function formatHumanTime(totalSec: number): string {
  const safeSec =
    typeof totalSec === 'number' && Number.isFinite(totalSec) && totalSec >= 0
      ? Math.round(totalSec)
      : 0;
  const m = Math.floor(safeSec / 60);
  const s = safeSec % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m} min`;
  return `${m}m ${s}s`;
}
