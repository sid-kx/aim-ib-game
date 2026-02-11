# Aim-IB — Math Speed Run Game

**Aim-IB** is a fast-paced, IB-inspired math speed-run game designed to help students improve accuracy, speed, and confidence under pressure.  
Players race against the clock, answer math questions, and compete on a global leaderboard.

Built with a modern glass-UI, Firebase authentication, and real-time leaderboard data.

🌐 **Live Site:** https://aim-ib.com  
📦 **Repository:** https://github.com/sid-kx/aim-ib-game


## Features

- ⏱ **60-second math speed runs**
- 🎓 **Grade-based questions (Grades 4–8)**
- 🔐 **Google Sign-In (Firebase Auth)**
- 🧠 **Smart accuracy tracking**
- 📊 **Persistent player stats**
- 🏆 **Real-time Top 100 leaderboard (Firestore)**
- 👤 **Player profile with averages & history**
- 👀 **Guest mode (play without signing in)**
- ✨ **Modern glassmorphism UI**
- ♿ **Keyboard-friendly & accessible UI**


## How to Play

1. Pick a grade (4–8)
2. Press **Start Game**
3. Answer as many questions as you can in **60 seconds**
4. Your score and accuracy are saved automatically
5. Climb the leaderboard 🚀

> Tip: Don’t overthink — speed + accuracy wins.


## Scoring & Averages

- **Game Accuracy (%)** =  
  `correct answers ÷ questions attempted × 100`

- **Overall Average** =  
  Average of all *game accuracy percentages* (not total questions)

This keeps the leaderboard fair and skill-based.


## Leaderboard Logic

- Leaderboard ranks players by **average accuracy**
- Only **signed-in users** appear on the real leaderboard
- Guests see a preview leaderboard (UI demo)
- Data is stored securely in **Firebase Firestore**


## Tech Stack

- **Frontend:** HTML, CSS (Glass UI), Vanilla JavaScript
- **Backend:** Firebase
  - Firebase Authentication (Google Sign-In)
  - Cloud Firestore (player stats & leaderboard)
- **Hosting:** GitHub Pages + Custom Domain


## Security

- Firestore rules ensure:
  - Public read access for leaderboard
  - Write access only for authenticated users
  - Users can only modify their own stats


## Local Development

1. Clone the repo:
   ```bash
   git clone https://github.com/sid-kx/aim-ib-game.git
2.	Open index.html in your browser
(Firebase features require hosting or a local server)


🧠 Future Improvements
	•	More grades & question types
	•	Difficulty scaling
	•	Daily challenges
	•	Streaks & achievements
	•	Classroom / teacher dashboards


## Credits

Made by Sidhant Kamboj
Grade 12 | Ontario | Computer Science & Entrepreneurship


## License


MIT License — free to use, modify, and learn from.


