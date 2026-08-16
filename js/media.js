/*
   media.js
   Handles the two interactive media question types required by the brief:

   1. AUDIO QUESTION — custom play/pause/replay buttons wired to a native
      <audio> element (no default browser controls used).

   2. IMAGE HOTSPOT QUESTION — the student clicks somewhere on an image,
      and we work out which named "zone" (defined in questions.json as a
      percentage box) their click falls inside.
*/

/**
 * Wires up custom Play / Pause / Replay buttons to a given <audio> element.
 * Called once per audio question when it's rendered.
 *
 * @param {HTMLAudioElement} audioEl
 * @param {HTMLButtonElement} playBtn
 * @param {HTMLButtonElement} replayBtn
 */
function setupAudioControls(audioEl, playBtn, replayBtn) {
  playBtn.addEventListener("click", () => {
    if (audioEl.paused) {
      audioEl.play();
      playBtn.textContent = "⏸ Pause";
    } else {
      audioEl.pause();
      playBtn.textContent = "▶ Play";
    }
  });

  // When the clip finishes on its own, reset the button label back to Play
  // rather than leaving it stuck on "Pause"
  audioEl.addEventListener("ended", () => {
    playBtn.textContent = "▶ Play";
  });

  replayBtn.addEventListener("click", () => {
    audioEl.currentTime = 0;
    audioEl.play();
    playBtn.textContent = "⏸ Pause";
  });
}

/**
 * Given a click event on an image and the list of zones for that question,
 * works out which zone (if any) was clicked, using percentage-based
 * coordinates so it works correctly at any image display size.
 *
 * @param {MouseEvent} event - the click event from the <img>
 * @param {HTMLImageElement} imageEl - the image that was clicked
 * @param {Array} zones - zone definitions from questions.json
 * @returns {Object|null} the matching zone, or null if the click missed all zones
 */
function detectHotspotZone(event, imageEl, zones) {
  const rect = imageEl.getBoundingClientRect();

  // Convert the raw pixel click position into a percentage of the
  // image's current on-screen width/height — this is what makes the
  // hotspot work correctly whether the image is shown at 300px or 800px wide
  const xPct = ((event.clientX - rect.left) / rect.width) * 100;
  const yPct = ((event.clientY - rect.top) / rect.height) * 100;

  return zones.find(zone =>
    xPct >= zone.xMinPct && xPct <= zone.xMaxPct &&
    yPct >= zone.yMinPct && yPct <= zone.yMaxPct
  ) || null;
}
