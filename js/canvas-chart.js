/* ==========================================================================
   canvas-chart.js
   Draws the required Results-page graphic using the raw HTML5 Canvas 2D
   API — no chart library involved. It's a simple animated bar chart:
   one bar per soft-skill category, growing from 0 up to its real
   percentage over about a second, colour-coded, with the value and
   label drawn directly onto the canvas.
   ========================================================================== */

/**
 * Renders an animated bar chart into the given <canvas> element.
 *
 * @param {string} canvasId - id of the <canvas> element to draw into
 * @param {Object} percentages - { communication: 40, criticalThinking: 25, ... }
 * @param {Array<string>} categoryOrder - which categories to draw, and in what order
 * @param {Object} categoryInfo - lookup for each category's display label
 * @param {string} topCategory - which category is the "winner", drawn in red; the rest in blue
 */
function renderScoreChart(canvasId, percentages, categoryOrder, categoryInfo, topCategory) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // ---- Handle high-DPI screens ----
  // Canvas is naturally blurry on retina/high-DPI displays unless we
  // scale the backing pixel buffer up and then scale the drawing
  // context back down to match. CSS width/height stay what we want
  // displayed; the actual pixel buffer is bigger underneath.
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  ctx.scale(dpr, dpr);

  // ---- Layout constants ----
  const paddingLeft = 40;
  const paddingBottom = 40;
  const paddingTop = 20;
  const chartWidth = cssWidth - paddingLeft - 20;
  const chartHeight = cssHeight - paddingTop - paddingBottom;
  const barCount = categoryOrder.length;
  const barGap = 28;
  const barWidth = (chartWidth - barGap * (barCount - 1)) / barCount;

  const colorBlue = "#003DA5";
  const colorRed = "#CE1126";
  const colorGrid = "#E1E1DC";
  const colorText = "#111827";
  const colorTextMuted = "#5B6472";

  const maxValue = 100; // percentages are already normalised to sum to 100

  // ---- Draw one full frame of the chart at a given animation progress (0 to 1) ----
  function drawFrame(progress) {
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // Horizontal gridlines at 0 / 25 / 50 / 75 / 100, with the value labelled
    ctx.strokeStyle = colorGrid;
    ctx.fillStyle = colorTextMuted;
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.lineWidth = 1;

    [0, 25, 50, 75, 100].forEach((value) => {
      const y = paddingTop + chartHeight - (value / maxValue) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(cssWidth - 10, y);
      ctx.stroke();
      ctx.fillText(`${value}%`, paddingLeft - 8, y + 4);
    });

    // One bar per category
    categoryOrder.forEach((category, i) => {
      const targetValue = percentages[category] || 0;
      const animatedValue = targetValue * progress;

      const barHeight = (animatedValue / maxValue) * chartHeight;
      const x = paddingLeft + i * (barWidth + barGap);
      const y = paddingTop + chartHeight - barHeight;

      const isTop = category === topCategory;
      ctx.fillStyle = isTop ? colorRed : colorBlue;

      // Slightly rounded top corners on each bar, drawn manually since
      // Canvas has no built-in "rounded rect" shorthand in every browser
      const radius = 6;
      ctx.beginPath();
      ctx.moveTo(x, y + barHeight);
      ctx.lineTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.arcTo(x + barWidth, y, x + barWidth, y + radius, radius);
      ctx.lineTo(x + barWidth, y + barHeight);
      ctx.closePath();
      ctx.fill();

      // Percentage value above the bar (only once it's tall enough to
      // avoid the number and bar overlapping awkwardly mid-animation)
      if (animatedValue > 4) {
        ctx.fillStyle = colorText;
        ctx.font = "700 13px 'Space Grotesk', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.round(animatedValue)}%`, x + barWidth / 2, y - 8);
      }

      // Category label below the chart, wrapped onto two lines if it's long
      const label = categoryInfo[category].label;
      ctx.fillStyle = colorTextMuted;
      ctx.font = "600 11px Inter, sans-serif";
      ctx.textAlign = "center";

      const words = label.split(" ");
      if (words.length > 1) {
        ctx.fillText(words[0], x + barWidth / 2, paddingTop + chartHeight + 16);
        ctx.fillText(words.slice(1).join(" "), x + barWidth / 2, paddingTop + chartHeight + 30);
      } else {
        ctx.fillText(label, x + barWidth / 2, paddingTop + chartHeight + 20);
      }
    });
  }

  // ---- Animate from 0 to full value using requestAnimationFrame ----
  const durationMs = 900;
  let startTime = null;

  function step(timestamp) {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;

    // easeOutCubic: fast start, gentle settle — reads as more natural
    // than a straight linear grow
    const linearProgress = Math.min(elapsed / durationMs, 1);
    const eased = 1 - Math.pow(1 - linearProgress, 3);

    drawFrame(eased);

    if (linearProgress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}
