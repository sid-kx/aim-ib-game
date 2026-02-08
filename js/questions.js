/*
    questions.js - Question Generator
    Generates random math questions based on Grade level.
    Returns object format: { question: "1 + 1", options: ["1", "2", "3", "4"], correctIndex: 1 }

    Grades supported:
      - 4: foundational arithmetic + rounding
      - 5: multi-digit ops + fractions/decimals + area
      - 6–8: MYP/IB-style (number, algebra, geometry, data/probability)
*/

const QuestionGenerator = {

  generate: function (grade) {
    const g = String(grade);
    if (g === "4") return this.getGrade4Question();
    if (g === "5") return this.getGrade5Question();
    if (g === "6") return this.getGrade6Question();
    if (g === "7") return this.getGrade7Question();
    // default to Grade 8 if anything else
    return this.getGrade8Question();
  },

  getRandomInt: function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // inclusive random choice
  pick: function (arr) {
    return arr[(Math.random() * arr.length) | 0];
  },

  // Helper to shuffle options array so the answer isn't always in the same spot
  shuffleOptions: function (correctAnswer, wrong1, wrong2, wrong3) {
    // Use strings for UI consistency
    const c = String(correctAnswer);
    const options = [c, String(wrong1), String(wrong2), String(wrong3)];
    options.sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(c);
    return { options, correctIndex };
  },

  // Helpers for fractions
  gcd: function (a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  },

  simplifyFraction: function (num, den) {
    const g = this.gcd(num, den);
    return { num: num / g, den: den / g };
  },

  fracToString: function (num, den) {
    if (den === 1) return String(num);
    return `${num}/${den}`;
  },

  // ============================
  // Grade 4
  // ============================
  getGrade4Question: function () {
    // Randomly pick a question type: 0=Add, 1=Sub, 2=Mul, 3=Div, 4=Rounding
    const type = this.getRandomInt(0, 4);
    let qText = "";
    let ans = 0;

    if (type === 0) {
      const a = this.getRandomInt(10, 99);
      const b = this.getRandomInt(10, 99);
      qText = `${a} + ${b} = ?`;
      ans = a + b;
    } else if (type === 1) {
      const a = this.getRandomInt(50, 150);
      const b = this.getRandomInt(10, 50);
      qText = `${a} - ${b} = ?`;
      ans = a - b;
    } else if (type === 2) {
      const a = this.getRandomInt(2, 12);
      const b = this.getRandomInt(2, 12);
      qText = `${a} × ${b} = ?`;
      ans = a * b;
    } else if (type === 3) {
      const b = this.getRandomInt(2, 10);
      const a = b * this.getRandomInt(2, 10);
      qText = `${a} ÷ ${b} = ?`;
      ans = a / b;
    } else {
      const num = this.getRandomInt(101, 999);
      qText = `Round ${num} to nearest 10`;
      ans = Math.round(num / 10) * 10;
    }

    const w1 = ans + this.getRandomInt(1, 5);
    const w2 = ans - this.getRandomInt(1, 5);
    const w3 = ans + 10;

    const { options, correctIndex } = this.shuffleOptions(ans, w1, w2, w3);

    return { question: qText, options, correctIndex };
  },

  // ============================
  // Grade 5
  // ============================
  getGrade5Question: function () {
    // Types: 0=Multi-digit Mul, 1=Fractions, 2=Decimals, 3=Area
    const type = this.getRandomInt(0, 3);
    let qText = "";
    let ans;
    let w1, w2, w3;

    if (type === 0) {
      const a = this.getRandomInt(12, 25);
      const b = this.getRandomInt(10, 20);
      qText = `${a} × ${b} = ?`;
      ans = a * b;
      w1 = ans + 10;
      w2 = ans - 10;
      w3 = ans + this.getRandomInt(1, 9);
    } else if (type === 1) {
      const den = this.getRandomInt(3, 9);
      const num1 = 1;
      const num2 = 1;
      qText = `${num1}/${den} + ${num2}/${den} = ?`;
      ans = `${num1 + num2}/${den}`;
      w1 = `${num1 + num2 + 1}/${den}`;
      w2 = `${num1}/${den}`;
      w3 = `1`;
    } else if (type === 2) {
      const a = this.getRandomInt(10, 90) / 10;
      const b = this.getRandomInt(10, 90) / 10;
      qText = `${a.toFixed(1)} + ${b.toFixed(1)} = ?`;
      ans = (a + b).toFixed(1);
      w1 = (parseFloat(ans) + 0.1).toFixed(1);
      w2 = (parseFloat(ans) - 1.0).toFixed(1);
      w3 = (parseFloat(ans) + 1.0).toFixed(1);
    } else {
      const w = this.getRandomInt(5, 12);
      const h = this.getRandomInt(5, 12);
      qText = `Area of rectangle: ${w}cm by ${h}cm?`;
      ans = w * h;
      w1 = ans + w;
      w2 = (w + h) * 2; // perimeter trap
      w3 = ans - 5;
    }

    const { options, correctIndex } = this.shuffleOptions(ans, w1, w2, w3);
    return { question: qText, options, correctIndex };
  },

  // ============================
  // Grade 6 (MYP-style)
  // ============================
  getGrade6Question: function () {
    // Types: 0=Order of Ops, 1=Ratio, 2=Percent of number, 3=Coordinate distance (axis-aligned), 4=Mean
    const type = this.getRandomInt(0, 4);
    let qText = "";
    let ans;
    let w1, w2, w3;

    if (type === 0) {
      // Order of operations: a + b × c
      const a = this.getRandomInt(2, 18);
      const b = this.getRandomInt(2, 12);
      const c = this.getRandomInt(2, 12);
      qText = `Evaluate: ${a} + ${b} × ${c}`;
      ans = a + b * c;
      w1 = (a + b) * c; // wrong brackets
      w2 = a + b + c;
      w3 = a + b * (c - 1);
    } else if (type === 1) {
      // Ratio: simplify a:b
      const k = this.getRandomInt(2, 6);
      const r1 = this.getRandomInt(2, 9);
      const r2 = this.getRandomInt(2, 9);
      const a = r1 * k;
      const b = r2 * k;
      qText = `Simplify the ratio ${a}:${b}`;
      const g = this.gcd(a, b);
      ans = `${a / g}:${b / g}`;
      w1 = `${a}:${b}`;
      w2 = `${(a / k)}:${(b / k + 1)}`;
      w3 = `${(a / g)}:${(b / g) + 1}`;
    } else if (type === 2) {
      // Percent of number
      const percent = this.pick([10, 15, 20, 25, 30, 40, 50]);
      const base = this.pick([40, 60, 80, 120, 160, 200]);
      qText = `Find ${percent}% of ${base}`;
      ans = (percent / 100) * base;
      w1 = base + ans;
      w2 = base - ans;
      w3 = (percent * base); // forgot /100
    } else if (type === 3) {
      // Distance on a grid (axis-aligned only)
      const x1 = this.getRandomInt(-6, 6);
      const x2 = this.getRandomInt(-6, 6);
      const y = this.getRandomInt(-6, 6);
      qText = `On a grid, what is the distance between (${x1}, ${y}) and (${x2}, ${y})?`;
      ans = Math.abs(x2 - x1);
      w1 = Math.abs(x2 + x1);
      w2 = ans + 1;
      w3 = Math.max(0, ans - 1);
    } else {
      // Mean of 4 numbers
      const a = this.getRandomInt(4, 20);
      const b = this.getRandomInt(4, 20);
      const c = this.getRandomInt(4, 20);
      const d = this.getRandomInt(4, 20);
      qText = `Find the mean of ${a}, ${b}, ${c}, ${d}`;
      ans = (a + b + c + d) / 4;
      // Keep one decimal if needed
      ans = Number.isInteger(ans) ? ans : ans.toFixed(1);
      const ansNum = parseFloat(ans);
      w1 = Number.isInteger(ansNum + 1) ? ansNum + 1 : (ansNum + 1).toFixed(1);
      w2 = Number.isInteger(ansNum - 1) ? ansNum - 1 : (ansNum - 1).toFixed(1);
      w3 = Number.isInteger(ansNum + 0.5) ? ansNum + 0.5 : (ansNum + 0.5).toFixed(1);
    }

    const { options, correctIndex } = this.shuffleOptions(ans, w1, w2, w3);
    return { question: qText, options, correctIndex };
  },

  // ============================
  // Grade 7 (MYP-style)
  // ============================
  getGrade7Question: function () {
    // Types: 0=One-step equation, 1=Fraction multiply, 2=Percent increase, 3=Angles on a line, 4=Probability
    const type = this.getRandomInt(0, 4);
    let qText = "";
    let ans;
    let w1, w2, w3;

    if (type === 0) {
      // Solve ax + b = c
      const a = this.pick([2, 3, 4, 5, 6]);
      const x = this.getRandomInt(2, 15);
      const b = this.getRandomInt(-10, 10);
      const c = a * x + b;
      const bText = b >= 0 ? ` + ${b}` : ` - ${Math.abs(b)}`;
      qText = `Solve: ${a}x${bText} = ${c}`;
      ans = x;
      w1 = x + 1;
      w2 = x - 1;
      w3 = Math.max(0, x + this.pick([2, 3]));
    } else if (type === 1) {
      // Multiply fractions and simplify
      const n1 = this.getRandomInt(2, 9);
      const d1 = this.getRandomInt(3, 12);
      const n2 = this.getRandomInt(2, 9);
      const d2 = this.getRandomInt(3, 12);
      const num = n1 * n2;
      const den = d1 * d2;
      const simp = this.simplifyFraction(num, den);
      qText = `Compute: ${n1}/${d1} × ${n2}/${d2}`;
      ans = this.fracToString(simp.num, simp.den);
      // wrong: multiply tops only / bottoms only / unsimplified
      w1 = this.fracToString(num, den);
      w2 = this.fracToString(n1 + n2, d1 + d2);
      w3 = this.fracToString(num, den + this.pick([1, 2]));
    } else if (type === 2) {
      // Percent increase
      const base = this.pick([40, 60, 80, 120, 150, 200]);
      const percent = this.pick([5, 10, 12, 15, 20, 25]);
      qText = `Increase ${base} by ${percent}%`;
      ans = base * (1 + percent / 100);
      ans = Number.isInteger(ans) ? ans : ans.toFixed(1);
      const ansNum = parseFloat(ans);
      w1 = base + percent; // add percent as number
      w2 = base * (percent / 100);
      w3 = Number.isInteger(ansNum - base) ? ansNum - base : (ansNum - base).toFixed(1);
    } else if (type === 3) {
      // Angles on a straight line
      const angle = this.getRandomInt(35, 145);
      qText = `Two angles form a straight line. One angle is ${angle}°. What is the other angle?`;
      ans = 180 - angle;
      w1 = 180 + angle;
      w2 = angle;
      w3 = 90 - (angle % 90);
    } else {
      // Probability (simple)
      const red = this.getRandomInt(1, 6);
      const blue = this.getRandomInt(1, 6);
      const green = this.getRandomInt(1, 6);
      const total = red + blue + green;
      qText = `A bag has ${red} red, ${blue} blue, and ${green} green counters. What is P(red)?`;
      const simp = this.simplifyFraction(red, total);
      ans = this.fracToString(simp.num, simp.den);
      const simpBlue = this.simplifyFraction(blue, total);
      const simpGreen = this.simplifyFraction(green, total);
      w1 = this.fracToString(simpBlue.num, simpBlue.den);
      w2 = this.fracToString(simpGreen.num, simpGreen.den);
      w3 = this.fracToString(total, red); // inverted
    }

    const { options, correctIndex } = this.shuffleOptions(ans, w1, w2, w3);
    return { question: qText, options, correctIndex };
  },

  // ============================
  // Grade 8 (MYP-style)
  // ============================
  getGrade8Question: function () {
    // Types: 0=Two-step equation, 1=Pythagoras (integer), 2=Linear pattern, 3=Volume, 4=Probability of two events
    const type = this.getRandomInt(0, 4);
    let qText = "";
    let ans;
    let w1, w2, w3;

    if (type === 0) {
      // Solve ax + b = c (harder range)
      const a = this.pick([2, 3, 4, 5, 6, 7]);
      const x = this.getRandomInt(2, 20);
      const b = this.getRandomInt(-20, 20);
      const c = a * x + b;
      const bText = b >= 0 ? ` + ${b}` : ` - ${Math.abs(b)}`;
      qText = `Solve: ${a}x${bText} = ${c}`;
      ans = x;
      w1 = x + this.pick([1, 2]);
      w2 = x - this.pick([1, 2]);
      w3 = Math.max(0, Math.round((c - b) / (a + 1))); // wrong divisor
    } else if (type === 1) {
      // Pythagoras with integer triples
      const triples = [
        { a: 3, b: 4, c: 5 },
        { a: 5, b: 12, c: 13 },
        { a: 6, b: 8, c: 10 },
        { a: 7, b: 24, c: 25 },
        { a: 9, b: 12, c: 15 },
      ];
      const t = this.pick(triples);
      const askFor = this.pick(["c", "a", "b"]);

      if (askFor === "c") {
        qText = `Right triangle: legs ${t.a} and ${t.b}. Find the hypotenuse.`;
        ans = t.c;
        w1 = t.a + t.b;
        w2 = t.c - 1;
        w3 = t.c + 1;
      } else if (askFor === "a") {
        qText = `Right triangle: hypotenuse ${t.c} and one leg ${t.b}. Find the other leg.`;
        ans = t.a;
        w1 = t.b;
        w2 = t.a + 1;
        w3 = Math.max(1, t.a - 1);
      } else {
        qText = `Right triangle: hypotenuse ${t.c} and one leg ${t.a}. Find the other leg.`;
        ans = t.b;
        w1 = t.a;
        w2 = t.b + 1;
        w3 = Math.max(1, t.b - 1);
      }
    } else if (type === 2) {
      // Linear pattern: nth term
      const d = this.pick([2, 3, 4, 5, 6]);
      const a1 = this.getRandomInt(1, 10);
      const n = this.getRandomInt(6, 15);
      const an = a1 + (n - 1) * d;
      qText = `A sequence starts ${a1}, ${a1 + d}, ${a1 + 2 * d}, ... What is term ${n}?`;
      ans = an;
      w1 = a1 + n * d; // off by one
      w2 = an - d;
      w3 = an + d;
    } else if (type === 3) {
      // Volume of rectangular prism
      const l = this.getRandomInt(4, 16);
      const w = this.getRandomInt(3, 12);
      const h = this.getRandomInt(3, 10);
      qText = `Volume of a prism: ${l}cm × ${w}cm × ${h}cm = ?`;
      ans = l * w * h;
      w1 = 2 * (l * w + l * h + w * h); // surface area trap
      w2 = l * w;
      w3 = ans - l;
    } else {
      // Probability of two events (without replacement)
      const red = this.getRandomInt(2, 7);
      const blue = this.getRandomInt(2, 7);
      const total = red + blue;
      qText = `A bag has ${red} red and ${blue} blue counters. Two are drawn without replacement. What is P(both red)?`;

      // P = (red/total) * ((red-1)/(total-1))
      const num = red * (red - 1);
      const den = total * (total - 1);
      const simp = this.simplifyFraction(num, den);
      ans = this.fracToString(simp.num, simp.den);

      const simpBothBlue = this.simplifyFraction(blue * (blue - 1), den);
      w1 = this.fracToString(simpBothBlue.num, simpBothBlue.den);

      const simpOneEach = this.simplifyFraction(red * blue * 2, den);
      w2 = this.fracToString(simpOneEach.num, simpOneEach.den);

      w3 = this.fracToString(red, total); // forgot second draw
    }

    const { options, correctIndex } = this.shuffleOptions(ans, w1, w2, w3);
    return { question: qText, options, correctIndex };
  }
};

// ----------------------------
// Exports / global fallback
// ----------------------------
// If the rest of the app uses ES modules, these exports allow:
//   import QuestionGenerator from "./questions.js";
//   import { QuestionGenerator } from "./questions.js";
export { QuestionGenerator };
export default QuestionGenerator;

// If any older script on the site expects a global (non-module) variable,
// expose it safely.
if (typeof window !== "undefined") {
  window.QuestionGenerator = QuestionGenerator;
}