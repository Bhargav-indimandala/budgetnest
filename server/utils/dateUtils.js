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

module.exports = { IST_OFFSET_MINUTES, getISTParts, getISTDayRangeUTC };
