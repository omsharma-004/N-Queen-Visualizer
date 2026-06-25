import { useState, useRef, useEffect } from "react";

/* ════════════════════════════════════════════════════════
   LOGIC  (original algorithm core, untouched — isSafe unchanged)
════════════════════════════════════════════════════════ */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const isSafe = (board, row, col) => {
  for (let i = 0; i < row; i++) {
    if (board[i][col]) return false;
    if (board[i][col - (row - i)] || board[i][col + (row - i)]) return false;
  }
  return true;
};

/* ════════════════════════════════════════════════════════
   CELL
════════════════════════════════════════════════════════ */
function Cell({ value, light, state, size }) {
  const [popped, setPopped] = useState(false);
  const prevVal = useRef(value);

  useEffect(() => {
    if (value === 1 && prevVal.current === 0) {
      setPopped(true);
      setTimeout(() => setPopped(false), 350);
    }
    prevVal.current = value;
  }, [value]);

  const bg = state === "correct"   ? "#cdeede"
           : state === "conflict"  ? "#fad2cd"
           : light                 ? "#fbf6ec"
           :                         "#e7dcc4";

  const queenColor = state === "correct"  ? "#2f8f5b"
                   : state === "conflict" ? "#c0392b"
                   : "#8a6314";

  return (
    <div style={{
      width: size, height: size,
      background: bg,
      borderRight:  "1px solid rgba(120,95,40,0.12)",
      borderBottom: "1px solid rgba(120,95,40,0.12)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.54,
      transition: "background 0.22s ease",
      position: "relative", overflow: "hidden",
      userSelect: "none",
    }}>
      {state === "correct" && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)",
          animation: "shimmerCell 1.4s infinite",
        }} />
      )}
      {value === 1 && (
        <span style={{
          lineHeight: 1,
          color: queenColor,
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))",
          display: "inline-block",
          transform: popped ? "scale(1.28) rotate(10deg)" : "scale(1) rotate(0deg)",
          transition: "transform 0.28s cubic-bezier(.34,1.56,.64,1)",
        }}>♛</span>
      )}
    </div>
  );
}

/* Static cell for the print report */
function PrintCell({ value, light, size }) {
  return (
    <div style={{
      width: size, height: size,
      background: light ? "#fbf6ec" : "#e7dcc4",
      border: "1px solid #c8961e",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.55,
      color: "#5A3E0C",
    }}>
      {value === 1 ? "♛" : ""}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   STEP LOG ITEM — now clickable, supports active highlight
════════════════════════════════════════════════════════ */
function StepItem({ step, idx, active, disabled, onSelect }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 30); return () => clearTimeout(t); }, []);

  const typeColor = step.type === "place"     ? "#a87c12"
                  : step.type === "conflict"  ? "#c0392b"
                  : step.type === "backtrack" ? "#7c5cb8"
                  : step.type === "solved"    ? "#2f8f5b"
                  :                             "#999";

  const icon = step.type === "place"     ? "↓"
             : step.type === "conflict"  ? "✕"
             : step.type === "backtrack" ? "↩"
             : step.type === "solved"    ? "✓"
             :                             "·";

  return (
    <div
      id={`step-${idx}`}
      onClick={() => { if (!disabled) onSelect(idx); }}
      style={{
        display: "flex", gap: 10, alignItems: "flex-start",
        padding: "7px 12px",
        background: active ? "rgba(200,150,30,0.16)" : visible ? "rgba(170,130,30,0.05)" : "transparent",
        borderLeft: `2px solid ${active ? "#c8961e" : typeColor}`,
        borderRadius: "0 8px 8px 0",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-12px)",
        transition: "opacity 0.22s ease, transform 0.22s ease, background 0.2s",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <span style={{ color: typeColor, fontFamily: "monospace", fontSize: "0.8rem", minWidth: 14, marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "rgba(120,95,40,0.45)", marginRight: 8 }}>
          #{String(idx + 1).padStart(3, "0")}
        </span>
        <span style={{ fontFamily: "monospace", fontSize: "0.76rem", color: typeColor, fontWeight: active ? 700 : 400 }}>
          {step.msg}
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN APP
════════════════════════════════════════════════════════ */
export default function NQueens() {
  const [inputVal, setInputVal] = useState("8");
  const [N, setN] = useState(8);

  const [board, setBoard] = useState(() => Array.from({ length: 8 }, () => Array(8).fill(0)));
  const [cellStates, setCellStates] = useState({});
  const [solved, setSolved] = useState(false);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [steps, setSteps] = useState(0);
  const [stepLog, setStepLog] = useState([]); // each entry also doubles as a history snapshot
  const [speed, setSpeed] = useState("normal");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [backtrackCount, setBacktrackCount] = useState(0);
  const [solutionBoard, setSolutionBoard] = useState(null);
  const [solutionCoords, setSolutionCoords] = useState([]);

  // ── Step navigation / replay ──
  const [reviewIndex, setReviewIndex] = useState(-1); // -1 = live mode (follow the running solver)

  const stopRef = useRef(false);
  const pausedRef = useRef(false);
  const stepsRef = useRef(0);
  const logRef = useRef([]);
  const logEndRef = useRef(null);
  const speedRef = useRef("normal");
  const hasSolvedOnceRef = useRef(false);
  const conflictRef = useRef(0);
  const backtrackRef = useRef(0);

  // ── Timer refs ──
  const startTimeRef = useRef(0);
  const totalPausedRef = useRef(0);
  const pauseStartRef = useRef(0);
  const timerIntervalRef = useRef(null);

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const speedMs = { slow: 600, normal: 260, fast: 60, instant: 5 };

  // history is just an alias over stepLog — every logged event already carries
  // a full board/cellStates/row/col snapshot, so the log IS the replay history.
  const history = stepLog;
  const inReview = !running && history.length > 0 && reviewIndex >= 0;
  const displayBoard = inReview ? history[reviewIndex].board : board;
  const displayCellStates = inReview ? history[reviewIndex].cellStates : cellStates;

  const resetBoard = (size) => {
    setBoard(Array.from({ length: size }, () => Array(size).fill(0)));
    setCellStates({});
    setSolved(false);
    setResultMsg("");
    setSteps(0);
    setStepLog([]);
    setElapsedMs(0);
    setConflictCount(0);
    setBacktrackCount(0);
    setSolutionBoard(null);
    setSolutionCoords([]);
    setPaused(false);
    setReviewIndex(-1); // clear navigation state
    stepsRef.current = 0;
    logRef.current = [];
    conflictRef.current = 0;
    backtrackRef.current = 0;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  // auto-scroll the log to the latest entry while solving is actually live
  useEffect(() => {
    if (!hasSolvedOnceRef.current) return;
    if (running && logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [stepLog, running]);

  // auto-scroll the log to the active reviewed entry when navigating
  useEffect(() => {
    if (reviewIndex < 0) return;
    const el = document.getElementById(`step-${reviewIndex}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [reviewIndex]);

  const handleInput = (e) => {
    const raw = e.target.value;
    setInputVal(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 1 && num <= 14) {
      setN(num);
      if (!running) resetBoard(num);
    }
  };

  const handleInputBlur = () => {
    const num = parseInt(inputVal, 10);
    if (isNaN(num) || num < 1) { setInputVal("1");  setN(1);  if (!running) resetBoard(1); }
    else if (num > 14)         { setInputVal("14"); setN(14); if (!running) resetBoard(14); }
    else                       { setInputVal(String(num)); }
  };

  // records a step into the log AND the replay history (same array, same entry)
  const recordStep = (type, msg, boardSnap, cellStatesSnap, row, col) => {
    const entry = {
      type, msg, id: Date.now() + Math.random(),
      board: boardSnap, cellStates: cellStatesSnap,
      row, col,
    };
    logRef.current = [...logRef.current, entry];
    setStepLog([...logRef.current]);
    stepsRef.current += 1;
    setSteps(stepsRef.current);
  };

  // ── pause-aware wait helper ──
  const waitIfPaused = async () => {
    while (pausedRef.current && !stopRef.current) {
      await delay(80);
    }
  };

  // ── live timer ──
  const startTimer = () => {
    startTimeRef.current = performance.now();
    totalPausedRef.current = 0;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      if (!pausedRef.current) {
        setElapsedMs(performance.now() - startTimeRef.current - totalPausedRef.current);
      }
    }, 47);
  };
  const stopTimer = (finalize = true) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (finalize) {
      setElapsedMs(performance.now() - startTimeRef.current - totalPausedRef.current);
    }
  };

  const handlePauseResume = () => {
    if (!running) return;
    if (!paused) {
      pausedRef.current = true;
      pauseStartRef.current = performance.now();
      setPaused(true);
    } else {
      totalPausedRef.current += performance.now() - pauseStartRef.current;
      pausedRef.current = false;
      setPaused(false);
    }
  };

  const handleStop = () => {
    stopRef.current = true;
    pausedRef.current = false;
    setPaused(false);
  };

  const solve = async () => {
    if (running) return;
    hasSolvedOnceRef.current = true;
    stopRef.current = false;
    pausedRef.current = false;
    setPaused(false);
    setSolved(false);
    setResultMsg("");
    setSteps(0);
    setStepLog([]);
    setConflictCount(0);
    setBacktrackCount(0);
    setSolutionBoard(null);
    setSolutionCoords([]);
    setReviewIndex(-1); // back to live mode for the new run
    stepsRef.current = 0;
    logRef.current = [];
    conflictRef.current = 0;
    backtrackRef.current = 0;
    setCellStates({});
    const b = Array.from({ length: N }, () => Array(N).fill(0));
    setBoard(b.map(r => [...r]));
    setRunning(true);
    startTimer();

    const ok = await solveHelper(b, 0);
    stopTimer(true);

    if (!ok && !stopRef.current) {
      setResultMsg(`✕  No solution exists for N = ${N}`);
      recordStep("error", `No solution found for ${N}×${N} board`, b.map(r => [...r]), {}, -1, -1);
    } else if (ok) {
      setSolutionBoard(b.map(r => [...r]));
      const coords = [];
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          if (b[i][j]) coords.push(`${String.fromCharCode(65 + j)}${N - i}`);
        }
      }
      setSolutionCoords(coords);
    }
    setRunning(false);
    setPaused(false);
    // enable review mode, pointed at the last recorded step
    setReviewIndex(logRef.current.length - 1);
  };

  const solveHelper = async (b, row) => {
    if (stopRef.current) return false;
    await waitIfPaused();
    if (stopRef.current) return false;

    if (row >= N) {
      setSolved(true);
      const correctMap = {};
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          if (b[i][j]) correctMap[`${i}-${j}`] = "correct";
        }
      }
      recordStep("solved", `🎉 Solution found! All ${N} queens placed safely.`, b.map(r => [...r]), correctMap, row, -1);
      return true;
    }

    for (let col = 0; col < N; col++) {
      if (stopRef.current) return false;
      await waitIfPaused();
      if (stopRef.current) return false;

      b[row][col] = 1;
      setBoard(b.map(r => [...r]));
      recordStep("place", `Try Row ${row + 1} Col ${col + 1}  →  ${String.fromCharCode(65 + col)}${N - row}`, b.map(r => [...r]), {}, row, col);

      const ms = speedMs[speedRef.current];
      if (ms > 0) await delay(ms);
      await waitIfPaused();
      if (stopRef.current) return false;

      const safe = isSafe(b, row, col);

      if (!safe) {
        conflictRef.current += 1;
        setConflictCount(conflictRef.current);
        const conflicts = {};
        const attackers = [];
        for (let i = 0; i < row; i++) {
          for (let j = 0; j < N; j++) {
            if (b[i][j] && (j === col || Math.abs(row - i) === Math.abs(col - j))) {
              conflicts[`${i}-${j}`] = "conflict";
              attackers.push(`${String.fromCharCode(65 + j)}${N - i}`);
            }
          }
        }
        conflicts[`${row}-${col}`] = "conflict";
        setCellStates(conflicts);
        recordStep("conflict", `Conflict at ${String.fromCharCode(65 + col)}${N - row} — attacked by [${attackers.join(", ")}]`, b.map(r => [...r]), conflicts, row, col);
        if (ms > 0) await delay(Math.min(ms * 1.2, 400));
        setCellStates({});
      }

      if (safe && await solveHelper(b, row + 1)) {
        setCellStates(cs => ({ ...cs, [`${row}-${col}`]: "correct" }));
        return true;
      }

      if (!stopRef.current) {
        b[row][col] = 0;
        setBoard(b.map(r => [...r]));
        setCellStates({});
        if (safe) {
          backtrackRef.current += 1;
          setBacktrackCount(backtrackRef.current);
          recordStep("backtrack", `Backtrack from Row ${row + 1} Col ${col + 1}`, b.map(r => [...r]), {}, row, col);
        }
      }
    }
    return false;
  };

  const handleExport = () => {
    if (!solutionBoard) {
      alert("Please solve the board first — then you can export the report.");
      return;
    }
    window.print();
  };

  // ── navigation ──
  const goToStep = (idx) => {
    if (running || history.length === 0) return;
    const clamped = Math.max(0, Math.min(idx, history.length - 1));
    setReviewIndex(clamped);
  };
  const prevStep = () => goToStep(reviewIndex - 1);
  const nextStep = () => goToStep(reviewIndex + 1);

  const navDisabledBase = running || history.length === 0;
  const prevDisabled = navDisabledBase || reviewIndex <= 0;
  const nextDisabled = navDisabledBase || reviewIndex >= history.length - 1;

  const navBtnStyle = (disabled) => ({
    display: "flex", alignItems: "center", gap: 6,
    background: disabled ? "#ece3cc" : "#fffdf8",
    border: `1px solid ${disabled ? "rgba(180,140,40,0.15)" : "rgba(180,140,40,0.45)"}`,
    color: disabled ? "#c2b48f" : "#8a6314",
    fontFamily: "'Fira Code', monospace", fontSize: "0.78rem", fontWeight: 500,
    padding: "10px 18px", borderRadius: 10,
    cursor: disabled ? "not-allowed" : "pointer",
    pointerEvents: disabled ? "none" : "auto",
    transition: "all 0.18s ease",
    letterSpacing: "0.03em",
    boxShadow: disabled ? "none" : "0 3px 10px rgba(150,120,40,0.1)",
  });

  const cellSize = Math.max(30, Math.min(54, Math.floor(420 / N)));
  const printCellSize = Math.max(20, Math.min(34, Math.floor(280 / N)));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,400;1,400;1,500&family=Fira+Code:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #f6f1e4; scroll-behavior: auto; }

        @keyframes crownFloat {
          0%,100% { transform: translateY(0px) rotate(-1deg); }
          50%      { transform: translateY(-10px) rotate(1.5deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerCell {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
        @keyframes pulseGreen {
          0%,100% { box-shadow: 0 0 0 0 rgba(47,143,91,0.35), 0 18px 50px rgba(150,120,40,0.12); }
          50%      { box-shadow: 0 0 0 10px rgba(47,143,91,0), 0 18px 50px rgba(150,120,40,0.12); }
        }
        @keyframes borderGlow {
          0%,100% { border-color: rgba(180,140,40,0.25); }
          50%      { border-color: rgba(180,140,40,0.55); }
        }
        @keyframes dotPulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%     { opacity: 0.35; transform: scale(0.6); }
        }

        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        ::-webkit-scrollbar { width: 5px; background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(150,110,30,0.25); border-radius: 3px; }

        .hov-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 26px rgba(180,140,40,0.35) !important; }
        .hov-btn:active { transform: translateY(0px) !important; }
        .speed-btn:hover { background: rgba(180,140,40,0.12) !important; color: #8a6314 !important; border-color: rgba(180,140,40,0.4) !important; }
        .reset-btn:hover { background: rgba(180,140,40,0.08) !important; color: rgba(120,95,40,0.8) !important; }
        .dl-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 24px rgba(90,62,12,0.25) !important; }
        .stop-btn:hover { background: rgba(192,57,43,0.12) !important; }
        .nav-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(180,140,40,0.25); border-color: rgba(180,140,40,0.7) !important; }
        .nav-btn:active { transform: translateY(0); }

       /* ── PRINT / PDF REPORT ── */
#print-report {
  display: none;
}

@media print {

  @page {
    size: A4;
    margin: 28mm 16mm 28mm 16mm;
  }

  body * {
    visibility: hidden;
  }

  #print-report,
  #print-report * {
    visibility: visible;
  }

  #print-report {
    display: block !important;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding-top: 18mm;
    padding-bottom: 18mm;
  }

  .pr-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;

    font-family: 'Inter', sans-serif;
    font-size: 9px;
    color: #8a6314;

    display: flex;
    justify-content: space-between;

    border-bottom: 1px solid #C8961E;
    padding-bottom: 4px;
  }

  .pr-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;

    font-family: 'Inter', sans-serif;
    font-size: 8.5px;
    color: #8a7350;

    display: flex;
    justify-content: space-between;

    border-top: 1px solid #C8961E;
    padding-top: 4px;
  }

  table {
    page-break-inside: auto;
  }

  thead {
    display: table-header-group;
  }

  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  .pr-trace-row {
    page-break-inside: avoid;
  }

  .pr-trace-row:nth-child(even) {
    background: #F5F5F5;
  }
}
      `}</style>

      {/* ══ BACKGROUND: subtle chess watermark ══ */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: solved
          ? "radial-gradient(ellipse at 50% 0%, rgba(47,143,91,0.08) 0%, #f6f1e4 55%)"
          : "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.10) 0%, #f6f1e4 55%)",
        transition: "background 1.5s ease",
      }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(150,110,30,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(150,110,30,0.035) 1px,transparent 1px)",
        backgroundSize: "56px 56px",
      }} />
      <div style={{
        position: "fixed",
        top: "-30%", left: "-30%",
        width: "160%", height: "160%",
        transform: "rotate(-7deg)",
        backgroundImage: "linear-gradient(rgba(90,62,12,0.028) 1px,transparent 1px),linear-gradient(90deg,rgba(90,62,12,0.028) 1px,transparent 1px)",
        backgroundSize: "140px 140px",
        zIndex: 0, pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", top: "-40px", right: "-30px",
        fontSize: 320, color: "rgba(90,62,12,0.025)",
        zIndex: 0, pointerEvents: "none", userSelect: "none",
        fontFamily: "'Cinzel', serif", transform: "rotate(8deg)",
      }}>♞</div>
      <div style={{
        position: "fixed", bottom: "-80px", left: "-40px",
        fontSize: 340, color: "rgba(90,62,12,0.025)",
        zIndex: 0, pointerEvents: "none", userSelect: "none",
        fontFamily: "'Cinzel', serif", transform: "rotate(-6deg)",
      }}>♜</div>

      {/* Page */}
      <div style={{
        position: "relative", zIndex: 1,
        minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "0 16px 80px",
        fontFamily: "'Cinzel', serif",
      }}>

        {/* HEADER */}
        <header style={{
          textAlign: "center", paddingTop: 64,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
          animation: "fadeSlideUp 0.8s ease both",
        }}>
          <div style={{ fontSize: 70, lineHeight: 1, color: "#a87c12", animation: "crownFloat 4.5s ease-in-out infinite", userSelect: "none" }}>♛</div>
          <h1 style={{
            fontSize: "clamp(2rem, 7vw, 4rem)", fontWeight: 900, letterSpacing: "0.08em", lineHeight: 1.1,
            color: "#5a3e0c",
            background: "linear-gradient(160deg, #8a6314 0%, #b8923a 45%, #8a6314 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>N‑QUEENS<br/>SOLVER</h1>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 400,
            fontSize: "clamp(0.85rem, 2.2vw, 1.05rem)", color: "#8a7350",
            letterSpacing: "0.1em", maxWidth: 440, lineHeight: 1.75,
            animation: "fadeSlideUp 0.9s ease both 0.3s",
          }}>
            Place N queens on an N×N chessboard<br/>so no two queens threaten each other
          </p>
        </header>

        {/* CONTENT */}
        <div style={{
          width: "100%", maxWidth: 820,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 26,
          marginTop: 48,
          animation: "fadeSlideUp 1s ease both 0.5s",
        }}>

          {/* CONTROL CARD */}
          <div style={{
            width: "100%",
            background: "#fffdf8",
            border: "1px solid rgba(180,140,40,0.25)",
            borderRadius: 22, padding: "26px 30px",
            boxShadow: "0 14px 40px rgba(150,120,40,0.12)",
            animation: running && !paused ? "borderGlow 2s ease infinite" : "none",
          }}>

            <div style={{ display: "flex", gap: 14, alignItems: "stretch", marginBottom: 20, flexWrap: "wrap" }}>
              {/* Input */}
              <div style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: 7 }}>
                <label style={{
                  fontSize: "0.62rem", letterSpacing: "0.25em",
                  color: "#a8884f", textTransform: "uppercase",
                  fontFamily: "'Fira Code', monospace",
                }}>Board Size (N)</label>
                <div style={{
                  display: "flex", alignItems: "center",
                  background: "#fbf6ea",
                  border: "1px solid rgba(180,140,40,0.3)",
                  borderRadius: 12, overflow: "hidden",
                }}>
                  <span style={{
                    padding: "0 16px",
                    fontFamily: "'Fira Code', monospace", fontSize: "0.92rem",
                    color: "#b89556",
                    borderRight: "1px solid rgba(180,140,40,0.18)",
                    userSelect: "none", whiteSpace: "nowrap",
                  }}>N =</span>
                  <input
                    type="number"
                    value={inputVal}
                    onChange={handleInput}
                    onBlur={handleInputBlur}
                    disabled={running}
                    style={{
                      background: "transparent", border: "none", outline: "none",
                      color: "#5a3e0c", fontFamily: "'Fira Code', monospace",
                      fontSize: "1.5rem", fontWeight: 500,
                      padding: "13px 18px", width: 90,
                      opacity: running ? 0.5 : 1,
                    }}
                  />
                  <span style={{
                    padding: "0 12px",
                    fontFamily: "'Fira Code', monospace", fontSize: "0.68rem",
                    color: "#c2a878",
                  }}>1–14</span>
                </div>
              </div>

              {/* Solve / Pause-Resume + Stop buttons */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="hov-btn"
                    onClick={running ? handlePauseResume : solve}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      background: paused
                        ? "linear-gradient(135deg, #2f8f5b, #257349)"
                        : "linear-gradient(135deg, #d4a827 0%, #c8961e 100%)",
                      color: paused ? "#fff" : "#3c2a05",
                      fontFamily: "'Cinzel', serif",
                      fontWeight: 700, fontSize: "0.85rem",
                      letterSpacing: "0.13em",
                      padding: "0 26px", height: 52, minWidth: 124,
                      border: "none", borderRadius: 12,
                      cursor: "pointer",
                      boxShadow: "0 4px 18px rgba(180,140,40,0.3)",
                      transition: "all 0.2s ease",
                      whiteSpace: "nowrap",
                    }}>
                    {!running ? "▶  SOLVE" : paused ? "▶  RESUME" : "⏸  PAUSE"}
                  </button>

                  <button
                    className="stop-btn"
                    onClick={handleStop}
                    disabled={!running}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "transparent",
                      border: "1px solid rgba(192,57,43,0.4)",
                      color: running ? "#c0392b" : "rgba(192,57,43,0.3)",
                      fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: "0.85rem",
                      letterSpacing: "0.1em",
                      padding: "0 18px", height: 52, borderRadius: 12,
                      cursor: running ? "pointer" : "not-allowed",
                      transition: "all 0.2s ease",
                      whiteSpace: "nowrap",
                    }}>
                    ⏹ STOP
                  </button>
                </div>
              </div>
            </div>

            {/* Speed + Reset row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              <span style={{
                fontFamily: "'Fira Code', monospace", fontSize: "0.62rem",
                color: "#b89c6e", letterSpacing: "0.2em", marginRight: 2,
              }}>SPEED</span>
              {[["slow","0.6s"],["normal","0.26s"],["fast","0.06s"],["instant","5ms"]].map(([s, t]) => (
                <button key={s} className="speed-btn" onClick={() => setSpeed(s)} style={{
                  background: speed === s ? "rgba(180,140,40,0.14)" : "transparent",
                  border: `1px solid ${speed === s ? "rgba(180,140,40,0.5)" : "rgba(180,140,40,0.18)"}`,
                  borderRadius: 8, padding: "6px 13px",
                  fontFamily: "'Fira Code', monospace", fontSize: "0.7rem",
                  color: speed === s ? "#8a6314" : "#a8915f",
                  cursor: "pointer", transition: "all 0.18s",
                  letterSpacing: "0.06em",
                }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  <span style={{ opacity: 0.55, fontSize: "0.6rem", marginLeft: 5 }}>{t}</span>
                </button>
              ))}
              <button className="reset-btn" onClick={() => { if (!running) resetBoard(N); }} style={{
                marginLeft: "auto",
                background: "transparent",
                border: "1px solid rgba(180,140,40,0.18)",
                borderRadius: 8, padding: "6px 14px",
                fontFamily: "'Fira Code', monospace", fontSize: "0.7rem",
                color: "#a8915f",
                cursor: running ? "not-allowed" : "pointer",
                transition: "all 0.18s", opacity: running ? 0.4 : 1,
                letterSpacing: "0.06em",
              }}>↺ Reset</button>
            </div>

            {/* Export Report row */}
            <div style={{
              borderTop: "1px dashed rgba(180,140,40,0.25)",
              paddingTop: 16,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontFamily: "'Fira Code', monospace", fontSize: "0.7rem", color: "#8a6314", fontWeight: 500 }}>
                  📄 Technical Report
                </span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "0.78rem", color: "#a8915f" }}>
                  {solutionBoard ? "Ready — metrics, board & execution trace included" : "Solve the board to unlock the report"}
                </span>
              </div>
              <button className="dl-btn" onClick={handleExport} style={{
                display: "flex", alignItems: "center", gap: 8,
                background: solutionBoard ? "linear-gradient(135deg, #5a3e0c, #3c2a05)" : "#d8cdb0",
                color: solutionBoard ? "#f6f1e4" : "#9a8a64",
                fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: "0.78rem",
                letterSpacing: "0.1em",
                padding: "10px 22px", border: "none", borderRadius: 10,
                cursor: solutionBoard ? "pointer" : "not-allowed",
                boxShadow: solutionBoard ? "0 4px 16px rgba(90,62,12,0.2)" : "none",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}>
                ⬇ EXPORT REPORT
              </button>
            </div>
          </div>

          {/* STATS */}
          <div style={{ display: "flex", gap: 10, width: "100%", flexWrap: "wrap" }}>
            {[
              { k: "BOARD",     v: `${N} × ${N}`,           c: "#8a6314" },
              { k: "STEPS",     v: steps.toLocaleString(),  c: "#8a6314" },
              { k: "TIME",      v: `${(elapsedMs/1000).toFixed(2)}s`, c: "#8a6314" },
              { k: "CONFLICTS", v: conflictCount.toLocaleString(), c: "#c0392b" },
              { k: "STATUS",    v: solved ? "SOLVED ✓" : paused ? "PAUSED" : running ? "SEARCHING" : "IDLE",
                c: solved ? "#2f8f5b" : paused ? "#a87c12" : running ? "#8a6314" : "#b3a07a" },
            ].map(({ k, v, c }) => (
              <div key={k} style={{
                flex: "1 1 100px",
                background: "#fffdf8",
                border: `1px solid ${k === "CONFLICTS" ? "rgba(192,57,43,0.25)" : "rgba(180,140,40,0.18)"}`,
                borderRadius: 14, padding: "14px 18px",
                boxShadow: "0 6px 18px rgba(150,120,40,0.06)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              }}>
                <span style={{
                  fontFamily: "'Fira Code', monospace", fontSize: "0.58rem",
                  color: k === "CONFLICTS" ? "rgba(192,57,43,0.55)" : "#b3a07a", letterSpacing: "0.22em",
                }}>
                  {k === "STATUS" && running && !paused && (
                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                      background: "#c8961e", marginRight: 6, verticalAlign: "middle",
                      animation: "dotPulse 1s ease infinite" }} />
                  )}
                  {k}
                </span>
                <span style={{
                  fontFamily: "'Fira Code', monospace", fontSize: "1.1rem",
                  fontWeight: 500, color: c, transition: "color 0.5s",
                }}>{v}</span>
              </div>
            ))}
          </div>

          {/* BOARD + LOG */}
          <div style={{
            width: "100%",
            display: "flex", gap: 20, alignItems: "flex-start",
            flexWrap: "wrap", justifyContent: "center",
          }}>

            {/* BOARD */}
            {displayBoard.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={{
                  background: "#fffdf8",
                  border: `1px solid ${solved ? "rgba(47,143,91,0.4)" : "rgba(180,140,40,0.22)"}`,
                  borderRadius: 18, padding: 14,
                  transition: "border-color 0.7s ease",
                  animation: solved && !inReview ? "pulseGreen 1.8s ease 3" : "none",
                  boxShadow: "0 16px 44px rgba(150,120,40,0.12)",
                }}>
                  {/* Col labels */}
                  <div style={{ display: "flex", paddingLeft: cellSize + 6, marginBottom: 4 }}>
                    {displayBoard[0].map((_, j) => (
                      <div key={j} style={{
                        width: cellSize, textAlign: "center",
                        fontFamily: "'Fira Code', monospace", fontSize: "0.56rem",
                        color: "#c2a878",
                      }}>{String.fromCharCode(65 + j)}</div>
                    ))}
                  </div>
                  <div style={{ display: "flex" }}>
                    {/* Row labels */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {displayBoard.map((_, i) => (
                        <div key={i} style={{
                          height: cellSize, width: cellSize,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "'Fira Code', monospace", fontSize: "0.56rem",
                          color: "#c2a878",
                        }}>{N - i}</div>
                      ))}
                    </div>
                    {/* Grid */}
                    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(180,140,40,0.2)" }}>
                      {displayBoard.map((row, i) => (
                        <div key={i} style={{ display: "flex" }}>
                          {row.map((cell, j) => (
                            <Cell key={j} value={cell} light={(i + j) % 2 === 0}
                              state={displayCellStates[`${i}-${j}`] || null} size={cellSize} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Step Navigation Controls ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <button className="nav-btn" onClick={prevStep} disabled={prevDisabled} style={navBtnStyle(prevDisabled)}>
                    ◀ Previous
                  </button>
                  <span style={{
                    fontFamily: "'Fira Code', monospace", fontSize: "0.78rem",
                    color: history.length > 0 ? "#5a3e0c" : "#c2b48f",
                    minWidth: 110, textAlign: "center", fontWeight: 500,
                  }}>
                    {history.length > 0 ? `Step ${reviewIndex + 1} / ${history.length}` : "Step — / —"}
                  </span>
                  <button className="nav-btn" onClick={nextStep} disabled={nextDisabled} style={navBtnStyle(nextDisabled)}>
                    Next ▶
                  </button>
                </div>
                {inReview && reviewIndex < history.length - 1 && (
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
                    fontSize: "0.78rem", color: "#a87c12",
                  }}>🔍 Reviewing step {reviewIndex + 1} — click Next to continue browsing</span>
                )}

                {/* Legend */}
                <div style={{ display: "flex", gap: 18 }}>
                  {[["#c8961e","Queen"],["#2f8f5b","Placed"],["#c0392b","Conflict"]].map(([c, l]) => (
                    <div key={l} style={{ display: "flex", gap: 6, alignItems: "center",
                      fontFamily: "'Fira Code', monospace", fontSize: "0.66rem",
                      color: "#a8915f" }}>
                      <div style={{ width: 9, height: 9, borderRadius: 2, background: c, opacity: 0.85 }} />
                      {l}
                    </div>
                  ))}
                </div>

                {resultMsg && (
                  <div style={{
                    fontFamily: "'Fira Code', monospace", fontSize: "0.8rem", color: "#c0392b",
                    background: "#fbe9e6", border: "1px solid rgba(192,57,43,0.25)",
                    borderRadius: 8, padding: "8px 16px", letterSpacing: "0.04em",
                  }}>{resultMsg}</div>
                )}
              </div>
            )}

            {/* STEP LOG */}
            <div style={{ flex: "1 1 260px", minWidth: 240, maxWidth: 340, display: "flex", flexDirection: "column", gap: 0 }}>
              <div style={{
                background: "#fffdf8",
                border: "1px solid rgba(180,140,40,0.2)",
                borderRadius: 18, overflow: "hidden",
                display: "flex", flexDirection: "column",
                boxShadow: "0 16px 44px rgba(150,120,40,0.1)",
                maxHeight: Math.max(cellSize * N + 60, 320),
              }}>
                {/* Log header */}
                <div style={{
                  padding: "13px 18px",
                  borderBottom: "1px solid rgba(180,140,40,0.15)",
                  background: "rgba(180,140,40,0.05)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{
                    fontFamily: "'Fira Code', monospace", fontSize: "0.65rem",
                    letterSpacing: "0.2em", color: "#8a6314",
                  }}>▸ STEP LOG</span>
                  {running && !paused && (
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: "#c8961e",
                      animation: "dotPulse 0.9s ease infinite",
                    }} />
                  )}
                  {paused && (
                    <span style={{ fontFamily: "'Fira Code', monospace", fontSize: "0.62rem", color: "#a87c12" }}>⏸ paused</span>
                  )}
                  {inReview && (
                    <span style={{ fontFamily: "'Fira Code', monospace", fontSize: "0.6rem", color: "#a87c12" }}>· click any entry to jump</span>
                  )}
                  <span style={{
                    marginLeft: "auto",
                    fontFamily: "'Fira Code', monospace", fontSize: "0.62rem",
                    color: "#b3a07a",
                  }}>{stepLog.length} entries</span>
                </div>

                {/* Entries */}
                <div style={{
                  overflowY: "auto", flex: 1,
                  display: "flex", flexDirection: "column", gap: 2,
                  padding: "8px 4px",
                }}>
                  {stepLog.length === 0 ? (
                    <div style={{
                      textAlign: "center", padding: "32px 16px",
                      fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
                      color: "#c2a878", fontSize: "0.92rem",
                    }}>Awaiting solve…</div>
                  ) : (
                    stepLog.map((s, i) => (
                      <StepItem
                        key={s.id}
                        step={s}
                        idx={i}
                        active={inReview && i === reviewIndex}
                        disabled={running}
                        onSelect={goToStep}
                      />
                    ))
                  )}
                  <div ref={logEndRef} />
                </div>
              </div>

              {/* Log legend */}
              <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap", paddingLeft: 4 }}>
                {[["#a87c12","↓","Place"],["#c0392b","✕","Conflict"],["#7c5cb8","↩","Backtrack"],["#2f8f5b","✓","Solved"]].map(([c, icon, l]) => (
                  <div key={l} style={{ display: "flex", gap: 5, alignItems: "center",
                    fontFamily: "'Fira Code', monospace", fontSize: "0.64rem",
                    color: "#a8915f" }}>
                    <span style={{ color: c }}>{icon}</span>{l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer style={{
          marginTop: 56,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
          color: "#a8915f", fontSize: "0.88rem", letterSpacing: "0.06em",
        }}>
          <div>♛</div>
          <div>
            Crafted by{" "}
            <a href="https://github.com/omsharma-004" target="_blank" rel="noreferrer"
              style={{ color: "#8a6314", textDecoration: "none", fontWeight: 600 }}>
              Om Sharma
            </a>
          </div>
          <a href="https://github.com/omsharma-004" target="_blank" rel="noreferrer" style={{
            fontFamily: "'Fira Code', monospace", fontSize: "0.7rem",
            color: "#b3a07a", textDecoration: "none",
          }}>github.com/omsharma-004</a>
        </footer>
      </div>

      {/* ════════════════════════════════════════════════════
          PRINT REPORT — professional technical document
      ════════════════════════════════════════════════════ */}
      <div
  id="print-report"
  style={{
    fontFamily: "'Inter', sans-serif",
    color: "#1a1a1a",
    fontSize: 12,
    paddingTop: "18mm",
    paddingBottom: "18mm",
  }}
>

        <div className="pr-header">
          <span>N-Queens Solver Report</span>
          <span>{N}×{N} Board</span>
        </div>
        <div className="pr-footer">
          <span>Generated by Om Sharma · github.com/omsharma-004</span>
          <span>Confidential — Technical Report</span>
        </div>

        {/* ── PAGE 1 : EXECUTIVE SUMMARY ── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 30, color: "#C8961E", marginBottom: 6 }}>♛</div>
          <h1 style={{ fontSize: 34, fontWeight: 700, color: "#5A3E0C", letterSpacing: "-0.01em" }}>
            N-Queens Solver
          </h1>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#C8961E", marginTop: 4 }}>
            Technical Solution Report
          </div>
          <div style={{ fontSize: 11, color: "#6b6b6b", marginTop: 10 }}>
            Generated {new Date().toLocaleString()} &nbsp;·&nbsp; Algorithm: Recursive Backtracking
          </div>
        </div>

        {/* Metric grid — primary */}
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          {[
            ["BOARD", `${N} × ${N}`],
            ["STEPS", steps],
            ["TIME", `${(elapsedMs/1000).toFixed(3)}s`],
            ["STATUS", "Solved ✓"],
          ].map(([label, val], i) => (
            <div key={label} style={{
              flex: 1, border: "1px solid #C8961E", borderRadius: 6,
              padding: "12px 10px", background: i % 2 === 0 ? "#FFFFFF" : "#F5F5F5",
            }}>
              <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "#8a6314", fontWeight: 600, marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 16, fontWeight: 500,
                color: label === "STATUS" ? "#2F8F5B" : "#5A3E0C" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Metric grid — secondary */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {[
            ["CONFLICTS ENCOUNTERED", conflictCount],
            ["BACKTRACKS PERFORMED", backtrackCount],
            ["SEARCH NODES VISITED", steps],
          ].map(([label, val], i) => (
            <div key={label} style={{
              flex: 1, border: "1px solid #ddd", borderRadius: 6,
              padding: "10px 10px", background: "#FFFFFF",
            }}>
              <div style={{ fontSize: 8.5, letterSpacing: "0.1em", color: "#777", fontWeight: 600, marginBottom: 5 }}>{label}</div>
              <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 14, fontWeight: 500, color: "#5A3E0C" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Final board visualization */}
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#5A3E0C", marginBottom: 12 }}>Final Board Visualization</h2>
        {solutionBoard && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div style={{ border: "2px solid #C8961E", borderRadius: 4, overflow: "hidden" }}>
              {solutionBoard.map((row, i) => (
                <div key={i} style={{ display: "flex" }}>
                  {row.map((cell, j) => (
                    <PrintCell key={j} value={cell} light={(i + j) % 2 === 0} size={printCellSize} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Solution coordinates */}
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#5A3E0C", marginBottom: 8 }}>Solution Coordinates</h2>
        <div style={{
          fontFamily: "'Fira Code', monospace", fontSize: 13, color: "#5A3E0C",
          background: "#F5F5F5", border: "1px solid #ddd", borderRadius: 6,
          padding: "10px 14px", marginBottom: 6,
        }}>
          {solutionCoords.join(",  ")}
        </div>

        {/* ── PAGE 2+ : EXECUTION TRACE ── */}
        <div className="pr-page-break">
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#5A3E0C", marginBottom: 14, marginTop: 10 }}>
            Execution Trace <span style={{ fontSize: 12, fontWeight: 400, color: "#777" }}>({stepLog.length} entries)</span>
          </h2>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: "#5A3E0C", color: "#fff" }}>
                <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 600, width: 70 }}>Step</th>
                <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 600, width: 100 }}>Event</th>
                <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 600 }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {stepLog.map((s, i) => (
                <tr key={s.id} className="pr-trace-row">
                  <td style={{ padding: "5px 10px", fontFamily: "'Fira Code', monospace", color: "#8a6314" }}>
                    #{String(i + 1).padStart(3, "0")}
                  </td>
                  <td style={{
                    padding: "5px 10px", fontFamily: "'Fira Code', monospace", fontWeight: 600,
                    color: s.type === "conflict" ? "#c0392b" : s.type === "backtrack" ? "#7c5cb8" : s.type === "solved" ? "#2F8F5B" : "#5A3E0C",
                  }}>
                    {s.type.toUpperCase()}
                  </td>
                  <td style={{ padding: "5px 10px", color: "#333" }}>{s.msg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
