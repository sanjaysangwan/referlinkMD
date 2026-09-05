/** Small practice marks stored as data URLs on `practices.logo`. */

export const MAX_LOGO_CHARS = 160_000;

const LOGO_PREFIX =
  /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml)(;charset=[^;,]+)?(;base64)?,/i;

export function isPracticeLogoDataUrl(value: string): boolean {
  return value.length > 0 && value.length <= MAX_LOGO_CHARS && LOGO_PREFIX.test(value);
}
