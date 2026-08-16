/*
   timer.js
   A small, reusable countdown timer built on setInterval/clearInterval.

   It doesn't know anything about the quiz itself — you just tell it how
   long to run and give it two callback functions: one that fires every
   second (so the UI can update), and one that fires once when time runs
   out. Keeping it generic like this means it could be reused for any
   other timed feature later without rewriting it.
*/

function createCountdownTimer(durationSeconds, onTick, onExpire) {
  let remaining = durationSeconds;
  let intervalId = null;

  function tick() {
    remaining -= 1;

    if (remaining <= 0) {
      remaining = 0;
      onTick(remaining);
      stop();
      onExpire();
      return;
    }

    onTick(remaining);
  }

  function start() {
    // Fire once immediately so the UI shows the starting time right away,
    // instead of waiting a full second for the first update
    onTick(remaining);
    intervalId = setInterval(tick, 1000);
  }

  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function getRemaining() {
    return remaining;
  }

  return { start, stop, getRemaining };
}

/**
 * Turns a raw seconds count into a "M:SS" display string.
 * e.g. 125 -> "2:05"
 */
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
