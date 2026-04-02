import type { ImageSourcePropType } from 'react-native';

/** Emojis antigos gravados no Firestore → nível 1–5 */
const EMOJI_TO_LEVEL: Record<string, number> = {
  '😊': 1,
  '🙂': 2,
  '😐': 3,
  '😓': 4,
  '😰': 5,
};

/** Remove seletores de variante (ex.: 😐 vs 😐️) para bater com o mapa */
function normalizeEmojiKey(s: string): string {
  return s.replace(/\uFE0F/g, '').trim();
}

/** Converte valor vindo do Firestore / JSON em nível 1–5 ou null */
export function parseFeedbackLevelFromFirestore(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return null;
    const r = Math.round(raw);
    return r >= 1 && r <= 5 ? r : null;
  }
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return null;
    const n = parseFloat(t);
    if (Number.isFinite(n)) {
      const r = Math.round(n);
      return r >= 1 && r <= 5 ? r : null;
    }
    return null;
  }
  if (typeof raw === 'bigint') {
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    const r = Math.round(n);
    return r >= 1 && r <= 5 ? r : null;
  }
  return null;
}

function levelFromEmojiString(feedbackEmoji: string | null | undefined): number | null {
  if (!feedbackEmoji) return null;
  const key = normalizeEmojiKey(feedbackEmoji);
  if (EMOJI_TO_LEVEL[key]) return EMOJI_TO_LEVEL[key];
  const first = [...key][0];
  if (first && EMOJI_TO_LEVEL[first]) return EMOJI_TO_LEVEL[first];
  return null;
}

export const FEEDBACK_LABELS = ['Muito Fácil', 'Fácil', 'Normal', 'Difícil', 'Muito Difícil'] as const;

export const FEEDBACK_ICONS: ImageSourcePropType[] = [
  require('../../assets/images/FeedbackMuitoFacil.png'),
  require('../../assets/images/FeedbackFacil.png'),
  require('../../assets/images/FeedbackModerado.png'),
  require('../../assets/images/FeedbackDificil.png'),
  require('../../assets/images/FeedbackMuitoDificil.png'),
];

export function getFeedbackLevel(
  feedback: number | string | undefined | null,
  feedbackEmoji?: string | null
): number | null {
  const fromNumber = parseFeedbackLevelFromFirestore(feedback);
  if (fromNumber !== null) return fromNumber;
  return levelFromEmojiString(feedbackEmoji ?? null);
}

export function getFeedbackIconSource(
  feedback: number | string | undefined | null,
  feedbackEmoji?: string | null
): ImageSourcePropType | null {
  const level = getFeedbackLevel(feedback, feedbackEmoji);
  if (!level) return null;
  return FEEDBACK_ICONS[level - 1];
}

export function getFeedbackLabel(
  feedback: number | string | undefined | null,
  feedbackEmoji?: string | null
): string | null {
  const level = getFeedbackLevel(feedback, feedbackEmoji);
  if (!level) return null;
  return FEEDBACK_LABELS[level - 1];
}
