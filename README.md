# Aim-IB 🎯  
A single-player **IB-style math speed game** for **Grade 4–5** students preparing for IB middle school entry.

## ✨ What it is
Aim-IB is a fast-paced 60-second math “speed run” where students try to answer as many questions as possible with high accuracy. After each run, the game calculates a score (%) and updates the player’s overall average.

## 🎮 How to Play
1. Choose a grade (**4** or **5**) on the main menu  
2. Click **Start Game**  
3. Answer questions as fast as you can for **60 seconds**  
4. Your score is the **% correct** (rounded)  
5. Your **overall average** updates after every game  

## 🧠 Question Topics
### Grade 4
- Addition / subtraction  
- Multiplication (up to 12×12)  
- Division basics  
- Place value + rounding  
- Simple word problems  

### Grade 5
- Multi-digit multiplication  
- Long division  
- Fractions + decimals  
- Mixed operations  
- Two-step word problems  

## ✅ Scoring
- **Score (%)** = `(correct ÷ attempted) × 100`  
- Rounded to the nearest whole number  
- Average is stored locally in the browser (LocalStorage)

## 📁 Project Structure
```txt
aim-ib-game/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── questions.js
│   ├── storage.js
│   └── bg.js
└── pages/
    ├── game.html
    └── results.html
