/** Client helpers for Movie Wrapped periods and auto-prompt */

export function getWrappedStorageKey(storageKey) {
  return `wrapped_seen_${storageKey}`;
}

export function hasSeenWrapped(storageKey) {
  return localStorage.getItem(getWrappedStorageKey(storageKey)) === "1";
}

export function markWrappedSeen(storageKey) {
  localStorage.setItem(getWrappedStorageKey(storageKey), "1");
}

export function isPeriodEndMoment(date = new Date()) {
  const day = date.getDay();
  const dom = date.getDate();
  const month = date.getMonth();
  const lastDay = new Date(date.getFullYear(), month + 1, 0).getDate();

  return {
    isEndOfWeek: day === 0,
    isEndOfMonth: dom === lastDay,
    isEndOfYear: month === 11 && dom === 31,
  };
}

/** Suggest a wrap period near period boundaries (end day + 2-day grace) */
export function shouldUsePreviousAnchor(period, date = new Date()) {
  const grace = 2;
  const dom = date.getDate();
  const month = date.getMonth();
  const day = date.getDay();

  if (period === "year" && month === 0 && dom <= grace) return true;
  if (period === "month" && dom <= grace) return true;
  if (period === "week" && day >= 1 && day <= grace) return true;
  return false;
}

export function getAutoWrapPeriod(date = new Date()) {
  const { isEndOfWeek, isEndOfMonth, isEndOfYear } = isPeriodEndMoment(date);
  const grace = 2;
  const dom = date.getDate();
  const month = date.getMonth();
  const day = date.getDay();
  const y = date.getFullYear();
  const lastDay = new Date(y, month + 1, 0).getDate();

  const yearGrace =
    (month === 11 && dom === 31) ||
    (month === 0 && dom >= 1 && dom <= grace);

  const monthGrace = dom === lastDay || (dom <= grace && dom < lastDay);

  const weekGrace = day === 0 || (day >= 1 && day <= grace);

  if (isEndOfYear || yearGrace) return "year";
  if (isEndOfMonth || (monthGrace && !yearGrace)) return "month";
  if (isEndOfWeek || weekGrace) return "week";
  return null;
}

export function getAppOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return import.meta.env.VITE_APP_URL || "https://elegant-axolotl-df6c24.netlify.app";
}

export function buildShareText(data, link) {
  const period = data.shortLabel || data.periodLabel || "My";
  const lines = [
    `🎬 My ${period} Movie Wrapped on Movie Rater!`,
    `📽 ${data.totalWatched} movies · ⭐ ${data.avgRating}/100 avg`,
  ];
  if (data.topGenre) lines.push(`🎭 Top genre: ${data.topGenre}`);
  if (data.top5?.[0]) lines.push(`🏆 #1: ${data.top5[0].title}`);
  lines.push(link);
  return lines.join("\n");
}

export function buildTwitterUrl(text) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function buildFacebookUrl(link) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
}

export function buildWhatsAppUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
