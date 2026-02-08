

// Aim-IB — Top 100 Leaderboard (Firestore)
// Renders users ordered by avgCorrectPerGame desc into #lb-body.

import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function medalClass(rank) {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "";
}

async function renderTop100FromFirestore() {
  const body = document.getElementById("lb-body");
  if (!body) return;

  // Loading state
  body.innerHTML = `
    <div class="lb-row" role="row" style="grid-template-columns: 1fr; justify-items:center;">
      <div class="lb-cell" role="cell" style="white-space:normal; text-align:center;">
        Loading leaderboard...
      </div>
    </div>
  `;

  try {
    // Order by avgCorrectPerGame (2 decimals stored as number) then gamesPlayed as a tiebreaker.
    const q = query(
      collection(db, "users"),
      orderBy("avgCorrectPerGame", "desc"),
      orderBy("gamesPlayed", "desc"),
      limit(100)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      body.innerHTML = `
        <div class="lb-row" role="row" style="grid-template-columns: 1fr; justify-items:center;">
          <div class="lb-cell" role="cell" style="white-space:normal; text-align:center;">
            No ranked players yet. Be the first to sign in and play!
          </div>
        </div>
      `;
      return;
    }

    const rows = [];
    let rank = 0;

    snap.forEach((docSnap) => {
      const d = docSnap.data() || {};
      // Only include users who have actually played at least 1 game.
      const games = Number(d.gamesPlayed || 0);
      if (games <= 0) return;

      rank += 1;

      const username = escapeHtml(d.username || "AimPlayer");
      const avg = Number(d.avgCorrectPerGame || 0).toFixed(2);
      const totalCorrect = Number(d.totalCorrect || 0);

      rows.push({ rank, username, avg, totalCorrect, games });
    });

    if (rows.length === 0) {
      body.innerHTML = `
        <div class="lb-row" role="row" style="grid-template-columns: 1fr; justify-items:center;">
          <div class="lb-cell" role="cell" style="white-space:normal; text-align:center;">
            No ranked players yet. Play at least 1 game after signing in.
          </div>
        </div>
      `;
      return;
    }

    body.innerHTML = rows
      .map((p) => {
        const medal = medalClass(p.rank);
        return `
          <div class="lb-row ${medal}" role="row">
            <div class="lb-cell" role="cell">${p.rank}</div>
            <div class="lb-cell" role="cell">${p.username}</div>
            <div class="lb-cell" role="cell"><strong>${p.avg}</strong></div>
            <div class="lb-cell" role="cell">${p.totalCorrect}</div>
            <div class="lb-cell" role="cell">${p.games}</div>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    console.error("Leaderboard load failed:", err);
    body.innerHTML = `
      <div class="lb-row" role="row" style="grid-template-columns: 1fr; justify-items:center;">
        <div class="lb-cell" role="cell" style="white-space:normal; text-align:center;">
          Leaderboard couldn’t load. Make sure Firestore rules allow read access.
        </div>
      </div>
    `;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderTop100FromFirestore);
} else {
  renderTop100FromFirestore();
}