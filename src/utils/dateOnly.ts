/**
 * Campo Firestore `date` em treinos atribuídos: "YYYY-MM-DD" (dia civil, sem fuso armazenado).
 * Evitar `new Date('YYYY-MM-DD')`: no motor JS é UTC 00:00 → no BRT vira dia anterior (~21h).
 * iOS (JSC/Hermes) segue esse comportamento; por isso o bug aparecia no iPhone e não no Android em alguns casos.
 */

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateOnlyLocal(ymd: string): Date {
  if (!ymd || typeof ymd !== 'string') return new Date(NaN);
  const m = YMD.exec(ymd.trim());
  if (!m) return new Date(ymd.trim());
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(y, mo - 1, d, 12, 0, 0, 0);
}

/** Hoje como YYYY-MM-DD no fuso do aparelho. */
export function getLocalTodayYmd(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatAssignedCalendarDatePtBr(ymd: string): string {
  return parseDateOnlyLocal(ymd).toLocaleDateString('pt-BR');
}

/** Exibição conforme idioma do app (`pt-BR` | `en`). */
export function formatAssignedCalendarDateByLocale(ymd: string, language: string): string {
  const loc = language === 'en' ? 'en-US' : 'pt-BR';
  return parseDateOnlyLocal(ymd).toLocaleDateString(loc);
}

/** Timestamp para ordenação: YYYY-MM-DD (calendário) ou ISO/instantâneo. */
export function parseFlexibleDateMs(value: string): number {
  if (!value || typeof value !== 'string') return NaN;
  const t = value.trim();
  const m = YMD.exec(t);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    return new Date(y, mo - 1, d, 12, 0, 0, 0).getTime();
  }
  return new Date(t).getTime();
}

export function weekdayLongPtBrFromYmd(ymd: string): string {
  return parseDateOnlyLocal(ymd).toLocaleDateString('pt-BR', { weekday: 'long' });
}

/** Dia da semana para persistência/acento: pt-BR no app PT, en-US long em EN (valor guardado no doc). */
export function weekdayLongFromYmdByLocale(ymd: string, language: string): string {
  const loc = language === 'en' ? 'en-US' : 'pt-BR';
  return parseDateOnlyLocal(ymd).toLocaleDateString(loc, { weekday: 'long' });
}

/** Para ordenação: timestamps completos primeiro; campo `date` só como dia local. */
export function assignedSortTimestamp(w: { date: string; completedDate?: string }): number {
  if (w.completedDate) return new Date(w.completedDate).getTime();
  return parseDateOnlyLocal(w.date).getTime();
}

/** YYYY-MM-DD no fuso local a partir de um instante ISO ou já YMD calendário. */
export function toLocalCalendarYmd(value: string): string {
  if (!value || typeof value !== 'string') return '';
  const t = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return t.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Chave estável para “semana DOM–SÁB”: string YYYY-MM-DD do domingo da semana civil local. */
export function weekBucketSundayLocalYmd(moment: Date): string {
  const localMid = new Date(moment.getFullYear(), moment.getMonth(), moment.getDate());
  localMid.setHours(0, 0, 0, 0);
  localMid.setDate(localMid.getDate() - localMid.getDay());
  return getLocalTodayYmd(localMid);
}
export function chartDayMonthPtBr(value: string): string {
  if (!value) return '';
  const t = String(value).trim();
  const base = /^(\d{4})-(\d{2})-(\d{2})$/.test(t) ? parseDateOnlyLocal(t) : new Date(t);
  return base.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function chartDayMonthByLocale(value: string, language: string): string {
  if (!value) return '';
  const t = String(value).trim();
  const base = /^(\d{4})-(\d{2})-(\d{2})$/.test(t) ? parseDateOnlyLocal(t) : new Date(t);
  const loc = language === 'en' ? 'en-US' : 'pt-BR';
  return base.toLocaleDateString(loc, { day: '2-digit', month: '2-digit' });
}

/** Formata datas flexíveis (YYYY-MM-DD ou ISO) para exibição pt-BR consistente. */
export function formatFlexibleDatePtBr(value: string): string {
  if (!value || typeof value !== 'string') return '';
  const t = value.trim();
  if (!t) return '';
  const base = /^(\d{4})-(\d{2})-(\d{2})$/.test(t) ? parseDateOnlyLocal(t) : new Date(t);
  if (Number.isNaN(base.getTime())) return t;
  return base.toLocaleDateString('pt-BR');
}

export function formatFlexibleDateByLocale(value: string, language: string): string {
  if (!value || typeof value !== 'string') return '';
  const t = value.trim();
  if (!t) return '';
  const base = /^(\d{4})-(\d{2})-(\d{2})$/.test(t) ? parseDateOnlyLocal(t) : new Date(t);
  if (Number.isNaN(base.getTime())) return t;
  const loc = language === 'en' ? 'en-US' : 'pt-BR';
  return base.toLocaleDateString(loc);
}
