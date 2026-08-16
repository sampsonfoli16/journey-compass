/*
   scoring.js
   Keeps a running tally of points by soft-skill category and adds a small
   boost for quick, confident answers.
*/

// A fresh scorecard with one slot for each category we track.
function createEmptyScores() {
  return {
    communication: 0,
    criticalThinking: 0,
    timeManagement: 0,
    leadership: 0
  };
}

/**
 * Adds the points from a single answered question into the running total.
 * Also applies a speed bonus and a streak multiplier so two students who
 * pick the same answers don't necessarily end up with identical scores —
 * how decisively you answer matters a little too, which keeps the quiz
 * feeling more alive than a flat point-counter.
 *
 * @param {Object} runningScores - the scorecard to add to (mutated in place)
 * @param {Object} answerScores - the {category: points} object from the chosen option
 * @param {number} secondsTaken - how long the student took on this question
 * @param {number} streakCount - how many QUICK answers (<6s) they've given in a row
 * @returns {number} the multiplier that was applied, so the UI can show it
 */
function applyAnswerScore(runningScores, answerScores, secondsTaken, streakCount) {
  // A fast answer adds to the streak; a slower one resets it.
  // This is meant as a small nudge for decisive choices rather than a punishment for thinking carefully.
  const isQuickAnswer = secondsTaken < 6;

  let multiplier = 1;
  if (isQuickAnswer && streakCount >= 2) {
    multiplier = 1.2; // 3+ quick answers in a row
  } else if (isQuickAnswer) {
    multiplier = 1.1; // a single quick answer
  }

  for (const category in answerScores) {
    runningScores[category] += answerScores[category] * multiplier;
  }

  return multiplier;
}

/**
 * Converts raw point totals into percentages (0-100) so the Results page
 * can render a bar chart without needing to know the maximum possible
 * score. Also returns which category came out on top.
 */
function normalizeScores(rawScores) {
  const total = Object.values(rawScores).reduce((sum, val) => sum + val, 0);

  const percentages = {};
  for (const category in rawScores) {
    percentages[category] = total > 0
      ? Math.round((rawScores[category] / total) * 100)
      : 0;
  }

  const topCategory = Object.keys(percentages).reduce((top, category) =>
    percentages[category] > percentages[top] ? category : top
  );

  return { percentages, topCategory };
}
