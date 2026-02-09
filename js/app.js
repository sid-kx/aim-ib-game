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
  increment,
  serverTimestamp,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* app.js - Main Game Logic Controller */

// ----------------------------
// Firestore user doc helpers (module-scope)
// ----------------------------
async function ensureUserDoc(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      username: user.displayName || "AimPlayer",
      gamesPlayed: 0,
      totalCorrect: 0,
      totalAttempted: 0,
      totalPercentSum: 0,
      avgCorrectPerGame: 0,
      avgPercent: 0,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, { lastLoginAt: serverTimestamp() });
  }
}

async function commitRunToFirestore({ correct, attempted }) {
  const user = auth.currentUser;
  if (!user) return; // guests don't write

  const ref = doc(db, "users", user.uid);

  const c = Number(correct) || 0;
  const a = Number(attempted) || 0;
  const percent = a > 0 ? +((c / a) * 100).toFixed(2) : 0;

  // Ensure doc exists (updateDoc fails if missing)
  const snap0 = await getDoc(ref);
  if (!snap0.exists()) {
    await ensureUserDoc(user);
  }

  // 1) increment totals + percent sum (this should happen ONCE per game)
  await updateDoc(ref, {
    gamesPlayed: increment(1),
    totalCorrect: increment(c),
    totalAttempted: increment(a),
    totalPercentSum: increment(percent),
    lastGameAt: serverTimestamp(),
  });

  // 2) recompute averages from stored aggregates
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() || {};

  const gp = Number(data.gamesPlayed || 0);
  const tc = Number(data.totalCorrect || 0);
  const ps = Number(data.totalPercentSum || 0);

  const avgCorrect = gp > 0 ? +(tc / gp).toFixed(2) : 0;
  const avgPercent = gp > 0 ? +(ps / gp).toFixed(2) : 0;

  await updateDoc(ref, {
    avgCorrectPerGame: avgCorrect,
    avgPercent: avgPercent,
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // MAIN MENU
  const startBtn = document.getElementById("start-btn");
  if (startBtn) {
    const stats = (window.StorageManager && typeof window.StorageManager.getStats === "function")
      ? window.StorageManager.getStats()
      : { average: 0 };

    const avgEl = document.getElementById("average-grade-display");
    if (avgEl) avgEl.innerText = stats.average + "%";

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

  // MAIN MENU: Right panel Top 5 (guest = demo rows, signed-in = Firestore)
  const mainLbList = document.getElementById("mainmenu-leaderboard-list");
  const mainLbHint = document.getElementById("mainmenu-leaderboard-hint");
  const guestTop5Html = mainLbList ? mainLbList.innerHTML : "";

  const esc = (s) =>
    String(s ?? "").replace(/[&<>\"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  function restoreGuestTop5() {
    if (!mainLbList) return;
    mainLbList.innerHTML = guestTop5Html;
    mainLbList.dataset.mode = "guest";
    if (mainLbHint) mainLbHint.classList.add("hidden");
  }

  function renderMainMenuTop5(rows) {
    if (!mainLbList) return;

    const medal = (r) => (r === 1 ? "gold" : r === 2 ? "silver" : r === 3 ? "bronze" : "");

    mainLbList.innerHTML = rows
      .slice(0, 5)
      .map((r, i) => {
        const rank = i + 1;
        const cls = medal(rank);
        const name = esc(r.username || "AimPlayer");
        const avg = Number(r.avgPercent || 0);
        const avgText = Number.isFinite(avg) ? `${avg.toFixed(2)}%` : "0.00%";

        return `
          <div class="leaderboard-row ${cls}">
            <span class="rank">${rank}</span>
            <span class="name">${name}</span>
            <span class="avg">${avgText}</span>
          </div>
        `;
      })
      .join("");

    mainLbList.dataset.mode = "live";
    if (mainLbHint) mainLbHint.classList.add("hidden");
  }

  async function loadMainMenuTop5FromFirestore() {
    if (!mainLbList) return;

    try {
      const qTop = query(
        collection(db, "users"),
        orderBy("avgPercent", "desc"),
        limit(25) // a few extra to skip gamesPlayed=0
      );

      const snap = await getDocs(qTop);
      const rows = [];

      snap.forEach((d) => {
        const data = d.data() || {};
        const games = Number(data.gamesPlayed || 0);
        if (games <= 0) return;
        rows.push({
          username: data.username || "AimPlayer",
          avgPercent: Number(data.avgPercent || 0),
        });
      });

      renderMainMenuTop5(rows);
    } catch (e) {
      console.error("Main menu Top 5 load failed:", e);
      if (mainLbHint) mainLbHint.classList.remove("hidden");
      restoreGuestTop5();
    }
  }

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
    if (avg) avg.textContent = `${Number(data.avgPercent ?? 0).toFixed(2)}%`;
    if (rank) {
      rank.textContent = "#—";
      try {
        // Compute rank from Top 100 sorted by avgPercent (desc)
        const qTop = query(collection(db, "users"), orderBy("avgPercent", "desc"), limit(100));
        const qs = await getDocs(qTop);
        let pos = 0;
        let found = false;
        qs.forEach((d) => {
          pos += 1;
          if (d.id === user.uid) found = pos;
        });
        rank.textContent = found ? `#${found}` : "#—";
      } catch (e) {
        console.warn("Rank compute failed:", e);
        rank.textContent = "#—";
      }
    }

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

  function forceGuestMode() {
    // Close any open modals
    if (modal) {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
    }
    if (profileModal) {
      profileModal.classList.add("hidden");
      profileModal.setAttribute("aria-hidden", "true");
    }

    // Re-enable page scroll
    document.body.style.overflow = "";

    // Flip UI panels
    setSignedInUI(false);

    // Optional: disable profile save button until signed in
    const saveBtn = document.getElementById("profile-save");
    if (saveBtn) saveBtn.disabled = true;
  }


  /* ===========================
     PROFILE MODAL (UI ONLY)
     =========================== */

  const profileBtn = document.getElementById("view-profile");
  const profileModal = document.getElementById("profile-modal");
  const profileClose = document.getElementById("profile-close");

  if (profileBtn && profileModal) {
    profileBtn.addEventListener("click", async () => {
      if (!isSignedIn()) {
        // Guests must sign in first
        openModal();
        return;
      }
      profileModal.classList.remove("hidden");
      profileModal.setAttribute("aria-hidden", "false");
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
    document.getElementById("signout") ||
    document.getElementById("signout-btn") ||
    document.getElementById("sign-out") ||
    document.querySelector("button[data-action='signout']");

  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
      } catch (e) {
        console.error("Sign out failed:", e);
      } finally {
        // Immediately reflect guest UI
        forceGuestMode();
        restoreGuestTop5();
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

      // Signed-in users: show REAL Top 5
      await loadMainMenuTop5FromFirestore();
    } else {
      forceGuestMode();

      // Guests: keep DEMO Top 5
      restoreGuestTop5();
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
let _gameEnded = false;

let _qgRetries = 0;
const _QG_MAX_RETRIES = 60; // ~6s at 100ms

function _getQuestionGenerator() {
  // questions.js defines a global QuestionGenerator (classic script)
  return window.QuestionGenerator;
}

function _generateQuestionOrNull(grade) {
  const QG = _getQuestionGenerator();
  if (!QG || typeof QG.generate !== "function") return null;
  return QG.generate(grade);
}

function startGameSession() {
  // Reset session state (important when replaying)
  score = 0;
  totalAttempted = 0;
  timeLeft = 60;
  _gameEnded = false;

  const grade = localStorage.getItem("aimIb_currentGrade") || "4";
  const td = document.getElementById("timer-display");
  if (td) td.innerText = timeLeft;
  updateScoreUI();
  _qgRetries = 0;
  loadNewQuestion(grade);

  timerInterval = setInterval(() => {
    timeLeft--;
    const td2 = document.getElementById("timer-display");
    if (td2) td2.innerText = timeLeft;

    // little “urgency” effect under 10s
    if (td2) {
      if (timeLeft <= 10) {
        td2.style.filter = "drop-shadow(0 8px 14px rgba(255,92,92,0.55))";
      } else {
        td2.style.filter = "";
      }
    }
    if (timeLeft <= 0) {
      timeLeft = 0;
      if (td2) td2.innerText = timeLeft;
      endGame();
    }
  }, 1000);
}

function loadNewQuestion(grade) {
  const q = _generateQuestionOrNull(grade);

  // If questions.js hasn't loaded yet (or failed), keep retrying briefly.
  if (!q) {
    _qgRetries++;

    const qt = document.getElementById("question-text");
    if (qt) {
      qt.innerText = _qgRetries <= 1
        ? "Loading questions…"
        : `Loading questions… (${_qgRetries})`;
    }

    if (_qgRetries <= _QG_MAX_RETRIES) {
      setTimeout(() => loadNewQuestion(grade), 100);
    } else {
      if (qt) qt.innerText = "Questions failed to load. Please refresh.";
      console.error("QuestionGenerator not available. Check that questions.js is loaded before app.js on pages/game.html");
    }
    return;
  }

  // Reset retry counter once we successfully load.
  _qgRetries = 0;

  currentQuestion = q;
  document.getElementById("question-text").innerText = currentQuestion.question;

  const optionsContainer = document.getElementById("options-container");
  if (!optionsContainer) {
    console.error("Missing #options-container on game page.");
    return;
  }
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

  const correctIndex = Number(currentQuestion.correctIndex);
  const correct = selectedIndex === correctIndex;

  if (correct) {
    score++;
    btnElement.classList.add("correct");
  } else {
    btnElement.classList.add("wrong");
    // also highlight the correct one quickly
    const correctBtn = buttons[correctIndex];
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
  const sd = document.getElementById("score-display");
  if (sd) sd.innerText = String(score);
}


async function endGame() {
  clearInterval(timerInterval);
  if (_gameEnded) return;
  _gameEnded = true;

  let percentage = 0;
  if (totalAttempted > 0) {
    percentage = Math.round((score / totalAttempted) * 100);
  }

  localStorage.setItem(
    "aimIb_lastSession",
    JSON.stringify({ score, attempted: totalAttempted, percentage })
  );

  // Update local average for guests and for quick UI (StorageManager is optional)
  try {
    if (window.StorageManager && typeof window.StorageManager.saveGameResult === "function") {
      window.StorageManager.saveGameResult(percentage);
    }
  } catch (e) {
    console.warn("StorageManager.saveGameResult failed:", e);
  }


  try {
    await commitRunToFirestore({ correct: score, attempted: totalAttempted });
  } catch (e) {
    console.error("commitRunToFirestore failed:", e);
  }

  const inPages = window.location.pathname.includes("/pages/");
  // From /pages/game.html -> results.html (same folder)
  // From /index.html -> pages/results.html
  window.location.href = inPages ? "results.html" : "pages/results.html";
}

/* ===========================
   RESULTS LOGIC
   =========================== */
function showResults() {
  const data = JSON.parse(localStorage.getItem("aimIb_lastSession"));
  const stats = (window.StorageManager && typeof window.StorageManager.getStats === "function")
    ? window.StorageManager.getStats()
    : { average: 0 };

  if (data) {
    document.getElementById("final-score").innerText = data.percentage + "%";
    document.getElementById("correct-count").innerText = data.score;
    document.getElementById("total-count").innerText = data.attempted;
    document.getElementById("new-average").innerText = stats.average + "%";
  }
}
