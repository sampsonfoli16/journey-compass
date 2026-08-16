/*
   results.js
   Reads the saved quiz results and student details, then turns them into a
   personalised summary page with the top strength, score breakdown, and
   next-step guidance.
*/

// Each category has a small bit of copy for the heading, the summary blurb,
// and a practical next step. This content is static and independent from the
// student's answers.
const CATEGORY_INFO = {
  communication: {
    label: "Communication",
    needleAngle: -45,
    description:
      "You default to clarity, checking that people understood you, saying the quiet thing out loud, and keeping others in the loop rather than letting confusion sit.",
    next:
      "Next step: look for a facilitation, writing, or public-speaking elective, and volunteer to run check-ins on your next group project."
  },
  criticalThinking: {
    label: "Critical Thinking",
    needleAngle: -135,
    description:
      "You slow down to actually understand a problem before jumping to a fix, and you're comfortable questioning your own first answer instead of settling for it.",
    next:
      "Next step: lean into research-heavy modules and case-study electives, where structured reasoning is the whole game."
  },
  timeManagement: {
    label: "Time Management",
    needleAngle: 135,
    description:
      "You plan ahead, work out what actually matters most, and rarely let a deadline catch you off guard.",
    next:
      "Next step: try a personal system like time-blocking or a weekly priority list, to make this strength even more consistent under pressure."
  },
  leadership: {
    label: "Leadership",
    needleAngle: 45,
    description:
      "You're the one who steps up and reorganizes when a group loses direction, without needing to be asked.",
    next:
      "Next step: look into student leadership opportunities in your cohort, like a council seat, a class project lead role, or an orientation mentor spot."
  }
};

const CATEGORY_ORDER = ["communication", "criticalThinking", "timeManagement", "leadership"];

document.addEventListener("DOMContentLoaded", () => {
  const emptyState = document.getElementById("results-empty");
  const content = document.getElementById("results-content");

  const resultsRaw = sessionStorage.getItem("jc_results");

  if (!resultsRaw) {
    emptyState.hidden = false;
    return;
  }

  const results = JSON.parse(resultsRaw);
  const studentRaw = sessionStorage.getItem("jc_student");
  const student = studentRaw ? JSON.parse(studentRaw) : null;

  content.hidden = false;
  renderGreeting(results, student);
  renderCompass(results.topCategory);
  renderScoreChart("score-chart", results.percentages, CATEGORY_ORDER, CATEGORY_INFO, results.topCategory);
  renderScoreList(results);
  renderPlan(results.topCategory);
  wireActions();
});

// Render the greeting and a small line of metadata about the student.
function renderGreeting(results, student) {
  const greetingEl = document.getElementById("results-greeting");
  const metaEl = document.getElementById("results-meta");

  if (student && student.fullname) {
    const firstName = student.fullname.trim().split(" ")[0];
    greetingEl.textContent = `Nice work, ${firstName}!`;
  } else {
    greetingEl.textContent = "Nice work!";
  }

  metaEl.textContent = `You answered ${results.questionsAnswered} of ${results.totalQuestions} questions.`;
}

// Point the compass needle toward the student's strongest category.
function renderCompass(topCategory) {
  const needle = document.getElementById("results-needle");
  const caption = document.getElementById("results-compass-caption");
  const info = CATEGORY_INFO[topCategory];

  needle.style.transform = `rotate(${info.needleAngle}deg)`;
  caption.textContent = `Your top strength: ${info.label}`;
}

// Show an animated bar for each skill area, ordered by the final scores.
function renderScoreList(results) {
  const list = document.getElementById("score-list");
  list.innerHTML = "";

  const sorted = [...CATEGORY_ORDER].sort(
    (a, b) => results.percentages[b] - results.percentages[a]
  );

  sorted.forEach((category) => {
    const info = CATEGORY_INFO[category];
    const percent = results.percentages[category];
    const isTop = category === results.topCategory;

    const li = document.createElement("li");
    li.className = "score-row";
    li.innerHTML = `
      <div class="score-row-head">
        <span class="score-row-label">
          ${info.label}
          ${isTop ? '<span class="top-badge">Top</span>' : ""}
        </span>
        <span class="score-row-value">${percent}%</span>
      </div>
      <div class="score-track">
        <div class="score-fill" data-target="${percent}"></div>
      </div>
    `;
    list.appendChild(li);
  });

  // Animate the bars on the next frame so the width transition has a clean start point.
  requestAnimationFrame(() => {
    document.querySelectorAll(".score-fill").forEach((fill) => {
      fill.style.width = `${fill.dataset.target}%`;
    });
  });
}

// Build the personalised Learning Journey Plan from the top category.
function renderPlan(topCategory) {
  const info = CATEGORY_INFO[topCategory];
  document.getElementById("plan-title").textContent = info.label;
  document.getElementById("plan-description").textContent = info.description;
  document.getElementById("plan-next").textContent = info.next;
}

// Wire up the retake and restart actions.
function wireActions() {
  const retakeBtn = document.getElementById("retake-btn");
  const restartLink = document.getElementById("restart-link");

  // Retake clears only the old results so the student can jump straight back in.
  retakeBtn.addEventListener("click", () => {
    sessionStorage.removeItem("jc_results");
    window.location.href = "quiz.html";
  });

  // Start over: clear everything, including student details, and go
  // back to the very beginning
  restartLink.addEventListener("click", () => {
    sessionStorage.removeItem("jc_results");
    sessionStorage.removeItem("jc_student");
  });
}
