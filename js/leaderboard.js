

// Aim-IB — Top 100 Leaderboard (UI-only)
// This file generates 100 fake players and renders them into #lb-body.

(function () {
  const seedNames = [
    "AimMaster","IBWizard","MathPro","FastCalc","AlphaIB","VectorKid","RatioRacer","GeoGenius","NumberNinja","ProofPal",
    "CalcSpark","LogicLion","MYPBoss","PrimePanda","AngleAce","FractionFox","SigmaKid","GraphGuru","DataDuke","KiteKing"
  ];

  function makePlayer(i) {
    const base = seedNames[i % seedNames.length];
    const suffix = (i + 7) * 3;
    const username = `${base}${suffix}`;

    // games 8–42
    const games = 8 + (i * 7) % 35;

    // avg correct/game: 93.88 down toward ~62.xx
    const avg = Math.max(62.10, 93.88 - i * 0.32);

    // total correct roughly proportional
    const totalCorrect = Math.round(avg * games);

    return {
      rank: i + 1,
      username,
      avg: avg.toFixed(2),
      totalCorrect,
      games
    };
  }

  function renderTop100() {
    const body = document.getElementById("lb-body");
    if (!body) return;

    const rows = Array.from({ length: 100 }, (_, i) => makePlayer(i));

    body.innerHTML = rows
      .map((p) => {
        const medal = p.rank === 1 ? "gold" : p.rank === 2 ? "silver" : p.rank === 3 ? "bronze" : "";
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderTop100);
  } else {
    renderTop100();
  }
})();