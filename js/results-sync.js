// js/results-sync.js
import { auth, db } from "./firebase.js";
import {
  doc,
  runTransaction,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ---- IMPORTANT ----
// Update these keys to match what your game stores in localStorage.
// If your storage.js uses different key names, change them here.
const LS_CORRECT = "aimib_correct";
const LS_ATTEMPTED = "aimib_attempted";

function readInt(key) {
  const v = Number(localStorage.getItem(key));
  return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
}

async function saveRunToFirestore(user) {
  const correctThisRun = readInt(LS_CORRECT);
  const attemptedThisRun = readInt(LS_ATTEMPTED);

  // If nothing to save, skip.
  if (attemptedThisRun === 0 && correctThisRun === 0) return;

  const userRef = doc(db, "users", user.uid);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    const prev = snap.exists() ? snap.data() : {};

    const prevGames = Number(prev.gamesPlayed || 0);
    const prevTotalCorrect = Number(prev.totalCorrect || 0);

    const newGames = prevGames + 1;
    const newTotalCorrect = prevTotalCorrect + correctThisRun;

    const newAvg = newGames > 0 ? newTotalCorrect / newGames : 0;

    // Keep existing username if already set; otherwise use displayName/email.
    const username =
      (prev.username && String(prev.username).trim()) ||
      (user.displayName && String(user.displayName).trim()) ||
      (user.email ? String(user.email).split("@")[0] : "AimPlayer");

    tx.set(
      userRef,
      {
        username,
        gamesPlayed: newGames,
        totalCorrect: newTotalCorrect,
        avgCorrectPerGame: Number(newAvg.toFixed(4)), // store as number
        lastGameAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

auth.onAuthStateChanged(async (user) => {
  try {
    if (!user) return;

    // Save once per results page load (avoid double-saving on refresh)
    const runId = localStorage.getItem("aimib_run_id");
    if (!runId) return;

    const alreadySaved = sessionStorage.getItem(`saved_${runId}`) === "1";
    if (alreadySaved) return;

    await saveRunToFirestore(user);

    sessionStorage.setItem(`saved_${runId}`, "1");
  } catch (e) {
    console.error("Failed to save run to Firestore:", e);
  }
});