/*
  canvas-chart.js
  Renders the results chart as a friendly, animated bar graph.
*/

/**
 * Draws the score breakdown into a canvas.
 *
 * @param {string} canvasId - id of the canvas element
 * @param {Object} percentages - category totals as percentages
 * @param {Array<string>} categoryOrder - categories to draw, in display order
 * @param {Object} categoryInfo - labels and metadata for each category
 * @param {string} topCategory - the category that should stand out in red
 */
function renderScoreChart(canvasId, percentages, categoryOrder, categoryInfo, topCategory) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Retina screens can make canvas drawings look soft, so we scale the
  // backing buffer up and then draw it back down to match the visible size.
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  ctx.scale(dpr, dpr);

  // The spacing and bar sizing are kept here so the chart can stay balanced on different screen widths.
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

  // Draw a single frame of the chart, based on how far the animation has progressed.
  function drawFrame(progress) {
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // Light guide lines make it easier to read the chart against a 0-100 scale.
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

    // One bar for each category, with the strongest result highlighted.
    categoryOrder.forEach((category, i) => {
      const targetValue = percentages[category] || 0;
      const animatedValue = targetValue * progress;

      const barHeight = (animatedValue / maxValue) * chartHeight;
      const x = paddingLeft + i * (barWidth + barGap);
      const y = paddingTop + chartHeight - barHeight;

      const isTop = category === topCategory;
      ctx.fillStyle = isTop ? colorRed : colorBlue;

      // The bar tops are rounded manually so the shape looks a bit softer in browsers without a helper method.
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

      // Only show the value once the bar is tall enough that the label sits comfortably above it.
      if (animatedValue > 4) {
        ctx.fillStyle = colorText;
        ctx.font = "700 13px 'Space Grotesk', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.round(animatedValue)}%`, x + barWidth / 2, y - 8);
      }

      // Category labels stay under the bars, and longer names wrap onto a second line if needed.
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

  // Animate the chart from zero to the final value for a smoother reveal.
  const durationMs = 900;
  let startTime = null;

  function step(timestamp) {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;

    // This easing gives a quick start but settles more naturally than a straight linear grow.
    const linearProgress = Math.min(elapsed / durationMs, 1);
    const eased = 1 - Math.pow(1 - linearProgress, 3);

    drawFrame(eased);

    if (linearProgress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}
