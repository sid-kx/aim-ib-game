// NOTE: app.js is loaded as type="module" in index.html
import { auth, db, googleProvider } from "./firebase.js";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* app.js - Main Game Logic Controller */

document.addEventListener("DOMContentLoaded", () => {
  // MAIN MENU
  const startBtn = document.getElementById("start-btn");
  if (startBtn) {
    const stats = StorageManager.getStats();
    document.getElementById("average-grade-display").innerText = stats.average + "%";

    // Segmented grade toggle (index.html) — supports Grade 4–8
    const segBtns = Array.from(document.querySelectorAll(".seg-btn"));
    const gradeHidden = document.getElementById("grade-select");

    const setActiveGrade = (gradeValue) => {
      if (!gradeHidden) return;
      const g = String(gradeValue);
      gradeHidden.value = g;
      segBtns.forEach((b) => {
        const isMatch = String(b.dataset.grade) === g;
        b.classList.toggle("is-active", isMatch);
      });
    };

    if (segBtns.length && gradeHidden) {
      // Default to last selected grade if available
      const saved = localStorage.getItem("aimIb_currentGrade") || gradeHidden.value || "4";
      setActiveGrade(saved);

      segBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          setActiveGrade(btn.dataset.grade);
        });
      });
    }

    startBtn.addEventListener("click", () => {
      const selectedGrade = gradeHidden ? gradeHidden.value : "4";
      localStorage.setItem("aimIb_currentGrade", selectedGrade);
      window.location.href = "pages/game.html";
    });
  }

  // LEADERBOARD "VIEW MORE" (Guest popup - UI only)
  const viewMoreBtn = document.getElementById("leaderboard-more");
  const modal = document.getElementById("signin-modal");
  const closeBtn = document.getElementById("signin-modal-close");
  const cancelBtn = document.getElementById("signin-modal-cancel");
  const googleBtn = document.getElementById("signin-modal-google");

  const openModal = () => {
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    // prevent background scroll when modal is open
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  // Real signed-in check (Firebase Auth)
  const isSignedIn = () => !!auth.currentUser;

  if (viewMoreBtn) {
    viewMoreBtn.addEventListener("click", () => {
      if (isSignedIn()) {
        // Later: signed-in users go to Top 100 page
        window.location.href = "pages/leaderboard.html";
      } else {
        openModal();
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  async function ensureUserDoc(user) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        username: user.displayName || "AimPlayer",
        gamesPlayed: 0,
        totalCorrect: 0,
        avgCorrectPerGame: 0,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, { lastLoginAt: serverTimestamp() });
    }
  }

  async function loadProfileIntoModal() {
    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();

    const u = document.getElementById("profile-username");
    const p = document.getElementById("profile-password");
    const games = document.getElementById("profile-games");
    const correct = document.getElementById("profile-correct");
    const avg = document.getElementById("profile-avg");
    const rank = document.getElementById("profile-rank");
    const save = document.getElementById("profile-save");

    if (u) u.value = data.username ?? (user.displayName || "AimPlayer");
    // Passwords are NOT stored/managed by Aim-IB when using Google sign-in.
    if (p) {
      p.value = "Signed in with Google";
      p.type = "text";
      p.disabled = true;
    }

    if (games) games.textContent = data.gamesPlayed ?? 0;
    if (correct) correct.textContent = data.totalCorrect ?? 0;
    if (avg) avg.textContent = Number(data.avgCorrectPerGame ?? 0).toFixed(2);
    if (rank) rank.textContent = "#—"; // later: compute via leaderboard query

    if (save) save.disabled = false;
  }

  async function doGoogleSignIn() {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(res.user);
      closeModal();
    } catch (err) {
      console.error("Google sign-in failed:", err);
      alert(`${err?.code || "unknown"}\n${err?.message || err}`);
    }
  }

  // Google button inside the guest popup modal
  if (googleBtn) googleBtn.addEventListener("click", doGoogleSignIn);

  // Also wire the main left-panel Google button if it exists
  const googleMainBtn =
    document.getElementById("continue-google") ||
    document.getElementById("google-signin") ||
    document.getElementById("google-btn") ||
    document.querySelector("button[data-action='google-signin']");

  if (googleMainBtn) googleMainBtn.addEventListener("click", doGoogleSignIn);

  /* ===========================
     DEV SIGNED-IN PREVIEW MODE
     =========================== */

  const guestPanel = document.getElementById("account-guest");
  const signedPanel = document.getElementById("account-signedin");

  function setSignedInUI(state) {
    if (!guestPanel || !signedPanel) return;

    if (state) {
      guestPanel.classList.add("hidden");
      signedPanel.classList.remove("hidden");
    } else {
      signedPanel.classList.add("hidden");
      guestPanel.classList.remove("hidden");
    }
  }

  // Shift + S toggles signed-in UI preview (does not affect real auth)
  document.addEventListener("keydown", (e) => {
    if (e.shiftKey && e.key.toLowerCase() === "s") {
      const isSigned = !signedPanel.classList.contains("hidden");
      setSignedInUI(!isSigned);
    }
  });

  /* ===========================
     PROFILE MODAL (UI ONLY)
     =========================== */

  const profileBtn = document.getElementById("view-profile");
  const profileModal = document.getElementById("profile-modal");
  const profileClose = document.getElementById("profile-close");

  if (profileBtn && profileModal) {
    profileBtn.addEventListener("click", async () => {
      profileModal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      await loadProfileIntoModal();
    });
  }

  if (profileClose && profileModal) {
    profileClose.addEventListener("click", () => {
      profileModal.classList.add("hidden");
      document.body.style.overflow = "";
    });
  }

  if (profileModal) {
    profileModal.addEventListener("click", (e) => {
      if (e.target === profileModal) {
        profileModal.classList.add("hidden");
        document.body.style.overflow = "";
      }
    });
  }

  // Save profile changes (username only)
  const profileSave = document.getElementById("profile-save");
  if (profileSave) {
    profileSave.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) {
        alert("Please sign in with Google first.");
        return;
      }

      const input = document.getElementById("profile-username");
      if (!input) return;

      const username = input.value.trim();
      if (username.length < 3 || username.length > 18) {
        alert("Username must be 3–18 characters.");
        return;
      }
      if (!/^[a-zA-Z0-9_ ]+$/.test(username)) {
        alert("Use only letters, numbers, spaces, or _");
        return;
      }

      const oldText = profileSave.textContent;
      profileSave.disabled = true;
      profileSave.textContent = "Saving...";

      try {
        const ref = doc(db, "users", user.uid);
        await updateDoc(ref, { username });
        profileSave.textContent = "Saved ✅";
        setTimeout(() => {
          profileSave.textContent = oldText;
          profileSave.disabled = false;
        }, 900);
      } catch (err) {
        console.error(err);
        alert("Save failed. Check console.");
        profileSave.textContent = oldText;
        profileSave.disabled = false;
      }
    });
  }

  const signOutBtn =
    document.getElementById("signout-btn") ||
    document.getElementById("sign-out") ||
    document.querySelector("button[data-action='signout']");

  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
      } catch (e) {
        console.error("Sign out failed:", e);
      }
    });
  }

  // Click outside the card closes
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // ESC closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Real auth state -> drives UI
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      setSignedInUI(true);
      try {
        await ensureUserDoc(user);
      } catch (e) {
        console.error("ensureUserDoc failed:", e);
      }
    } else {
      setSignedInUI(false);
    }
  });

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
  // Reset session state (important when replaying)
  score = 0;
  totalAttempted = 0;
  timeLeft = 60;

  const grade = localStorage.getItem("aimIb_currentGrade") || "4";
  document.getElementById("timer-display").innerText = timeLeft;
  updateScoreUI();
  loadNewQuestion(grade);

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer-display").innerText = timeLeft;

    // little “urgency” effect under 10s
    if (timeLeft <= 10) {
      document.getElementById("timer-display").style.filter = "drop-shadow(0 8px 14px rgba(255,92,92,0.55))";
    } else {
      document.getElementById("timer-display").style.filter = "";
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

  // Update local average for guests and for quick UI
  StorageManager.saveGameResult(percentage);

  // Persist real stats to Firestore for signed-in users (rank is based on avg correct/game)
  StorageManager.saveRun({ correct: score, attempted: totalAttempted, percent: percentage }).catch(() => {});

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
