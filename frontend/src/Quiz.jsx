import React, { useState } from "react";

// Classic Kahoot-inspired answer colors
const CHOICE_COLORS = [
  { bg: "#e21b3c", hover: "#c5102e", label: "▲" }, // red    — triangle
  { bg: "#1368ce", hover: "#0d55a8", label: "◆" }, // blue   — diamond
  { bg: "#d89e00", hover: "#b88200", label: "●" }, // yellow — circle
  { bg: "#26890c", hover: "#1b6408", label: "■" }, // green  — square
];

const pbStyles = {
  container: {
    padding: "0 32px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
    boxSizing: "border-box",
  },
  textRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#B0BAC3",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontFamily: "'Syne', sans-serif",
  },
  track: {
    width: "100%",
    height: "8px",
    background: "#252A4A",
    borderRadius: "4px",
    overflow: "hidden",
    border: "1px solid #0F3460",
  },
  fill: {
    height: "100%",
    background: "linear-gradient(90deg, #6153cc, #00D2D3)",
    borderRadius: "4px",
    transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

function ProgressBar({ current, total }) {
  const pct = Math.max(0, Math.min(100, (current / total) * 100));
  const remaining = total - current;
  return (
    <div style={pbStyles.container}>
      <div style={pbStyles.textRow}>
        <span style={{ color: "#00D2D3" }}>{current} Done</span>
        <span>{remaining} Left</span>
      </div>
      <div style={pbStyles.track}>
        <div style={{ ...pbStyles.fill, width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ScoreScreen({ score, total, onRestart }) {
  const pct = Math.round((score / total) * 100);
  const emoji = pct === 100 ? "🏆" : pct >= 70 ? "🎉" : pct >= 40 ? "🙂" : "😅";

  return (
    <div style={scoreStyles.wrap}>
      <div style={scoreStyles.emoji}>{emoji}</div>
      <h1 style={scoreStyles.h1}>Quiz complete!</h1>
      <div style={scoreStyles.scoreBox}>
        <span style={scoreStyles.scoreNum}>{score}</span>
        <span style={scoreStyles.scoreOf}>/ {total}</span>
      </div>
      <div style={scoreStyles.pct}>{pct}% correct</div>
      <button style={scoreStyles.btn} onClick={onRestart}>
        Try another document →
      </button>
      <style>{`@keyframes popIn { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}

const scoreStyles = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "80vh",
    gap: "16px",
    animation: "popIn 0.4s ease both",
  },
  emoji: { fontSize: "72px", lineHeight: 1 },
  h1: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "40px",
    color: "#F1F2F6",
    margin: 0,
    letterSpacing: "-1px",
  },
  scoreBox: { display: "flex", alignItems: "baseline", gap: "6px", marginTop: "8px" },
  scoreNum: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "72px",
    color: "#00D2D3",
    lineHeight: 1,
  },
  scoreOf: { fontSize: "28px", color: "#4a4a6a" },
  pct: { fontSize: "18px", color: "#B0BAC3" },
  btn: {
    marginTop: "24px",
    background: "#00D2D3",
    color: "#16213E",
    border: "none",
    borderRadius: "12px",
    padding: "16px 40px",
    fontSize: "16px",
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
  },
};

export default function Quiz({ quiz, onRestart, onScoreUpdate, onAnswerSubmit, currentQuestionIndex = null, leaderboard = null, streaks = null, isHostMode = false, hostAnswers = {}, triggerNextQuestion = null, hostRevealed = false, onReveal = null }) {
  const { questions } = quiz;
  const total = questions.length;

  const isMultiplayer = currentQuestionIndex !== null;

  const [localCurrent, setLocalCurrent] = useState(0);
  const current = isMultiplayer ? currentQuestionIndex : localCurrent;

  const [selected,  setSelected]  = useState(null);   // index of chosen answer 
  const [revealed,  setRevealed]  = useState(false);  // show correct/wrong     
  const [score,     setScore]     = useState(0);
  const [streak,    setStreak]    = useState(0);
  const [done,      setDone]      = useState(false);

  // When host moves to the next question, reset selection state
  React.useEffect(() => {
    if (isMultiplayer) {
      if (current < total) {
        setSelected(null);
        setRevealed(false);
      } else {
        setDone(true);
      }
    }
  }, [current, total, isMultiplayer]);

  const q = questions[current < total ? current : total - 1] || questions[0];

  const showResults = isMultiplayer && !isHostMode ? hostRevealed : revealed;

  const handleSelect = (idx) => {
    if (revealed || isHostMode) return;
    setSelected(idx);
    setRevealed(true);
    let newScore = score;
    let newStreak = streak;
    if (idx === q.correct_index) {
       newScore += 1;
       newStreak += 1;
       setScore(newScore);
       setStreak(newStreak);
    } else {
       newStreak = 0;
       setStreak(newStreak);
    }
    if (onScoreUpdate) {
       onScoreUpdate(newScore, newStreak);
    }
    if (onAnswerSubmit) {
       onAnswerSubmit(current, idx);
    }
  };

  const handleHostNext = () => {
    setRevealed(true);
    if (onReveal) {
      onReveal();
    }
    setTimeout(() => {
       if (triggerNextQuestion) {
          triggerNextQuestion();
       }
    }, 3000);
  };

  const handleNextLocal = () => {
    if (localCurrent + 1 >= total) {
      setDone(true);
    } else {
      setLocalCurrent((c) => c + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  if (done) {
    return (
      <div style={styles.page}>
        <ScoreScreen score={score} total={total} onRestart={onRestart} />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Top bar (minimalist loading screen) */}
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <span style={styles.logo}>Kuizu</span>
          <span style={styles.scoreChip}>
            {isHostMode ? (
              <span onClick={onRestart} style={{ cursor: "pointer", color: "#FF6B6B", fontWeight: 600 }}>
                End Game
              </span>
            ) : (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {!isMultiplayer && <span style={{ fontWeight: 600 }}>Score: {score}/{total}</span>}
                <span onClick={onRestart} style={{ cursor: 'pointer', color: '#FF6B6B', fontWeight: 600 }}>End Game</span>
              </div>
            )}
          </span>
        </div>
        <ProgressBar current={current + (revealed ? 1 : 0)} total={total} />
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", width: "100%" }}>
        <main style={{...styles.main, overflowY: "auto"}}>
          {/* Question card */}
          <div style={styles.questionCard} key={current}>
            <div style={styles.qNumber}>Q{current + 1}</div>
            <p style={styles.questionText}>{q.question}</p>
          </div>

        {/* Answer grid */}
        <div style={styles.grid}>
          {q.choices.map((choice, idx) => {
            const color = CHOICE_COLORS[idx];
            let bg = color.bg;
            let extra = {};
              let pct = 0;

              if (isHostMode && hostAnswers) {
                const values = Object.values(hostAnswers);
                const totalAnswers = values.reduce((a, b) => a + Number(b || 0), 0);
                if (totalAnswers > 0) {
                  const count = Number(hostAnswers[String(idx)] || 0);
                  pct = Math.round((count / totalAnswers) * 100);
                }
              }

              if (showResults) {
                if (idx === q.correct_index) {
                  bg = color.bg;
                  extra = { outline: "4px solid #16213E", outlineOffset: "2px", transform: "scale(1.03)" };
                } else if (idx === selected || isHostMode) {
                  bg = color.bg;
                  extra = { opacity: 0.65, filter: "grayscale(40%)" };
                } else {
                  bg = color.bg;
                  extra = { opacity: 0.5, filter: "grayscale(50%)" };
                }
              } else if (revealed && !isHostMode) {
                // User has answered but results not revealed yet
                if (idx === selected) {
                  extra = { outline: "4px solid #16213E", outlineOffset: "2px", transform: "scale(1.03)" };
                } else {
                  extra = { opacity: 0.5 };
                }
              }

              return (
                <button
                  key={idx}
                  style={{ ...styles.choiceBtn, background: bg, ...extra, position: "relative", overflow: "hidden" }}
                  onClick={() => handleSelect(idx)}
                  disabled={revealed || isHostMode}
                >
                  {isHostMode && showResults && (
                     <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${pct}%`, background: "rgba(255, 255, 255, 0.35)", zIndex: 1, transition: "width 0.6s ease-out" }} />
                  )}
                  <span style={{ ...styles.choiceShape, position: "relative", zIndex: 2 }}>
                    {showResults && idx === q.correct_index ? (
                      <span style={styles.tick}>&#10003;</span>
                    ) : showResults && !isHostMode && idx === selected && idx !== q.correct_index ? (
                      <span style={styles.cross}>&#10007;</span>
                    ) : (
                      color.label
                    )}
                  </span>
                  <span style={{ ...styles.choiceText, position: "relative", zIndex: 2, fontSize: choice.length > 50 ? "clamp(18px, 1.5vw, 24px)" : choice.length > 30 ? "clamp(24px, 2.5vw, 36px)" : undefined }}>{choice}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback + next */}
          {revealed && !isHostMode && (
            <div style={styles.feedbackRow} key={"fb-" + current}>
              {showResults ? (
                <>
                  <div style={selected === q.correct_index ? styles.feedbackCorrect : styles.feedbackWrong}>
                    {selected === q.correct_index
                      ? "\u2713 Correct!"
                      : `\u2717 The answer was: ${q.choices[q.correct_index]}`}   
                  </div>

                  {isMultiplayer ? (
                    <p style={{ textAlign: "center", color: "#B0BAC3", margin: "10px 0" }}>
                      Waiting for the host to start the next question...
                    </p>
                  ) : (
                    <button style={styles.nextBtn} onClick={handleNextLocal}>     
                      {localCurrent + 1 < total ? "Next question \u2192" : "See results \u2192"}
                    </button>
                  )}
                </>
              ) : (
                <div style={{...styles.feedbackCorrect, background: "#252A4A", color: "#00D2D3"}}>
                  Waiting for host to reveal the answer...
                </div>
              )}
            </div>
          )}

          {/* Host "Next Question" Action */}
          {isHostMode && !revealed && (
            <div style={{ textAlign: "center", marginTop: 30 }}>
              <button
                style={{ padding: "16px 32px", fontSize: "20px", background: "#00D2D3", color: "#16213E", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
                onClick={handleHostNext}
              >
                {current + 1 === total ? "Reveal & End Game" : "Reveal & Next Question \u2192"}
              </button>
            </div>
          )}
        </main>
        
        {isHostMode && leaderboard && (
           <div style={{ 
              width: "600px", 
              background: "#252A4A", 
              border: "1px solid #0F3460",
              borderRadius: "24px",
              margin: "32px 32px 32px 0",
              display: "flex", 
              flexDirection: "column",
              padding: "24px",
              boxShadow: "0 12px 48px rgba(0,0,0,0.3)",
              maxHeight: "calc(100vh - 160px)",
              overflowY: "auto"
           }}>
              <h2 style={{ margin: "0 0 24px 0", fontSize: "32px", color: "#F1F2F6", fontFamily: "'Syne', sans-serif", borderBottom: "1px solid #16213E", paddingBottom: "16px" }}>
                Live Leaderboard
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {Object.entries(leaderboard)
                  .sort(([, a], [, b]) => b - a)
                  .map(([name, score], i) => {
                    const playerStreak = streaks && streaks[name] ? streaks[name] : 0;
                    const isOnStreak = playerStreak >= 2;
                    
                    return (
                      <div key={name} style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        padding: "20px", 
                        background: isOnStreak ? "linear-gradient(90deg, rgba(255,159,67,0.1), rgba(255,107,107,0.1))" : "#16213E", 
                        borderRadius: "16px",
                        border: isOnStreak ? "1px solid #FF9F43" : "1px solid #0F3460",
                        position: "relative",
                        animation: isOnStreak ? "firePulse 1.5s infinite alternate" : "none"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <span style={{ 
                            fontSize: "24px", 
                            fontWeight: "bold", 
                            color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#B0BAC3",
                            width: "36px"
                          }}>
                            {i + 1}.
                          </span>
                          <span style={{ fontSize: "24px", fontWeight: "600", color: "#F1F2F6" }}>
                            {name}
                          </span>
                          {isOnStreak && <span style={{ fontSize: "20px", filter: "drop-shadow(0 0 4px rgba(255,159,67,0.8))" }}>🔥 {playerStreak}</span>}
                        </div>
                        <span style={{ fontSize: "24px", fontWeight: "bold", color: "#00D2D3" }}>
                          {score}
                        </span>
                      </div>
                    );
                })}
              </div>
           </div>
        )}
      </div>

      <style>{`
        @keyframes firePulse {
          0% { box-shadow: 0 0 5px rgba(255, 107, 107, 0.2); border-color: rgba(255, 159, 67, 0.5); }
          100% { box-shadow: 0 0 15px rgba(255, 107, 107, 0.6); border-color: rgba(255, 159, 67, 1); }
        }
        @keyframes slideUp {
            from { opacity:0; transform: translateY(16px); }
            to   { opacity:1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

const styles = {
  page: {
    minHeight: "100vh",
    background: "#1A1A2E",
    color: "#F1F2F6",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
    gap: "24px",
    background: "#16213E",
    borderBottom: "1px solid #1e1e2e",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 32px",
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "24px",
    color: "#F1F2F6",
    letterSpacing: "-0.5px",
  },
  scoreChip: {
    background: "#1a1a2e",
    borderRadius: "20px",
    padding: "6px 14px",
    fontSize: "14px",
    color: "#F1F2F6",
    fontWeight: 500,
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "48px 30px 60px",
    maxWidth: "1600px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  questionCard: {
    background: "#252A4A",
    border: "1px solid #0F3460",
    borderRadius: "32px",
    padding: "100px 60px",
    width: "100%",
    marginBottom: "60px",
    animation: "slideUp 0.35s ease both",
    boxSizing: "border-box",
    textAlign: "center",
    boxShadow: "0 12px 48px rgba(0,0,0,0.3)",
  },
  qNumber: {
    display: "inline-block",
    background: "rgba(124, 111, 255, 0.15)",
    padding: "8px 24px",
    borderRadius: "20px",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "20px",
    color: "#00D2D3",
    marginBottom: "32px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  questionText: {
    fontSize: "64px",
    fontWeight: 700,
    lineHeight: 1.3,
    margin: 0,
    color: "#F1F2F6",
    fontFamily: "'Syne', sans-serif",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "32px",
    width: "100%",
    marginBottom: "32px",
  },
  choiceBtn: {
    display: "flex",
    alignItems: "center",
    gap: "32px",
    padding: "40px 48px",
    borderRadius: "24px",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "clamp(32px, 4vw, 56px)",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    color: "#16213E",
    transition: "opacity 0.2s, transform 0.15s, outline 0.1s",
    height: "240px",
    maxHeight: "240px",
    overflow: "hidden",
  },
  choiceShape: {
    fontSize: "48px",
    flexShrink: 0,
    opacity: 0.85,
  },
  choiceText: {
    flex: 1,
    lineHeight: 1.3,
    wordBreak: "break-word",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 4,
    WebkitBoxOrient: "vertical",
  },
  tick: {
    fontSize: "40px",
    fontWeight: 700,
    flexShrink: 0,
  },
  cross: {
    fontSize: "36px",
    flexShrink: 0,
    opacity: 0.7,
  },
  feedbackRow: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    animation: "slideUp 0.3s ease both",
  },
  feedbackCorrect: {
    background: "#0e2e0e",
    border: "1px solid #26890c",
    color: "#5dd85d",
    borderRadius: "10px",
    padding: "14px 20px",
    fontSize: "15px",
    fontWeight: 500,
    textAlign: "center",
  },
  feedbackWrong: {
    background: "#1e0e0e",
    border: "1px solid #6b1a1a",
    color: "#ff7070",
    borderRadius: "10px",
    padding: "14px 20px",
    fontSize: "15px",
    fontWeight: 500,
    textAlign: "center",
  },
  nextBtn: {
    background: "#00D2D3",
    color: "#16213E",
    border: "none",
    borderRadius: "12px",
    padding: "16px",
    fontSize: "16px",
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    width: "100%",
  },
  miniLeaderboard: {
    background: "#1a1a2e",
    border: "1px solid #0F3460",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "#F1F2F6",
  },
};

