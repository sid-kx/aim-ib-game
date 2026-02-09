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
    // Primary query: order by avgCorrectPerGame (fast + server-side sorting).
    // If this fails (e.g., rules/index issues), we fall back to a simple collection read.
    let snap;

    try {
      const q = query(
        collection(db, "users"),
        orderBy("avgCorrectPerGame", "desc"),
        limit(200)
      );

      snap = await getDocs(q);
    } catch (primaryErr) {
      console.warn("Primary leaderboard query failed; falling back to unsorted read:", primaryErr);

      // Fallback: no orderBy (avoids any index/orderBy-related problems).
      // We sort client-side below.
      const qFallback = query(collection(db, "users"), limit(500));
      snap = await getDocs(qFallback);
    }

    // Collect all candidates first, then sort with a deterministic tiebreak.
    const players = [];

    snap.forEach((docSnap) => {
      const d = docSnap.data() || {};
      const games = Number(d.gamesPlayed || 0);
      if (games <= 0) return; // only rank players who have played

      const username = escapeHtml(d.username || "AimPlayer");
      const avgNum = Number(d.avgCorrectPerGame || 0);
      const avg = avgNum.toFixed(2);
      const totalCorrect = Number(d.totalCorrect || 0);

      players.push({ username, avgNum, avg, totalCorrect, games });
    });

    if (players.length === 0) {
      body.innerHTML = `
        <div class="lb-row" role="row" style="grid-template-columns: 1fr; justify-items:center;">
          <div class="lb-cell" role="cell" style="white-space:normal; text-align:center;">
            No ranked players yet. Play at least 1 game after signing in.
          </div>
        </div>
      `;
      return;
    }

    // Sort: avgCorrectPerGame desc, then gamesPlayed desc, then username asc.
    players.sort((a, b) => {
      if (b.avgNum !== a.avgNum) return b.avgNum - a.avgNum;
      if (b.games !== a.games) return b.games - a.games;
      return a.username.localeCompare(b.username);
    });

    const rows = players.slice(0, 100).map((p, idx) => ({
      rank: idx + 1,
      username: p.username,
      avg: p.avg,
      totalCorrect: p.totalCorrect,
      games: p.games,
    }));

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
    const code = err?.code ? String(err.code) : "unknown";
    const msg = err?.message ? String(err.message) : String(err);
    const details = `${code}: ${msg}`;

    const isIndex = msg.toLowerCase().includes("index") || msg.toLowerCase().includes("indexes");
    const isPerm = code.includes("permission") || msg.toLowerCase().includes("insufficient permissions");

    let hint = "";
    if (isPerm) {
      hint = "Firestore rules must allow read access to /users.";
    } else if (isIndex) {
      hint = "This query needs a Firestore index. Open the browser console, click the index link, and create it.";
    } else {
      hint = "Open DevTools → Console for details.";
    }

    body.innerHTML = `
      <div class="lb-row" role="row" style="grid-template-columns: 1fr; justify-items:center;">
        <div class="lb-cell" role="cell" style="white-space:normal; text-align:center;">
          Leaderboard couldn’t load.<br/>
          <span style="opacity:.9; font-size:.95em;">${escapeHtml(details)}</span><br/>
          <span style="opacity:.9; font-size:.95em;">${escapeHtml(hint)}</span>
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