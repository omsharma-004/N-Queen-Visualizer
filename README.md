# ♛ Interactive N-Queens Visualizer

Watch recursive backtracking unfold in real time through animated queen placements, conflict detection, and live backtracking.

![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat&logo=react&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-gold)
![Status](https://img.shields.io/badge/status-active-brightgreen)

---

## ✨ Features

- **Live board visualization** — see queens placed, conflicts flash red, and correct positions glow green in real time
- **Step-by-step log** — every algorithm action (place, conflict, backtrack, solved) is logged with chess coordinates
- **Adjustable speed** — Slow / Normal / Fast / Instant modes to control the visualization pace
- **Solve & Stop** — start the solver or interrupt it mid-run at any time
- **Board sizes 1–14** — works for any N from 1 to 14
- **Animated UI** — floating crown, particle background, pulse animations on solve
- **Responsive** — works on desktop and mobile screens

---

## 🌐 Live Demo

[Try the Visualizer](https://n-queen-visualizer-cdph.vercel.app/)

---

## 🧠 How It Works

The solver uses **recursive backtracking**:

1. Start at row 0 and try placing a queen in each column
2. Check whether the position is safe
3. If safe, recursively move to the next row
4. If no valid position exists, backtrack and try another column
5. Repeat until all queens are placed successfully

**Time Complexity:** O(N!) in the worst case  
**Space Complexity:** Depends on board representation and recursive state tracking

---

## ⚡ Challenges

Animating recursive backtracking in React required synchronizing recursive solver execution with controlled UI state updates and delays to ensure smooth visualization without blocking renders.

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/omsharma-004/N-Queen-Visualizer.git

# Navigate into the project
cd N-Queen-Visualizer

# Install dependencies
npm install

# Start development server
npm run dev
```

Open:

```txt
http://localhost:5173
```

in your browser.

---

## 🏗️ Production Build

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

---

## 🗂️ Project Structure

```text
N-Queen-Visualizer/
├── public/
├── src/
│   ├── App.jsx
│   ├── NQueens.jsx
│   ├── main.jsx
│   └── assets/
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-------------|
| Framework | React 18 |
| Bundler | Vite |
| Styling | CSS + Inline Styling |
| Animation | CSS Keyframes + React State Transitions |
| Algorithm | Recursive Backtracking |

---

## 🎨 UI Highlights

- **Dark luxury theme** — deep `#060810` background with gold accents
- **Particle background** — animated floating particles for visual depth
- **Chess coordinate labels** — columns A–N and rows 1–N
- **Color-coded states**  
  - Gold → active queen  
  - Green → valid placement  
  - Red → conflict detection  
  - Purple → backtracking logs
- **Responsive board scaling** based on board size

---

## 📖 The N-Queens Problem

The N-Queens puzzle asks:

> How can N chess queens be placed on an N×N chessboard so that no two queens attack each other?

A queen attacks horizontally, vertically, and diagonally.

For the classic 8×8 board, there are **92 distinct solutions**.

This visualizer finds a valid solution using recursive backtracking while displaying every placement, conflict, and backtrack in real time.

---

## 🤝 Contributing

Contributions are welcome.

```bash
# Fork the repository
git checkout -b feature/your-feature

# Commit changes
git commit -m "Add feature"

# Push changes
git push origin feature/your-feature
```

Then open a Pull Request.

---

## 📄 License

MIT © [Om Sharma](https://github.com/omsharma-004)

---

<div align="center">
  <sub>Built with ♛ by Om Sharma</sub>
</div>
