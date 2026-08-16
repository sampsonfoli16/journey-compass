/*
   timer.js
   A small countdown timer built on setInterval and clearInterval.

   It stays generic so it can be reused anywhere a timed countdown is needed,
   whether that is the quiz or some other feature later on.
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
    // Trigger the first tick immediately so the UI starts from the correct value without waiting a full second.
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
