/*
    questions.js - Question Generator
    Generates random math questions based on Grade level.
    Returns object format: { question: "1 + 1", options: [1, 2, 3, 4], correctIndex: 1 }
*/

const QuestionGenerator = {

    generate: function(grade) {
        if (grade == "4") {
            return this.getGrade4Question();
        } else {
            return this.getGrade5Question();
        }
    },

    getRandomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Helper to shuffle options array so the answer isn't always in the same spot
    shuffleOptions: function(correctAnswer, wrong1, wrong2, wrong3) {
        const options = [correctAnswer, wrong1, wrong2, wrong3];
        // Simple shuffle
        options.sort(() => Math.random() - 0.5);
        // Find where the correct answer ended up
        const correctIndex = options.indexOf(correctAnswer);
        return { options, correctIndex };
    },

    getGrade4Question: function() {
        // Randomly pick a question type: 0=Add, 1=Sub, 2=Mul, 3=Div, 4=Rounding
        const type = this.getRandomInt(0, 4);
        let qText = "";
        let ans = 0;

        if (type === 0) { // Addition
            const a = this.getRandomInt(10, 99);
            const b = this.getRandomInt(10, 99);
            qText = `${a} + ${b} = ?`;
            ans = a + b;
        } else if (type === 1) { // Subtraction
            const a = this.getRandomInt(50, 150);
            const b = this.getRandomInt(10, 50);
            qText = `${a} - ${b} = ?`;
            ans = a - b;
        } else if (type === 2) { // Multiplication (up to 12x12)
            const a = this.getRandomInt(2, 12);
            const b = this.getRandomInt(2, 12);
            qText = `${a} × ${b} = ?`;
            ans = a * b;
        } else if (type === 3) { // Division (Clean numbers)
            const b = this.getRandomInt(2, 10);
            const a = b * this.getRandomInt(2, 10); // Ensure 'a' is divisible by 'b'
            qText = `${a} ÷ ${b} = ?`;
            ans = a / b;
        } else { // Rounding
            const num = this.getRandomInt(101, 999);
            qText = `Round ${num} to nearest 10`;
            ans = Math.round(num / 10) * 10;
        }

        // Generate wrong answers relative to the real answer
        const w1 = ans + this.getRandomInt(1, 5);
        const w2 = ans - this.getRandomInt(1, 5);
        const w3 = ans + 10;

        const { options, correctIndex } = this.shuffleOptions(ans, w1, w2, w3);

        return {
            question: qText,
            options: options,
            correctIndex: correctIndex
        };
    },

    getGrade5Question: function() {
        // Types: 0=Multi-digit Mul, 1=Fractions, 2=Decimals, 3=Area
        const type = this.getRandomInt(0, 3);
        let qText = "";
        let ans = 0; // Can be string or number

        if (type === 0) { // Multi-digit Multiplication
            const a = this.getRandomInt(12, 25);
            const b = this.getRandomInt(10, 20);
            qText = `${a} × ${b} = ?`;
            ans = a * b;
            
            // Wrong answers
            var w1 = ans + 10;
            var w2 = ans - 10;
            var w3 = ans + this.getRandomInt(1, 9);
        } 
        else if (type === 1) { // Simple Fractions (Same denominator addition)
            const den = this.getRandomInt(3, 9);
            const num1 = 1;
            const num2 = 1;
            qText = `${num1}/${den} + ${num2}/${den} = ?`;
            ans = `${num1 + num2}/${den}`;
            
            var w1 = `${num1 + num2 + 1}/${den}`;
            var w2 = `${num1}/${den}`;
            var w3 = `1`;
        } 
        else if (type === 2) { // Decimals addition
            const a = (this.getRandomInt(10, 90) / 10); // e.g. 4.5
            const b = (this.getRandomInt(10, 90) / 10);
            qText = `${a} + ${b} = ?`;
            ans = (a + b).toFixed(1); // Keep decimal fixed
            
            // Generate wrong answers (parsed as Float to do math, then fixed)
            var w1 = (parseFloat(ans) + 0.1).toFixed(1);
            var w2 = (parseFloat(ans) - 1.0).toFixed(1);
            var w3 = (parseFloat(ans) + 10).toFixed(1);
        }
        else { // Area of Rectangle
            const w = this.getRandomInt(5, 12);
            const h = this.getRandomInt(5, 12);
            qText = `Area of rect: ${w}cm by ${h}cm?`;
            ans = w * h;
            
            var w1 = (w * h) + w;
            var w2 = (w + h) * 2; // Perimeter trap
            var w3 = w * h - 5;
        }

        const { options, correctIndex } = this.shuffleOptions(ans, w1, w2, w3);

        return {
            question: qText,
            options: options,
            correctIndex: correctIndex
        };
    }
};