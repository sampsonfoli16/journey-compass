/*
   quiz.js
   Runs the quiz flow: loads the question bank, renders each question,
   records answers, updates the timer, and sends the student to the
   results page when the quiz is complete.
*/

document.addEventListener("DOMContentLoaded", () => {

  // These are the page elements that change as the student moves through the quiz.
  const questionCard = document.getElementById("question-card");
  const progressFill = document.getElementById("progress-fill");
  const progressLabel = document.getElementById("progress-label");
  const progressNeedle = document.getElementById("progress-needle");
  const timerDisplay = document.getElementById("timer-display");
  const timerValue = document.getElementById("timer-value");
  const timeoutOverlay = document.getElementById("timeout-overlay");

  // The quiz keeps its progress and score state in one place so the flow stays predictable.
  let questions = [];
  let currentIndex = 0;
  let scores = createEmptyScores();
  let streakCount = 0;
  let questionStartTime = null;
  let timer = null;
  let quizLocked = false;

  // Fetch the question bank, then start the timer and render the first item.
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

  // Set up the countdown and wire it to the warning state and timeout handler.
  function startTimer(durationSeconds) {
    timer = createCountdownTimer(
      durationSeconds,
      (remaining) => {
        timerValue.textContent = formatTime(remaining);
        // Flip the timer into its warning styling when there are 30 seconds or less left.
        timerDisplay.classList.toggle("timer-warning", remaining <= 30 && remaining > 0);
      },
      handleTimeout
    );
    timer.start();
  }

  // When time runs out, lock the quiz and let the student finish with the answers they have.
  function handleTimeout() {
    if (quizLocked) return; // already finished normally, nothing to do
    quizLocked = true;
    document.body.classList.add("quiz-locked");
    timeoutOverlay.hidden = false;

    // Give the student a moment to read the timeout message, then save the scores collected so far.
    setTimeout(finishQuiz, 1800);
  }

  // Render the question that matches the current index.
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

  // Build a standard multiple-choice question card.
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

  // Build the audio question version with custom play and replay controls.
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

  // Build the hotspot question where the student clicks a region of the image.
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

    // Only accept the first valid hotspot click so the answer cannot change by accident.
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

  // Shared logic for selecting an option in MCQ or audio questions.
  function selectOption(chosenBtn, optionScores, list) {
    // Lock the choices once a selection is made so the student cannot double-submit.
    list.querySelectorAll(".option-btn").forEach(btn => btn.disabled = true);
    chosenBtn.classList.add("selected");

    recordAnswer(optionScores);
    setTimeout(goToNextQuestion, 450);
  }

  // Add the selected answer's points to the running scoreboard.
  function recordAnswer(answerScores) {
    const secondsTaken = (Date.now() - questionStartTime) / 1000;
    const multiplier = applyAnswerScore(scores, answerScores, secondsTaken, streakCount);

    // Quick responses increase the streak; slower answers reset it.
    if (secondsTaken < 6) {
      streakCount += 1;
    } else {
      streakCount = 0;
    }
  }

  // Move to the next question or finish the quiz when the final item is answered.
  function goToNextQuestion() {
    currentIndex += 1;
    if (currentIndex >= questions.length) {
      finishQuiz();
    } else {
      renderQuestion();
    }
  }

  // Update the progress bar, label, and compass needle to match the current step.
  function updateProgress() {
    const percent = (currentIndex / questions.length) * 100;
    progressFill.style.width = `${percent}%`;
    progressLabel.textContent = `Question ${currentIndex + 1} of ${questions.length}`;

    // Sweep the needle from left to right across the full quiz so it feels like a real compass.
    const angle = -70 + (percent / 100) * 140;
    progressNeedle.style.transform = `rotate(${angle}deg)`;
  }

  // Finalise the scores and send the student to the results screen.
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
