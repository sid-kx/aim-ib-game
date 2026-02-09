/*
  storage.js
  Local + Cloud (Firestore) stats manager.

  - Guests: keep using localStorage for the homepage average.
  - Signed-in users: ALSO persist stats to Firestore under users/{uid}.

  NOTE: This file is loaded as a module in index.html.
*/

import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const StorageManager = {
  KEY: "aimIbStats",

  // ===== Local (guest / homepage average) =====
  getStats() {
    const stored = localStorage.getItem(this.KEY);
    if (stored) return JSON.parse(stored);

    return {
      average: 0,
      gamesPlayed: 0,
      totalScoreSum: 0,
    };
  },

  saveGameResult(newPercentage) {
    // Keep the original behavior exactly (for guests + homepage average display)
    const stats = this.getStats();
    stats.gamesPlayed += 1;
    stats.totalScoreSum += Number(newPercentage) || 0;
    stats.average = Math.round(stats.totalScoreSum / stats.gamesPlayed);
    localStorage.setItem(this.KEY, JSON.stringify(stats));

    // NOTE: Do NOT sync to Firestore from here.
    // Firestore stats are committed exactly once per finished game from the game logic
    // (e.g., in app.js via commitRunToFirestore / StorageManager.saveRun with correct/attempted).
  },

  // ===== Cloud (signed-in) =====
  // Preferred API for the real leaderboard ranking.
  // Pass correct/attempted and percent at end-of-game ONLY (one call per finished game).
  async saveRun({ correct = null, attempted = null, percent = null } = {}) {
    const user = auth.currentUser;
    if (!user) return; // guest

    const ref = doc(db, "users", user.uid);

    // Ensure doc exists
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        username: user.displayName || "AimPlayer",
        gamesPlayed: 0,
        totalCorrect: 0,
        totalAttempted: 0,
        avgCorrectPerGame: 0,
        avgPercent: 0,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        lastPlayedAt: serverTimestamp(),
      });
    }

    await runTransaction(db, async (tx) => {
      const s = await tx.get(ref);
      const d = s.exists() ? s.data() : {};

      const gamesPlayed = Number(d.gamesPlayed || 0) + 1;

      // If the game provides correct/attempted, use them.
      // Otherwise, keep totals unchanged but still track avgPercent.
      const addCorrect = correct == null ? 0 : Number(correct) || 0;
      const addAttempted = attempted == null ? 0 : Number(attempted) || 0;

      const totalCorrect = Number(d.totalCorrect || 0) + addCorrect;
      const totalAttempted = Number(d.totalAttempted || 0) + addAttempted;

      const avgCorrectPerGame = gamesPlayed > 0 ? totalCorrect / gamesPlayed : 0;

      // Track an average percent as well (useful for your homepage "average grade")
      const prevAvgPercent = Number(d.avgPercent || 0);
      const pct = percent == null ? null : Number(percent);
      // Average the per-game percent values (running mean)
      const avgPercent = pct == null
        ? prevAvgPercent
        : ((prevAvgPercent * (gamesPlayed - 1)) + pct) / gamesPlayed;

      tx.set(
        ref,
        {
          gamesPlayed,
          totalCorrect,
          totalAttempted,
          avgCorrectPerGame: Number(avgCorrectPerGame.toFixed(2)),
          avgPercent: Number(avgPercent.toFixed(2)),
          lastPlayedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });
  },

  // Optional helper to fetch current cloud stats (for profile modal/leaderboard)
  async getCloudStats() {
    const user = auth.currentUser;
    if (!user) return null;
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  },
};

// Keep backward compatibility for existing code that expects a global.
window.StorageManager = StorageManager;
export { StorageManager };