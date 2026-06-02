/** Period bounds and labels for Movie Wrapped */

export function getISOWeekInfo(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

export function getPeriodBounds(period, refDate = new Date()) {
  const y = refDate.getFullYear();
  const m = refDate.getMonth() + 1;

  if (period === "year") {
    return {
      period: "year",
      label: `${y} Wrapped`,
      shortLabel: String(y),
      storageKey: `year-${y}`,
      year: y,
      month: null,
      week: null,
      weekStart: new Date(y, 0, 1),
      weekEnd: new Date(y + 1, 0, 1),
      useActivityWeek: false,
    };
  }

  if (period === "month") {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const lastDay = new Date(y, m, 0).getDate();
    return {
      period: "month",
      label: `${monthNames[m - 1]} ${y} Wrapped`,
      shortLabel: `${monthNames[m - 1]} ${y}`,
      storageKey: `month-${y}-${m}`,
      year: y,
      month: m,
      week: null,
      weekStart: new Date(y, m - 1, 1),
      weekEnd: new Date(y, m, 1),
      useActivityWeek: false,
    };
  }

  // week — ISO week (Mon–Sun), movies tied to activity in that window
  const day = refDate.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(refDate);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + diffToMonday);
  const sundayEnd = new Date(monday);
  sundayEnd.setDate(sundayEnd.getDate() + 7);

  const { year: isoYear, week: isoWeek } = getISOWeekInfo(refDate);

  return {
    period: "week",
    label: `Week ${isoWeek}, ${isoYear} Wrapped`,
    shortLabel: `Week ${isoWeek}`,
    storageKey: `week-${isoYear}-W${String(isoWeek).padStart(2, "0")}`,
    year: isoYear,
    month: m,
    week: isoWeek,
    weekStart: monday,
    weekEnd: sundayEnd,
    useActivityWeek: true,
  };
}

export function isPeriodEndMoment(date = new Date()) {
  const day = date.getDay();
  const dom = date.getDate();
  const month = date.getMonth();
  const lastDay = new Date(date.getFullYear(), month + 1, 0).getDate();

  const isEndOfWeek = day === 0;
  const isEndOfMonth = dom === lastDay;
  const isEndOfYear = month === 11 && dom === 31;

  return { isEndOfWeek, isEndOfMonth, isEndOfYear };
}

/** Which wrap to surface on home (year > month > week) */
export function getPreviousAnchorDate(period, date = new Date()) {
  const d = new Date(date);
  if (period === "year") {
    d.setFullYear(d.getFullYear() - 1);
    d.setMonth(11);
    d.setDate(15);
    return d;
  }
  if (period === "month") {
    d.setMonth(d.getMonth() - 1);
    d.setDate(15);
    return d;
  }
  d.setDate(d.getDate() - 7);
  return d;
}

export function getAutoWrapPeriod(date = new Date()) {
  const { isEndOfWeek, isEndOfMonth, isEndOfYear } = isPeriodEndMoment(date);
  const graceDays = 2;
  const dom = date.getDate();
  const month = date.getMonth();
  const day = date.getDay();
  const lastDay = new Date(date.getFullYear(), month + 1, 0).getDate();

  const inYearGrace =
    (month === 11 && dom === 31) ||
    (month === 0 && dom <= graceDays);
  const inMonthGrace =
    dom === lastDay ||
    (dom <= graceDays && dom > 0);
  const inWeekGrace = day === 0 || (day > 0 && day <= graceDays);

  if (isEndOfYear || inYearGrace) return "year";
  if (isEndOfMonth || inMonthGrace) return "month";
  if (isEndOfWeek || inWeekGrace) return "week";
  return null;
}
