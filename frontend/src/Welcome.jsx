import React from "react";
import { COLORS, FONTS } from "./theme.js";

export default function Welcome({ onSignIn, onCreate, onJoin }) {
  return (
    <div style={styles.page}>
      <style>{`
        .welcome-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          width: 100%;
          max-width: 960px;
        }
        .welcome-card {
          background: ${COLORS.creamSoft};
          border: 1px solid ${COLORS.border};
          border-radius: 20px;
          padding: 56px 28px;
          font-family: ${FONTS.display};
          font-weight: 800;
          font-size: 22px;
          letter-spacing: 0.5px;
          color: ${COLORS.ink};
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .welcome-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(42, 51, 64, 0.12);
        }
        .welcome-card-signin { background: ${COLORS.yellow}; }
        .welcome-card-signin:hover { background: ${COLORS.yellowSoft}; }
        .welcome-card-create { background: ${COLORS.blue}; color: ${COLORS.creamSoft}; }
        .welcome-card-create:hover { background: ${COLORS.blueDark}; }
        .welcome-card-join { background: ${COLORS.sage}; color: ${COLORS.ink}; }
        .welcome-card-join:hover { background: ${COLORS.sageDark}; }

        @media (max-width: 768px) {
          .welcome-grid {
            grid-template-columns: 1fr;
            gap: 14px;
            max-width: 420px;
          }
          .welcome-card {
            min-height: 120px;
            padding: 36px 24px;
            font-size: 20px;
          }
        }
      `}</style>

      <div className="welcome-grid">
        <button
          type="button"
          className="welcome-card welcome-card-signin"
          onClick={onSignIn}
        >
          SIGN IN
        </button>
        <button
          type="button"
          className="welcome-card welcome-card-create"
          onClick={onCreate}
        >
          CREATE GAME
        </button>
        <button
          type="button"
          className="welcome-card welcome-card-join"
          onClick={onJoin}
        >
          JOIN GAME
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: COLORS.cream,
    color: COLORS.ink,
    fontFamily: FONTS.body,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
};
