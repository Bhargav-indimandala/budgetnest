// This app's users are assumed to be in India (IST, UTC+5:30) — there's no
// per-user timezone setting yet, so "today" is computed in IST rather than
// the server's own clock (which is UTC on Render). Used anywhere "today" or
// "the future" needs to mean the same thing to the user as it does to the code.
const IST_OFFSET_MINUTES = 5 * 60 + 30;

const getISTParts = (date = new Date()) => {
  const istMs = date.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const ist = new Date(istMs);
  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth(),
    day: ist.getUTCDate(),
    hours: ist.getUTCHours(),
    minutes: ist.getUTCMinutes(),
  };
};

// Returns the UTC instant range [startOfDay, endOfDay] for "today" in IST
const getISTDayRangeUTC = (date = new Date()) => {
  const { year, month, day } = getISTParts(date);
  // Midnight IST expressed as a UTC instant is (UTC midnight - IST offset)
  const startUTC = new Date(Date.UTC(year, month, day, 0, 0, 0) - IST_OFFSET_MINUTES * 60 * 1000);
  const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { startUTC, endUTC };
};

// Given IST calendar year/month(0-indexed)/day, returns the UTC instant for
// that date's midnight IST — the single conversion point every helper below
// funnels through, so there's exactly one place this math can go wrong.
const istCalendarDateToUTC = (year, month, day) =>
  new Date(Date.UTC(year, month, day, 0, 0, 0) - IST_OFFSET_MINUTES * 60 * 1000);

// Returns the UTC instant range for a full IST calendar month.
// `month` is 1-indexed (1 = January), matching how the rest of the app
// already passes month numbers around (report routes, form dropdowns, etc).
const getISTMonthRangeUTC = (year, month) => {
  const startUTC = istCalendarDateToUTC(year, month - 1, 1);
  // Start of the *next* month, then step back 1ms, avoids day-count math
  const nextMonthStartUTC = month === 12
    ? istCalendarDateToUTC(year + 1, 0, 1)
    : istCalendarDateToUTC(year, month, 1);
  const endUTC = new Date(nextMonthStartUTC.getTime() - 1);
  return { startUTC, endUTC };
};

// Returns the UTC instant range for a full IST calendar year
const getISTYearRangeUTC = (year) => {
  const startUTC = istCalendarDateToUTC(year, 0, 1);
  const endUTC = new Date(istCalendarDateToUTC(year + 1, 0, 1).getTime() - 1);
  return { startUTC, endUTC };
};

// Number of days in a given IST calendar month (1-indexed month) — plain
// calendar arithmetic, not timezone-sensitive, but grouped here since every
// caller that needs this also needs the IST-aware range above.
const getDaysInISTMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

// Returns the UTC instant range for the Mon-Sun IST week containing
// `referenceDate`, optionally offset by `weeksAgo` full weeks into the past.
const getISTWeekRangeUTC = (referenceDate = new Date(), weeksAgo = 0) => {
  const { year, month, day } = getISTParts(referenceDate);
  // Treat this purely as a calendar-arithmetic container (not a real
  // instant) until the final conversion at the bottom — avoids double-
  // applying the IST offset.
  const asCalendarDate = new Date(Date.UTC(year, month, day));
  const dow = asCalendarDate.getUTCDay() || 7; // Monday=1 .. Sunday=7
  const mondayCalendar = new Date(asCalendarDate.getTime() - (dow - 1) * 86400000 - weeksAgo * 7 * 86400000);
  const sundayCalendar = new Date(mondayCalendar.getTime() + 6 * 86400000);

  const startUTC = istCalendarDateToUTC(
    mondayCalendar.getUTCFullYear(), mondayCalendar.getUTCMonth(), mondayCalendar.getUTCDate()
  );
  const endOfSundayUTC = istCalendarDateToUTC(
    sundayCalendar.getUTCFullYear(), sundayCalendar.getUTCMonth(), sundayCalendar.getUTCDate()
  );
  const endUTC = new Date(endOfSundayUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

  return {
    startUTC,
    endUTC,
    mondayLabel: mondayCalendar.toISOString().split('T')[0],
    sundayLabel: sundayCalendar.toISOString().split('T')[0],
  };
};

// Returns "YYYY-MM-DD" for the given instant's IST calendar date — use this
// instead of `date.toISOString().split('T')[0]` anywhere expenses are
// grouped/labeled by day, since toISOString() reports the UTC date, which
// is a day behind for anything between midnight and 5:30 AM IST.
const getISTDateKey = (date) => {
  const { year, month, day } = getISTParts(date);
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

module.exports = {
  IST_OFFSET_MINUTES,
  getISTParts,
  getISTDayRangeUTC,
  getISTMonthRangeUTC,
  getISTYearRangeUTC,
  getDaysInISTMonth,
  getISTWeekRangeUTC,
  getISTDateKey,
};
