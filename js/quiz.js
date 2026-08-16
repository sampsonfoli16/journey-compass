/*
   quiz.js
   Orchestrates the whole quiz: loads questions.json, renders the current
   question (in whichever of the three formats it is), records answers
   into the scoring engine, drives the countdown timer, and hands off to
   the Results page once everything is answered or time runs out.
*/

document.addEventListener("DOMContentLoaded", () => {

  // ---- Elements we'll be updating throughout the quiz ----
  const questionCard = document.getElementById("question-card");
  const progressFill = document.getElementById("progress-fill");
  const progressLabel = document.getElementById("progress-label");
  const progressNeedle = document.getElementById("progress-needle");
  const timerDisplay = document.getElementById("timer-display");
  const timerValue = document.getElementById("timer-value");
  const timeoutOverlay = document.getElementById("timeout-overlay");

  // ---- Quiz state, all kept in one place ----
  let questions = [];
  let currentIndex = 0;
  let scores = createEmptyScores();
  let streakCount = 0;
  let questionStartTime = null;
  let timer = null;
  let quizLocked = false;

  // ---- Load the question bank, then kick things off ----
  fetch("data/questions.json")
    .then(response => response.json())
    .then(data => {
      questions = data.questions;
      startTimer(data.quizDurationSeconds);
      renderQuestion();
    })
    .catch(() => {
      questionCard.innerHTML = `<p class="loading-text">Couldn't load the quiz questions. Please refresh the page.</p>`;
    });

  // ---- Timer setup ----
  function startTimer(durationSeconds) {
    timer = createCountdownTimer(
      durationSeconds,
      (remaining) => {
        timerValue.textContent = formatTime(remaining);
        // Switch the timer into its "warning" visual state under 30s left
        timerDisplay.classList.toggle("timer-warning", remaining <= 30 && remaining > 0);
      },
      handleTimeout
    );
    timer.start();
  }

  // ---- What happens when the countdown hits zero ----
  function handleTimeout() {
    if (quizLocked) return; // already finished normally, nothing to do
    quizLocked = true;
    document.body.classList.add("quiz-locked");
    timeoutOverlay.hidden = false;

    // Give the student a moment to read the message, then submit
    // whatever scores were accumulated so far
    setTimeout(finishQuiz, 1800);
  }

  // ---- Renders whichever question we're currently on ----
  function renderQuestion() {
    const question = questions[currentIndex];
    questionStartTime = Date.now();
    updateProgress();

    if (question.type === "mcq") {
      renderMcqQuestion(question);
    } else if (question.type === "audio") {
      renderAudioQuestion(question);
    } else if (question.type === "hotspot") {
      renderHotspotQuestion(question);
    }
  }

  // ---- Standard multiple-choice question ----
  function renderMcqQuestion(question) {
    questionCard.innerHTML = `
      <span class="question-type-label">Multiple choice</span>
      <p class="question-text">${question.text}</p>
      <ul class="options-list"></ul>
    `;

    const list = questionCard.querySelector(".options-list");
    question.options.forEach((option, i) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.type = "button";
      btn.textContent = option.label;
      btn.addEventListener("click", () => selectOption(btn, option.scores, list));
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  // ---- Audio-based question (interactive media type 1) ----
  function renderAudioQuestion(question) {
    questionCard.innerHTML = `
      <span class="question-type-label">Audio scenario</span>
      <p class="question-text">${question.text}</p>
      <div class="audio-controls">
        <audio id="scenario-audio" src="${question.audioSrc}" preload="auto"></audio>
        <button type="button" class="audio-btn" id="audio-play-btn">▶ Play</button>
        <button type="button" class="audio-btn" id="audio-replay-btn">↺ Replay</button>
        <span class="audio-hint">Listen, then pick your answer below</span>
      </div>
      <ul class="options-list"></ul>
    `;

    const audioEl = document.getElementById("scenario-audio");
    const playBtn = document.getElementById("audio-play-btn");
    const replayBtn = document.getElementById("audio-replay-btn");
    setupAudioControls(audioEl, playBtn, replayBtn);

    const list = questionCard.querySelector(".options-list");
    question.options.forEach((option) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.type = "button";
      btn.textContent = option.label;
      btn.addEventListener("click", () => {
        audioEl.pause(); // stop playback once they've answered
        selectOption(btn, option.scores, list);
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  // ---- Image hotspot question (interactive media type 2) ----
  function renderHotspotQuestion(question) {
    questionCard.innerHTML = `
      <span class="question-type-label">Image hotspot</span>
      <p class="question-text">${question.text}</p>
      <div class="hotspot-wrap">
        <img src="${question.image}" alt="Office layout, click a zone to answer" id="hotspot-image">
      </div>
      <p class="hotspot-feedback" id="hotspot-feedback"></p>
    `;

    const imageEl = document.getElementById("hotspot-image");
    const feedback = document.getElementById("hotspot-feedback");

    // Click is only handled once per question — after a zone is picked,
    // we disable further clicks so the answer can't accidentally change
    let answered = false;

    imageEl.addEventListener("click", (event) => {
      if (answered) return;

      const zone = detectHotspotZone(event, imageEl, question.zones);
      if (!zone) {
        feedback.textContent = "Click directly on one of the three zones.";
        return;
      }

      answered = true;
      feedback.textContent = `You chose: ${zone.label}`;
      imageEl.style.cursor = "default";

      recordAnswer(zone.scores);
      setTimeout(goToNextQuestion, 500);
    });
  }

  // ---- Shared logic for MCQ / Audio option selection ----
  function selectOption(chosenBtn, optionScores, list) {
    // Lock the whole list once an answer is chosen, and visually mark
    // the selected one, before moving on
    list.querySelectorAll(".option-btn").forEach(btn => btn.disabled = true);
    chosenBtn.classList.add("selected");

    recordAnswer(optionScores);
    setTimeout(goToNextQuestion, 450);
  }

  // ---- Records the chosen answer's points into the scoring engine ----
  function recordAnswer(answerScores) {
    const secondsTaken = (Date.now() - questionStartTime) / 1000;
    const multiplier = applyAnswerScore(scores, answerScores, secondsTaken, streakCount);

    // Track the streak: a quick answer extends it, anything slower resets it
    if (secondsTaken < 6) {
      streakCount += 1;
    } else {
      streakCount = 0;
    }
  }

  // ---- Moves to the next question, or finishes the quiz ----
  function goToNextQuestion() {
    currentIndex += 1;
    if (currentIndex >= questions.length) {
      finishQuiz();
    } else {
      renderQuestion();
    }
  }

  // ---- Updates the progress bar, label, and compass needle ----
  function updateProgress() {
    const percent = (currentIndex / questions.length) * 100;
    progressFill.style.width = `${percent}%`;
    progressLabel.textContent = `Question ${currentIndex + 1} of ${questions.length}`;

    // Needle sweeps from -70deg to +70deg across the whole quiz
    const angle = -70 + (percent / 100) * 140;
    progressNeedle.style.transform = `rotate(${angle}deg)`;
  }

  // ---- Wraps everything up and sends the student to the Results page ----
  function finishQuiz() {
    if (timer) timer.stop();
    quizLocked = true;

    const { percentages, topCategory } = normalizeScores(scores);

    const results = {
      rawScores: scores,
      percentages,
      topCategory,
      questionsAnswered: currentIndex,
      totalQuestions: questions.length
    };

    sessionStorage.setItem("jc_results", JSON.stringify(results));
    window.location.href = "results.html";
  }
});
