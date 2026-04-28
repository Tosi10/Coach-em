export function minutesSecondsToSeconds(minutes: number | string, seconds: number | string = 0): number | undefined {
  const mins = Number(minutes) || 0;
  const secs = Number(seconds) || 0;
  const total = Math.max(0, mins * 60 + secs);
  return total > 0 ? total : undefined;
}

export function splitSeconds(totalSeconds?: number): { minutes: string; seconds: string } {
  const total = Math.max(0, Number(totalSeconds) || 0);
  return {
    minutes: total > 0 ? String(Math.floor(total / 60)) : '',
    seconds: total > 0 && total % 60 > 0 ? String(total % 60) : '',
  };
}

export function formatDuration(totalSeconds?: number): string {
  const total = Math.max(0, Number(totalSeconds) || 0);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins <= 0) return `${secs}s`;
  if (secs === 0) return `${mins}min`;
  return `${mins}min ${secs}s`;
}

export function formatClock(totalSeconds?: number): string {
  const total = Math.max(0, Number(totalSeconds) || 0);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
