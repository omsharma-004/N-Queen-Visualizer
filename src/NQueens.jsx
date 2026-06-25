import { useState, useRef, useEffect } from "react";

/* ════════════════════════════════════════════════════════
   LOGIC  (original algorithm, untouched)
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
   PARTICLE BACKGROUND
════════════════════════════════════════════════════════ */
function ParticleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      a: Math.random(),
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${p.a * 0.35})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

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

  const bg = state === "correct"   ? "rgba(56,224,140,0.28)"
           : state === "conflict"  ? "rgba(255,80,70,0.32)"
           : light                 ? "rgba(245,226,122,0.055)"
           :                         "rgba(0,0,0,0.32)";

  const queenColor = state === "correct"  ? "#56e08c"
                   : state === "conflict" ? "#ff6b63"
                   : "#f5d060";

  const glowColor  = state === "correct"  ? "rgba(56,224,140,0.9)"
                   : state === "conflict" ? "rgba(255,80,70,0.9)"
                   : "rgba(245,208,96,0.85)";

  return (
    <div style={{
      width: size, height: size,
      background: bg,
      borderRight:  light ? "1px solid rgba(255,255,255,0.03)" : "1px solid rgba(0,0,0,0.25)",
      borderBottom: light ? "1px solid rgba(255,255,255,0.03)" : "1px solid rgba(0,0,0,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.54,
      transition: "background 0.22s ease",
      position: "relative", overflow: "hidden",
      userSelect: "none",
    }}>
      {state === "correct" && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
          animation: "shimmerCell 1.4s infinite",
        }} />
      )}
      {value === 1 && (
        <span style={{
          lineHeight: 1,
          color: queenColor,
          filter: `drop-shadow(0 0 7px ${glowColor})`,
          display: "inline-block",
          transform: popped ? "scale(1.28) rotate(10deg)" : "scale(1) rotate(0deg)",
          transition: "transform 0.28s cubic-bezier(.34,1.56,.64,1)",
        }}>♛</span>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   STEP LOG ITEM
════════════════════════════════════════════════════════ */
function StepItem({ step, idx }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 30); return () => clearTimeout(t); }, []);

  const typeColor = step.type === "place"     ? "#f5d060"
                  : step.type === "conflict"  ? "#ff6b63"
                  : step.type === "backtrack" ? "#a78bfa"
                  : step.type === "solved"    ? "#56e08c"
                  :                             "#888";

  const icon = step.type === "place"     ? "↓"
             : step.type === "conflict"  ? "✕"
             : step.type === "backtrack" ? "↩"
             : step.type === "solved"    ? "✓"
             :                             "·";

  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start",
      padding: "7px 12px",
      background: visible ? "rgba(255,255,255,0.02)" : "transparent",
      borderLeft: `2px solid ${typeColor}`,
      borderRadius: "0 8px 8px 0",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(-12px)",
      transition: "opacity 0.22s ease, transform 0.22s ease, background 0.3s",
    }}>
      <span style={{ color: typeColor, fontFamily: "monospace", fontSize: "0.8rem", minWidth: 14, marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "rgba(212,175,55,0.3)", marginRight: 8 }}>
          #{String(idx + 1).padStart(3, "0")}
        </span>
        <span style={{ fontFamily: "monospace", fontSize: "0.76rem", color: typeColor === "#f5d060" ? "rgba(245,208,96,0.82)" : typeColor }}>
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
  // ── FIX: store raw string so user can fully delete and retype ──
  const [inputVal, setInputVal] = useState("8");
  const [N, setN] = useState(8);

  const [board, setBoard] = useState(() => Array.from({ length: 8 }, () => Array(8).fill(0)));
  const [cellStates, setCellStates] = useState({});
  const [solved, setSolved] = useState(false);
  const [running, setRunning] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [steps, setSteps] = useState(0);
  const [stepLog, setStepLog] = useState([]);
  const [speed, setSpeed] = useState("normal");

  const stopRef = useRef(false);
  const stepsRef = useRef(0);
  const logRef = useRef([]);
  const logEndRef = useRef(null);
  const speedRef = useRef("normal");

  // keep speedRef in sync so solveHelper reads latest
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const speedMs = { slow: 600, normal: 260, fast: 60, instant: 0 };

  const resetBoard = (size) => {
    setBoard(Array.from({ length: size }, () => Array(size).fill(0)));
    setCellStates({});
    setSolved(false);
    setResultMsg("");
    setSteps(0);
    setStepLog([]);
    stepsRef.current = 0;
    logRef.current = [];
  };

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [stepLog]);

  // ── INPUT HANDLER — allows full deletion ──
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

  const addLog = (type, msg) => {
    const entry = { type, msg, id: Date.now() + Math.random() };
    logRef.current = [...logRef.current, entry];
    setStepLog([...logRef.current]);
    stepsRef.current += 1;
    setSteps(stepsRef.current);
  };

  const solve = async () => {
    if (running) { stopRef.current = true; return; }
    stopRef.current = false;
    setSolved(false);
    setResultMsg("");
    setSteps(0);
    setStepLog([]);
    stepsRef.current = 0;
    logRef.current = [];
    setCellStates({});
    const b = Array.from({ length: N }, () => Array(N).fill(0));
    setBoard(b.map(r => [...r]));
    setRunning(true);

    const ok = await solveHelper(b, 0);
    if (!ok && !stopRef.current) {
      setResultMsg(`✕  No solution exists for N = ${N}`);
      addLog("error", `No solution found for ${N}×${N} board`);
    }
    setRunning(false);
  };

  const solveHelper = async (b, row) => {
    if (stopRef.current) return false;
    if (row >= N) {
      setSolved(true);
      addLog("solved", `🎉 Solution found! All ${N} queens placed safely.`);
      return true;
    }

    for (let col = 0; col < N; col++) {
      if (stopRef.current) return false;

      b[row][col] = 1;
      setBoard(b.map(r => [...r]));
      addLog("place", `Try Row ${row + 1} Col ${col + 1}  →  ${String.fromCharCode(65 + col)}${N - row}`);

      const ms = speedMs[speedRef.current];
      if (ms > 0) await delay(ms);

      const safe = isSafe(b, row, col);

      if (!safe) {
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
        addLog("conflict", `Conflict at ${String.fromCharCode(65 + col)}${N - row} — attacked by [${attackers.join(", ")}]`);
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
        if (safe) addLog("backtrack", `Backtrack from Row ${row + 1} Col ${col + 1}`);
      }
    }
    return false;
  };

  const cellSize = Math.max(30, Math.min(54, Math.floor(420 / N)));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;1,300;1,500&family=Fira+Code:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060810; overflow-x: hidden; }

        @keyframes crownFloat {
          0%,100% { transform: translateY(0px) rotate(-1deg); filter: drop-shadow(0 0 28px rgba(212,175,55,0.75)); }
          50%      { transform: translateY(-14px) rotate(1.5deg); filter: drop-shadow(0 0 52px rgba(212,175,55,1)); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerCell {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
        @keyframes pulseGreen {
          0%,100% { box-shadow: 0 0 0 0 rgba(56,224,140,0.5), 0 24px 70px rgba(0,0,0,0.6); }
          50%      { box-shadow: 0 0 0 12px rgba(56,224,140,0), 0 24px 70px rgba(0,0,0,0.6); }
        }
        @keyframes borderGlow {
          0%,100% { border-color: rgba(212,175,55,0.2); }
          50%      { border-color: rgba(212,175,55,0.5); }
        }
        @keyframes dotPulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%     { opacity: 0.4; transform: scale(0.6); }
        }

        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        ::-webkit-scrollbar { width: 4px; background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.15); border-radius: 2px; }

        .hov-btn:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 36px rgba(212,175,55,0.45) !important; }
        .hov-btn:active { transform: translateY(0px) !important; }
        .speed-btn:hover { background: rgba(212,175,55,0.12) !important; color: #f5d060 !important; border-color: rgba(212,175,55,0.35) !important; }
        .reset-btn:hover { background: rgba(212,175,55,0.06) !important; color: rgba(212,175,55,0.6) !important; }
      `}</style>

      {/* Backgrounds */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: solved
          ? "radial-gradient(ellipse at 50% 0%, rgba(56,224,140,0.07) 0%, #060810 55%)"
          : "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.07) 0%, #060810 55%)",
        transition: "background 1.5s ease",
      }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(212,175,55,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,0.02) 1px,transparent 1px)",
        backgroundSize: "56px 56px",
      }} />
      <ParticleCanvas />

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
          <div style={{ fontSize: 74, lineHeight: 1, animation: "crownFloat 4.5s ease-in-out infinite", userSelect: "none" }}>♛</div>
          <h1 style={{
            fontSize: "clamp(2rem, 7vw, 4.2rem)", fontWeight: 900, letterSpacing: "0.09em", lineHeight: 1.08,
            background: "linear-gradient(160deg, #fff8d6 0%, #f5d060 30%, #d4a827 65%, #c8961e 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            color: "#f5d060", // fallback if gradient-text unsupported
            textShadow: "0 0 80px rgba(212,175,55,0.25)",
          }}>N‑QUEENS<br/>SOLVER</h1>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300,
            fontSize: "clamp(0.85rem, 2.2vw, 1.05rem)", color: "rgba(212,175,55,0.42)",
            letterSpacing: "0.14em", maxWidth: 440, lineHeight: 1.75,
            animation: "fadeSlideUp 0.9s ease both 0.3s",
          }}>
            Place N queens on an N×N chessboard<br/>so no two queens threaten each other
          </p>
        </header>

        {/* CONTENT */}
        <div style={{
          width: "100%", maxWidth: 820,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 28,
          marginTop: 52,
          animation: "fadeSlideUp 1s ease both 0.5s",
        }}>

          {/* CONTROL CARD */}
          <div style={{
            width: "100%",
            background: "linear-gradient(145deg, rgba(28,24,12,0.88), rgba(12,10,4,0.92))",
            border: "1px solid rgba(212,175,55,0.2)",
            borderRadius: 24, padding: "28px 32px",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.1)",
            animation: running ? "borderGlow 2s ease infinite" : "none",
          }}>

            <div style={{ display: "flex", gap: 14, alignItems: "stretch", marginBottom: 22, flexWrap: "wrap" }}>
              {/* Input */}
              <div style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: 7 }}>
                <label style={{
                  fontSize: "0.6rem", letterSpacing: "0.28em",
                  color: "rgba(212,175,55,0.45)", textTransform: "uppercase",
                  fontFamily: "'Fira Code', monospace",
                }}>Board Size (N)</label>
                <div style={{
                  display: "flex", alignItems: "center",
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(212,175,55,0.22)",
                  borderRadius: 12, overflow: "hidden",
                }}>
                  <span style={{
                    padding: "0 16px",
                    fontFamily: "'Fira Code', monospace", fontSize: "0.92rem",
                    color: "rgba(212,175,55,0.32)",
                    borderRight: "1px solid rgba(212,175,55,0.1)",
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
                      color: "#f5d060", fontFamily: "'Fira Code', monospace",
                      fontSize: "1.5rem", fontWeight: 500,
                      padding: "13px 18px", width: 90,
                      opacity: running ? 0.5 : 1,
                    }}
                  />
                  <span style={{
                    padding: "0 12px",
                    fontFamily: "'Fira Code', monospace", fontSize: "0.68rem",
                    color: "rgba(212,175,55,0.22)",
                  }}>1–14</span>
                </div>
              </div>

              {/* Solve button */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <button className="hov-btn" onClick={solve} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  background: running
                    ? "linear-gradient(135deg, rgba(70,35,35,0.95), rgba(50,25,25,0.95))"
                    : "linear-gradient(135deg, #c49a20 0%, #f5d060 45%, #b07e18 100%)",
                  color: running ? "#ff9090" : "#1a0e00",
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700, fontSize: "0.88rem",
                  letterSpacing: "0.15em",
                  padding: "0 32px", height: 52, minWidth: 130,
                  border: "none", borderRadius: 12,
                  cursor: "pointer",
                  boxShadow: running ? "0 4px 16px rgba(255,80,70,0.15)" : "0 4px 24px rgba(212,168,39,0.3)",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}>
                  {running ? "⏹  STOP" : "▶  SOLVE"}
                </button>
              </div>
            </div>

            {/* Speed + Reset row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                fontFamily: "'Fira Code', monospace", fontSize: "0.62rem",
                color: "rgba(212,175,55,0.3)", letterSpacing: "0.22em", marginRight: 2,
              }}>SPEED</span>
              {[["slow","0.6s"],["normal","0.26s"],["fast","0.06s"],["instant","0ms"]].map(([s, t]) => (
                <button key={s} className="speed-btn" onClick={() => setSpeed(s)} style={{
                  background: speed === s ? "rgba(212,175,55,0.15)" : "transparent",
                  border: `1px solid ${speed === s ? "rgba(212,175,55,0.45)" : "rgba(212,175,55,0.1)"}`,
                  borderRadius: 8, padding: "6px 13px",
                  fontFamily: "'Fira Code', monospace", fontSize: "0.7rem",
                  color: speed === s ? "#f5d060" : "rgba(212,175,55,0.32)",
                  cursor: "pointer", transition: "all 0.18s",
                  letterSpacing: "0.06em",
                }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  <span style={{ opacity: 0.38, fontSize: "0.6rem", marginLeft: 5 }}>{t}</span>
                </button>
              ))}
              <button className="reset-btn" onClick={() => { if (!running) resetBoard(N); }} style={{
                marginLeft: "auto",
                background: "transparent",
                border: "1px solid rgba(212,175,55,0.1)",
                borderRadius: 8, padding: "6px 14px",
                fontFamily: "'Fira Code', monospace", fontSize: "0.7rem",
                color: "rgba(212,175,55,0.28)",
                cursor: running ? "not-allowed" : "pointer",
                transition: "all 0.18s", opacity: running ? 0.4 : 1,
                letterSpacing: "0.06em",
              }}>↺ Reset</button>
            </div>
          </div>

          {/* STATS */}
          <div style={{ display: "flex", gap: 10, width: "100%", flexWrap: "wrap" }}>
            {[
              { k: "BOARD",  v: `${N} × ${N}`,          c: "#f5d060" },
              { k: "STEPS",  v: steps.toLocaleString(),  c: "#f5d060" },
              { k: "STATUS", v: solved ? "SOLVED ✓" : running ? "SEARCHING" : "IDLE",
                c: solved ? "#56e08c" : running ? "#f5d060" : "rgba(212,175,55,0.35)" },
            ].map(({ k, v, c }) => (
              <div key={k} style={{
                flex: "1 1 100px",
                background: "rgba(212,175,55,0.035)",
                border: "1px solid rgba(212,175,55,0.1)",
                borderRadius: 14, padding: "14px 18px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              }}>
                <span style={{
                  fontFamily: "'Fira Code', monospace", fontSize: "0.58rem",
                  color: "rgba(212,175,55,0.3)", letterSpacing: "0.24em",
                }}>
                  {k === "STATUS" && running && (
                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                      background: "#f5d060", marginRight: 6, verticalAlign: "middle",
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
            {board.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={{
                  background: "rgba(6,4,1,0.75)",
                  border: `1px solid ${solved ? "rgba(56,224,140,0.35)" : "rgba(212,175,55,0.13)"}`,
                  borderRadius: 18, padding: 14,
                  transition: "border-color 0.7s ease",
                  animation: solved ? "pulseGreen 1.8s ease 3" : "none",
                  boxShadow: "0 24px 70px rgba(0,0,0,0.65)",
                }}>
                  {/* Col labels */}
                  <div style={{ display: "flex", paddingLeft: cellSize + 6, marginBottom: 4 }}>
                    {board[0].map((_, j) => (
                      <div key={j} style={{
                        width: cellSize, textAlign: "center",
                        fontFamily: "'Fira Code', monospace", fontSize: "0.56rem",
                        color: "rgba(212,175,55,0.2)",
                      }}>{String.fromCharCode(65 + j)}</div>
                    ))}
                  </div>
                  <div style={{ display: "flex" }}>
                    {/* Row labels */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {board.map((_, i) => (
                        <div key={i} style={{
                          height: cellSize, width: cellSize,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "'Fira Code', monospace", fontSize: "0.56rem",
                          color: "rgba(212,175,55,0.2)",
                        }}>{N - i}</div>
                      ))}
                    </div>
                    {/* Grid */}
                    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(212,175,55,0.07)" }}>
                      {board.map((row, i) => (
                        <div key={i} style={{ display: "flex" }}>
                          {row.map((cell, j) => (
                            <Cell key={j} value={cell} light={(i + j) % 2 === 0}
                              state={cellStates[`${i}-${j}`] || null} size={cellSize} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: "flex", gap: 18 }}>
                  {[["#f5d060","Queen"],["#56e08c","Placed"],["#ff6b63","Conflict"]].map(([c, l]) => (
                    <div key={l} style={{ display: "flex", gap: 6, alignItems: "center",
                      fontFamily: "'Fira Code', monospace", fontSize: "0.66rem",
                      color: "rgba(212,175,55,0.27)" }}>
                      <div style={{ width: 9, height: 9, borderRadius: 2, background: c, opacity: 0.7 }} />
                      {l}
                    </div>
                  ))}
                </div>

                {resultMsg && (
                  <div style={{
                    fontFamily: "'Fira Code', monospace", fontSize: "0.8rem", color: "#ff6b63",
                    background: "rgba(255,80,70,0.07)", border: "1px solid rgba(255,80,70,0.18)",
                    borderRadius: 8, padding: "8px 16px", letterSpacing: "0.04em",
                  }}>{resultMsg}</div>
                )}
              </div>
            )}

            {/* STEP LOG */}
            <div style={{ flex: "1 1 260px", minWidth: 240, maxWidth: 340, display: "flex", flexDirection: "column", gap: 0 }}>
              <div style={{
                background: "rgba(6,4,1,0.75)",
                border: "1px solid rgba(212,175,55,0.13)",
                borderRadius: 18, overflow: "hidden",
                display: "flex", flexDirection: "column",
                maxHeight: Math.max(cellSize * N + 60, 320),
              }}>
                {/* Log header */}
                <div style={{
                  padding: "13px 18px",
                  borderBottom: "1px solid rgba(212,175,55,0.09)",
                  background: "rgba(212,175,55,0.035)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{
                    fontFamily: "'Fira Code', monospace", fontSize: "0.65rem",
                    letterSpacing: "0.22em", color: "rgba(212,175,55,0.45)",
                  }}>▸ STEP LOG</span>
                  {running && (
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: "#f5d060",
                      boxShadow: "0 0 7px rgba(245,208,96,0.9)",
                      animation: "dotPulse 0.9s ease infinite",
                    }} />
                  )}
                  <span style={{
                    marginLeft: "auto",
                    fontFamily: "'Fira Code', monospace", fontSize: "0.62rem",
                    color: "rgba(212,175,55,0.25)",
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
                      color: "rgba(212,175,55,0.18)", fontSize: "0.92rem",
                    }}>Awaiting solve…</div>
                  ) : (
                    stepLog.map((s, i) => <StepItem key={s.id} step={s} idx={i} />)
                  )}
                  <div ref={logEndRef} />
                </div>
              </div>

              {/* Log legend */}
              <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap", paddingLeft: 4 }}>
                {[["#f5d060","↓","Place"],["#ff6b63","✕","Conflict"],["#a78bfa","↩","Backtrack"],["#56e08c","✓","Solved"]].map(([c, icon, l]) => (
                  <div key={l} style={{ display: "flex", gap: 5, alignItems: "center",
                    fontFamily: "'Fira Code', monospace", fontSize: "0.64rem",
                    color: "rgba(212,175,55,0.25)" }}>
                    <span style={{ color: c }}>{icon}</span>{l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer style={{
          marginTop: 60,
          fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
          color: "rgba(212,175,55,0.22)", fontSize: "0.88rem", letterSpacing: "0.08em",
        }}>
          Crafted by{" "}
          <a href="https://github.com/omsharma-004" target="_blank" rel="noreferrer"
            style={{ color: "rgba(212,175,55,0.45)", textDecoration: "none" }}>
            Om Sharma
          </a>
        </footer>
      </div>
    </>
  );
}
