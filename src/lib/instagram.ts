/**
 * Instagram constants, limits, and helpers.
 * Used across copywriter, designer, publisher, and approver panels.
 */

export const IG_LIMITS = {
  CAPTION_MAX: 2200,
  CAPTION_TRUNCATE: 125,
  MAX_HASHTAGS: 30,
  MAX_EMOJIS_SAFE: 30,
  MAX_CAROUSEL_SLIDES: 10,
  MIN_CAROUSEL_SLIDES: 2,
  MAX_FILE_SIZE_MB: 8,
  MAX_VIDEO_SIZE_MB: 4096,
  MAX_VIDEO_DURATION_S: 90,
} as const;

export const IG_FORMATS = {
  feed_1x1: { width: 1080, height: 1080, label: "Feed 1:1", ratio: "1:1" },
  feed_4x5: { width: 1080, height: 1350, label: "Feed 4:5", ratio: "4:5" },
  feed_1_91x1: { width: 1080, height: 566, label: "Feed 1.91:1", ratio: "1.91:1" },
  story: { width: 1080, height: 1920, label: "Story", ratio: "9:16" },
  reel: { width: 1080, height: 1920, label: "Reel", ratio: "9:16" },
  carousel: { width: 1080, height: 1080, label: "Carrossel", ratio: "1:1" },
} as const;

export type IGFormat = keyof typeof IG_FORMATS;

/** Safe zones for story/reel overlays (in px from edge at 1080 base) */
export const IG_SAFE_ZONES = {
  story: { top: 250, bottom: 350 },
  reel: { top: 210, bottom: 330 },
  feed_4x5_grid_crop: { top: 135, bottom: 135 },
} as const;

/**
 * Truncate caption at IG's "...ver mais" breakpoint.
 * Returns the truncated string plus whether it was truncated.
 */
export function truncateCaption(text: string, at = IG_LIMITS.CAPTION_TRUNCATE): { text: string; truncated: boolean } {
  if (text.length <= at) return { text, truncated: false };
  return { text: text.slice(0, at).trimEnd() + "...", truncated: true };
}

/**
 * Count visible characters (excludes invisible U+2800 breaks).
 */
export function countVisibleChars(text: string): number {
  return text.replace(/\u2800/g, "").length;
}

/**
 * Count emojis in text using Unicode emoji regex.
 */
export function countEmojis(text: string): number {
  const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
  return (text.match(emojiRegex) ?? []).length;
}

/**
 * Extract hashtags from text.
 */
export function extractHashtags(text: string): string[] {
  return (text.match(/#[\w\d_]+/g) ?? []);
}

/**
 * Insert invisible break (U+2800) for paragraph spacing.
 */
export function insertInvisibleBreak(text: string): string {
  return text.replace(/\n\n/g, "\n\u2800\n");
}
