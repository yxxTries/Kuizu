import React, { useState } from "react";
import { lookupSharedQuiz, saveMyGame } from "./api.js";
import { useTheme } from "./ThemeContext.jsx";
import { FONTS } from "./theme.js";

export default function ShareCodeEntry({ user, onRequireAuth, onQuizCopied }) {
  const { colors: COLORS } = useTheme();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loggedIn = Boolean(user);

  const handleLookup = async (e) => {
    e.preventDefault();
    const code = input.trim();
    if (!code) return;
    setLoading(true);
    setError("");
    setQuiz(null);
    setFeedback("");
    try {
      const result = await lookupSharedQuiz(code);
      setQuiz(result);
    } catch (err) {
      setError(err?.message || "Quiz not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!quiz || !loggedIn) return;
    setLoading(true);
    setError("");
    try {
      await saveMyGame({ title: quiz.title, category: quiz.category, quiz: quiz.quiz });
      setFeedback("Copied to My Games!");
      setQuiz(null);
      setInput("");
      if (onQuizCopied) onQuizCopied();
    } catch (err) {
      setError(err?.message || "Could not save.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
    setError("");
    setFeedback("");
  };

  return (
    <div style={{ padding: "12px 0 0", borderTop: `1px solid ${COLORS.border}`, marginTop: 12 }}>
      {feedback && (
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.sageDark, marginBottom: 8, padding: "6px 10px", background: COLORS.sageSoft, borderRadius: 8, border: `1px solid ${COLORS.sageDark}`, cursor: "pointer" }} onClick={() => setFeedback("")}>
          {feedback}
        </div>
      )}

      {quiz ? (
        <div style={{ padding: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Found Quiz</div>
          <div style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 700, color: COLORS.ink, marginBottom: 2 }}>{quiz.title}</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 10 }}>
            {quiz.author && <span>{quiz.author} · </span>}
            {quiz.category} · {quiz.questions_count} questions
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {loggedIn ? (
              <button onClick={handleCopy} disabled={loading} style={copyBtnStyle(COLORS)}>
                {loading ? "Copying..." : "Copy to My Games"}
              </button>
            ) : (
              <button onClick={onRequireAuth} style={signInBtnStyle(COLORS)}>
                Sign In to Copy
              </button>
            )}
            <button onClick={() => { setQuiz(null); setError(""); }} style={cancelBtnStyle(COLORS)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleLookup}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            Enter Share Code
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={input}
              onChange={handleInputChange}
              maxLength={8}
              placeholder="AB3XK9"
              style={{
                border: `1px solid ${error ? COLORS.coral : COLORS.border}`,
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "monospace",
                letterSpacing: 2,
                background: COLORS.cream,
                color: COLORS.ink,
                outline: "none",
                width: "100%",
                textTransform: "uppercase",
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: COLORS.yellow,
                color: COLORS.ink,
                border: `1px solid ${COLORS.yellowDark}`,
                borderBottom: `3px solid ${COLORS.yellowDark}`,
                borderRadius: 8,
                padding: "8px 16px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: FONTS.display,
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >
              {loading ? "..." : "Go"}
            </button>
          </div>
          {error && (
            <div style={{ fontSize: 12, color: COLORS.coralDark, fontWeight: 600, marginTop: 6 }}>{error}</div>
          )}
        </form>
      )}
    </div>
  );
}

function copyBtnStyle(COLORS) {
  return {
    background: COLORS.sageDark,
    color: COLORS.creamSoft,
    border: "none",
    borderBottom: "3px solid #375031",
    borderRadius: 8,
    padding: "8px 14px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: FONTS.display,
  };
}

function signInBtnStyle(COLORS) {
  return {
    background: COLORS.blue,
    color: COLORS.creamSoft,
    border: "none",
    borderBottom: `3px solid ${COLORS.blueDark}`,
    borderRadius: 8,
    padding: "8px 14px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: FONTS.display,
  };
}

function cancelBtnStyle(COLORS) {
  return {
    background: "transparent",
    color: COLORS.inkMuted,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: "8px 14px",
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
  };
}
