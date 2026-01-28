/* app.js - Main Game Logic Controller */

document.addEventListener("DOMContentLoaded", () => {
  // MAIN MENU
  const startBtn = document.getElementById("start-btn");
  if (startBtn) {
    const stats = StorageManager.getStats();
    document.getElementById("average-grade-display").innerText = stats.average + "%";

    // Segmented grade toggle (index.html)
    const segBtns = document.querySelectorAll(".seg-btn");
    const gradeHidden = document.getElementById("grade-select");

    if (segBtns.length && gradeHidden) {
      segBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          segBtns.forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          gradeHidden.value = btn.dataset.grade;
        });
      });
    }

    startBtn.addEventListener("click", () => {
      const selectedGrade = gradeHidden ? gradeHidden.value : "4";
      localStorage.setItem("aimIb_currentGrade", selectedGrade);
      window.location.href = "pages/game.html";
    });
  }

  // GAME PAGE
  const timerDisplay = document.getElementById("timer-display");
  if (timerDisplay) startGameSession();

  // RESULTS PAGE
  const finalScoreDisplay = document.getElementById("final-score");
  if (finalScoreDisplay) showResults();
});

/* ===========================
   GAME ENGINE
   =========================== */
let score = 0;
let totalAttempted = 0;
let timeLeft = 60;
let timerInterval;
let currentQuestion;

function startGameSession() {
  const grade = localStorage.getItem("aimIb_currentGrade") || "4";
  updateScoreUI();
  loadNewQuestion(grade);

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer-display").innerText = timeLeft;

    // little “urgency” effect under 10s
    if (timeLeft <= 10) {
      document.getElementById("timer-display").style.filter = "drop-shadow(0 8px 14px rgba(255,92,92,0.55))";
    }

    if (timeLeft <= 0) endGame();
  }, 1000);
}

function loadNewQuestion(grade) {
  currentQuestion = QuestionGenerator.generate(grade);

  document.getElementById("question-text").innerText = currentQuestion.question;

  const optionsContainer = document.getElementById("options-container");
  optionsContainer.innerHTML = "";

  currentQuestion.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.classList.add("option-btn");
    btn.innerText = option;

    btn.addEventListener("click", () => handleAnswer(index, btn, optionsContainer));
    optionsContainer.appendChild(btn);
  });
}

function handleAnswer(selectedIndex, btnElement, optionsContainer) {
  totalAttempted++;

  const buttons = optionsContainer.querySelectorAll(".option-btn");
  buttons.forEach((b) => (b.disabled = true)); // prevent spam clicking

  const correct = selectedIndex === currentQuestion.correctIndex;

  if (correct) {
    score++;
    btnElement.classList.add("correct");
  } else {
    btnElement.classList.add("wrong");
    // also highlight the correct one quickly
    const correctBtn = buttons[currentQuestion.correctIndex];
    if (correctBtn) correctBtn.classList.add("correct");
  }

  updateScoreUI();

  // short delay so kids actually see feedback
  setTimeout(() => {
    const grade = localStorage.getItem("aimIb_currentGrade") || "4";
    loadNewQuestion(grade);
  }, 220);
}

function updateScoreUI() {
  document.getElementById("score-display").innerText = score;
}

function endGame() {
  clearInterval(timerInterval);

  let percentage = 0;
  if (totalAttempted > 0) {
    percentage = Math.round((score / totalAttempted) * 100);
  }

  localStorage.setItem(
    "aimIb_lastSession",
    JSON.stringify({ score, attempted: totalAttempted, percentage })
  );

  StorageManager.saveGameResult(percentage);

  window.location.href = "results.html";
}

/* ===========================
   RESULTS LOGIC
   =========================== */
function showResults() {
  const data = JSON.parse(localStorage.getItem("aimIb_lastSession"));
  const stats = StorageManager.getStats();

  if (data) {
    document.getElementById("final-score").innerText = data.percentage + "%";
    document.getElementById("correct-count").innerText = data.score;
    document.getElementById("total-count").innerText = data.attempted;
    document.getElementById("new-average").innerText = stats.average + "%";
  }
}
