/*
    storage.js - LocalStorage Manager
    Handles saving and retrieving the average score.
*/

const StorageManager = {
    KEY: 'aimIbStats',

    // Initialize or Retrieve stats
    getStats: function() {
        const stored = localStorage.getItem(this.KEY);
        if (stored) {
            return JSON.parse(stored);
        } else {
            // Default start
            return {
                average: 0,
                gamesPlayed: 0,
                totalScoreSum: 0
            };
        }
    },

    // Update Average logic
    saveGameResult: function(newPercentage) {
        let stats = this.getStats();

        stats.gamesPlayed += 1;
        stats.totalScoreSum += newPercentage;
        
        // Calculate new average (Rounded)
        stats.average = Math.round(stats.totalScoreSum / stats.gamesPlayed);

        localStorage.setItem(this.KEY, JSON.stringify(stats));
    }
};