import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import EditMetaModal from "./EditMetaModal.jsx";
import { deleteDiscoverPost, getDiscoverPosts, getMyGames, updateDiscoverPost } from "./api";
import { useTheme } from "./ThemeContext.jsx";
import { FONTS } from "./theme.js";

// ─── Category Color Map ───
const CATEGORY_COLORS = {
  Science:  { gradient: "linear-gradient(135deg, #7FA3C9 0%, #4A7FA0 100%)", bg: "#D8E4F0", accent: "#5A7FA8", text: "#1A2A3A" },
  History:  { gradient: "linear-gradient(135deg, #F0D78C 0%, #C9A84C 100%)", bg: "#FCEFC4", accent: "#C9A84C", text: "#2A1A0A" },
  Math:     { gradient: "linear-gradient(135deg, #E89B8C 0%, #C06050 100%)", bg: "#F6D6CD", accent: "#C06050", text: "#2A0A0A" },
  Gaming:   { gradient: "linear-gradient(135deg, #B19CD9 0%, #7B4FA0 100%)", bg: "#D9CCF0", accent: "#7B4FA0", text: "#1A0A2A" },
  Language: { gradient: "linear-gradient(135deg, #6BBFA0 0%, #3A7B5A 100%)", bg: "#CCE8DA", accent: "#3A7B5A", text: "#0A2A1A" },
  Business: { gradient: "linear-gradient(135deg, #4A6FA5 0%, #1E3A6A 100%)", bg: "#CCD8E8", accent: "#1E3A6A", text: "#FFFFFF" },
  General:  { gradient: "linear-gradient(135deg, #A8C3A0 0%, #6B8A60 100%)", bg: "#DFEAD9", accent: "#6B8A60", text: "#0A2A0A" },
  default:  { gradient: "linear-gradient(135deg, #C4A882 0%, #8B6B4A 100%)", bg: "#E8DCC8", accent: "#8B6B4A", text: "#1A1A0A" },
};

function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;
}

const CATEGORIES = ["Science", "History", "Math", "Gaming", "Language", "Business", "General", "Other"];

// ─── HeroBanner ───
function HeroBanner({ post, onPlay, styles, COLORS }) {
  if (!post) return null;
  const catColor = getCategoryColor(post.category);
  const title = post.title || "Untitled";
  return (
    <div style={{ ...styles.hero, background: catColor.gradient }}>
      <div style={styles.heroOverlay} />
      <div style={styles.heroContent}>
        <span style={{ ...styles.heroKicker, background: "rgba(0,0,0,0.4)", color: "#FFFFFF" }}>FEATURED</span>
        <h1 style={styles.heroTitle}>{title}</h1>
        <div style={styles.heroMeta}>
          {post.author && <span style={styles.heroMetaItem}>{post.author}</span>}
          <span style={styles.heroMetaItem}>{post.questions_count || post.quiz?.questions?.length || 0} questions</span>
          {post.difficulty && <span style={{ ...styles.heroMetaItem, background: "rgba(255,255,255,0.15)", padding: "2px 10px", borderRadius: 999 }}>{post.difficulty}</span>}
          {post.estimated_time && <span style={styles.heroMetaItem}>{post.estimated_time}</span>}
          {typeof post.plays === "number" && post.plays > 0 && <span style={styles.heroMetaItem}>{post.plays} plays</span>}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button className="wiz-arcade" style={styles.heroBtn} onClick={(e) => { e.stopPropagation(); onPlay(post); }}>Play Now</button>
        </div>
      </div>
    </div>
  );
}

// ─── QuizCardLarge ───
function QuizCardLarge({ post, onPlay, styles, COLORS }) {
  const catColor = getCategoryColor(post.category);
  const title = post.title || "Untitled";
  const author = post.author || "Unknown";
  return (
    <div style={styles.cardLarge} onClick={() => onPlay(post)} className="wiz-arcade">
      <div style={{ ...styles.cardLargeTop, background: catColor.gradient }}>
        <span style={styles.cardLargeCategory}>{post.category}</span>
      </div>
      <div style={styles.cardLargeBody}>
        <h3 style={styles.cardLargeTitle}>{title}</h3>
        <div style={styles.cardLargeMeta}>
          <span>{author}</span>
          <span>{post.questions_count || 0} Q</span>
          {post.difficulty && <span>{post.difficulty}</span>}
        </div>
        <div style={styles.cardLargeFooter}>
          <span style={{ fontSize: 12, color: COLORS.inkSoft, fontWeight: 600 }}>{typeof post.plays === "number" ? `${post.plays} plays` : ""}</span>
          <button className="wiz-arcade" style={styles.cardPlayBtn} onClick={(e) => { e.stopPropagation(); onPlay(post); }}>Play</button>
        </div>
      </div>
    </div>
  );
}

function QuizCardCompact({ post, onPlay, styles, COLORS }) {
  const catColor = getCategoryColor(post.category);
  const title = post.title || "Untitled";
  return (
    <div style={{ ...styles.cardCompact, borderLeft: `4px solid ${catColor.accent}` }} onClick={() => onPlay(post)} className="wiz-arcade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <span style={{ ...styles.cardCompactCat, color: catColor.accent }}>{post.category}</span>
      </div>
      <h4 style={styles.cardCompactTitle}>{title}</h4>
      <div style={styles.cardCompactMeta}>
        <span>{post.questions_count || 0} Q</span>
        {post.difficulty && <span>{post.difficulty}</span>}
        {typeof post.plays === "number" && post.plays > 0 && <span>{post.plays} plays</span>}
      </div>
    </div>
  );
}

// ─── SectionRow ───
function SectionRow({ title, subtitle, posts, onPlay, renderCard, styles, COLORS }) {
  if (!posts || posts.length === 0) return null;
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>{title}</h2>
          {subtitle && <p style={styles.sectionSub}>{subtitle}</p>}
        </div>
      </div>
      <div className="discover-scroll" style={styles.scrollRow}>
        {posts.map((post) => (
          <div key={post.id} style={{ flexShrink: 0 }}>
            {renderCard(post, onPlay, styles, COLORS)}
          </div>
        ))}
        {posts.length <= 2 && (
          <div style={{ flexShrink: 0, minWidth: 80, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: COLORS.inkSoft, opacity: 0.6, gap: 8 }}>
            <span style={{ fontSize: 32 }}>{title === "Continue Learning" ? "~" : title === "Popular" ? "*" : "~"}</span>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: FONTS.display }}>More coming soon</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SearchBar ───
function SearchBar({ search, onSearchChange, showMyPosts, onMyPostsToggle, selectedGenre, onGenreSelect, onCreate, styles, COLORS }) {
  const allGenres = ["All", ...CATEGORIES];
  return (
    <div style={styles.searchBarWrap}>
      <div style={{ display: "flex", gap: 10, alignItems: "stretch", marginBottom: 14 }}>
        <div style={{ ...styles.searchInputWrap, flex: 1 }}>
          <span style={styles.searchIcon}>/</span>
          <input
            style={styles.searchInput}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search quizzes..."
          />
          {search && (
            <button style={styles.searchClear} onClick={() => onSearchChange("")}>✕</button>
          )}
        </div>
        <button
          className="wiz-arcade"
          style={styles.createBtn}
          onClick={onCreate}
        >
          + Create
        </button>
      </div>
      <div style={styles.genreScroll}>
        {allGenres.map((genre) => (
          <button
            key={genre}
            className="wiz-arcade"
            style={{ ...styles.genreChip, ...(selectedGenre === genre ? styles.genreChipActive : {}) }}
            onClick={() => onGenreSelect(genre === selectedGenre ? "All" : genre)}
          >
            {genre}
          </button>
        ))}
        <button
          className="wiz-arcade"
          style={{ ...styles.genreChip, ...(showMyPosts ? styles.genreChipMyActive : {}) }}
          onClick={() => onMyPostsToggle(!showMyPosts)}
        >
          {showMyPosts ? "✓ My Posts" : "My Posts"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Discover Component ───

export default function Discover({ onPlay, user, onRequireAuth, onCreate }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => buildStyles(COLORS), [COLORS]);

  const [search, setSearch] = useState("");
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [posts, setPosts] = useState([]);
  const [myGames, setMyGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [editingPost, setEditingPost] = useState(null);

  const [heroPost, setHeroPost] = useState(null);

  const loggedIn = Boolean(user);

  // ── Fetch ──
  const fetchPosts = useCallback(async () => {
    try {
      const payload = await getDiscoverPosts();
      const allPosts = Array.isArray(payload?.posts) ? payload.posts : [];
      setPosts(allPosts);
      setError("");
      setHeroPost(allPosts.length > 0 ? allPosts[Math.floor(Math.random() * allPosts.length)] : null);
    } catch (e) {
      setPosts([]);
      setHeroPost(null);
      setError("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    if (loggedIn) {
      getMyGames().then(p => {
        setMyGames(Array.isArray(p?.games) ? p.games : []);
      }).catch(() => {});
    }
  }, [loggedIn]);

  // ── Filter & Group ──
  const allPosts = useMemo(() => {
    let filtered = posts;
    if (showMyPosts && user) {
      filtered = filtered.filter(p => p.user_id === user.id);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.author?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [posts, search, showMyPosts, user]);

  const postsByCategory = useMemo(() => {
    const map = {};
    CATEGORIES.forEach(cat => { if (cat !== "All") map[cat] = []; });
    allPosts.forEach(p => {
      const cat = p.category || "Other";
      if (map[cat]) map[cat].push(p);
      else map["Other"].push(p);
    });
    return map;
  }, [allPosts]);

  const popularPosts = useMemo(() => {
    return [...allPosts].filter(p => (p.plays || 0) > 0).sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10);
  }, [allPosts]);

  const newestPosts = useMemo(() => {
    return [...allPosts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
  }, [allPosts]);

  const continuePosts = useMemo(() => {
    if (!loggedIn || myGames.length === 0) return [];
    const savedCats = new Set(myGames.map(g => g.category).filter(Boolean));
    return allPosts.filter(p => savedCats.has(p.category)).slice(0, 8);
  }, [allPosts, myGames, loggedIn]);

  const [populatedCats, setPopulatedCats] = useState([]);
  useEffect(() => {
    const cats = CATEGORIES.filter(cat => (postsByCategory[cat] || []).length > 0);
    setPopulatedCats(cats);
  }, [postsByCategory]);

  // ── Handlers ──
  const handlePlay = (post) => {
    onPlay(post);
  };

  const handleRemove = (post) => {
    setPosts(prev => prev.filter(p => p.id !== post.id));
    if (heroPost?.id === post.id) setHeroPost(null);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    setDeleteLoadingId(postId);
    try { await deleteDiscoverPost(postId); setFeedback("Post deleted."); setPosts(prev => prev.filter(p => p.id !== postId)); }
    catch (e) { setFeedback(e?.message || "Could not delete."); }
    finally { setDeleteLoadingId(null); }
  };

  const handleConfirmEdit = async ({ title, category }) => {
    if (!editingPost) return;
    try {
      await updateDiscoverPost(editingPost.id, { title, category });
      setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, title, category } : p));
      setFeedback("Post updated.");
    } catch (e) { setFeedback(e?.message || "Could not update."); }
    finally { setEditingPost(null); }
  };

  if (loading) {
    return <div style={styles.page}><div style={styles.loadingState}>Loading discover…</div></div>;
  }

  return (
    <div style={styles.page} className="discover-page">
      <Helmet><title>Discover — Kuizu</title></Helmet>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .discover-scroll::-webkit-scrollbar { height: 4px; }
        .discover-scroll::-webkit-scrollbar-track { background: transparent; }
        .discover-scroll::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
        .discover-scroll { scrollbar-width: thin; scrollbar-color: ${COLORS.border} transparent; }
        @media (max-width: 600px) {
          .hero-title { font-size: clamp(24px, 6vw, 36px) !important; }
        }
      `}</style>

      {feedback && (
        <div style={styles.feedbackBanner} onClick={() => setFeedback("")}>
          {feedback}
          <button style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>✕</button>
        </div>
      )}

      {error && (
        <div style={styles.errorBanner}>
          <span>{error}</span>
          <button style={styles.retryBtn} onClick={fetchPosts}>Retry</button>
        </div>
      )}

      <SearchBar
        search={search}
        onSearchChange={setSearch}
        showMyPosts={showMyPosts}
        onMyPostsToggle={setShowMyPosts}
        selectedGenre={selectedGenre}
        onGenreSelect={setSelectedGenre}
        onCreate={onCreate}
        styles={styles}
        COLORS={COLORS}
      />

      {showMyPosts && !loggedIn ? (
        <div style={styles.authPrompt}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}></div>
          <h2 style={styles.authTitle}>Sign in to view your posts</h2>
          <p style={styles.authText}>You need to be signed in to see your published quizzes.</p>
          <button type="button" className="wiz-arcade" style={styles.authBtn} onClick={onRequireAuth}>Sign In</button>
        </div>
      ) : (
        <>
          {/* Hero */}
          <HeroBanner post={heroPost} onPlay={handlePlay} styles={styles} COLORS={COLORS} />

          {/* Popular */}
          {selectedGenre === "All" && !showMyPosts && (
            <SectionRow
              title="Popular"
              subtitle="Most played quizzes"
              posts={popularPosts}
              onPlay={handlePlay}
              renderCard={(post, op, st, c) => <QuizCardLarge post={post} onPlay={op} styles={st} COLORS={c} />}
              styles={styles}
              COLORS={COLORS}
            />
          )}

          {/* Continue Learning */}
          {selectedGenre === "All" && !showMyPosts && continuePosts.length > 0 && (
            <SectionRow
              title="Continue Learning"
              subtitle="Based on your saved quizzes"
              posts={continuePosts}
              onPlay={handlePlay}
              renderCard={(post, op, st, c) => <QuizCardLarge post={post} onPlay={op} styles={st} COLORS={c} />}
              styles={styles}
              COLORS={COLORS}
            />
          )}

          {/* New Arrivals */}
          {selectedGenre === "All" && !showMyPosts && (
            <SectionRow
              title="New Arrivals"
              subtitle="Freshly added quizzes"
              posts={newestPosts}
              onPlay={handlePlay}
              renderCard={(post, op, st, c) => <QuizCardLarge post={post} onPlay={op} styles={st} COLORS={c} />}
              styles={styles}
              COLORS={COLORS}
            />
          )}

          {/* Genre Rows */}
          {selectedGenre === "All" ? (
            populatedCats.map(cat => (
              <SectionRow
                key={cat}
                title={cat}
                posts={postsByCategory[cat]}
                onPlay={handlePlay}
                renderCard={(post, op, st, c) => <QuizCardCompact post={post} onPlay={op} styles={st} COLORS={c} />}
                styles={styles}
                COLORS={COLORS}
              />
            ))
          ) : (
            <SectionRow
              title={selectedGenre}
              posts={postsByCategory[selectedGenre] || []}
              onPlay={handlePlay}
              renderCard={(post, op, st, c) => <QuizCardLarge post={post} onPlay={op} styles={st} COLORS={c} />}
              styles={styles}
              COLORS={COLORS}
            />
          )}

          {allPosts.length === 0 && !loading && (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>--</div>
              <h3 style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>No quizzes found</h3>
              <p style={{ color: COLORS.inkMuted, margin: 0 }}>{search ? "Try a different search term." : "Be the first to share a quiz!"}</p>
            </div>
          )}
        </>
      )}

      <EditMetaModal
        open={Boolean(editingPost)}
        initialTitle={editingPost?.title || ""}
        initialCategory={editingPost?.category || "General"}
        questionCount={editingPost?.questions_count || 0}
        loading={false}
        onClose={() => setEditingPost(null)}
        onConfirm={handleConfirmEdit}
      />
    </div>
  );
}

// ─── Styles ───

const buildStyles = (COLORS) => ({
  page: {
    minHeight: "100vh",
    background: COLORS.cream,
    color: COLORS.ink,
    fontFamily: FONTS.body,
    padding: "72px clamp(16px, 4vw, 40px) 80px",
  },
  loadingState: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
    color: COLORS.inkMuted,
    fontSize: 16,
    fontWeight: 600,
  },

  // ── Search Bar ──
  searchBarWrap: {
    marginBottom: 28,
    animation: "fadeUp 0.35s ease both",
  },
  searchInputWrap: {
    display: "flex",
    alignItems: "center",
    background: COLORS.creamSoft,
    border: `1px solid ${COLORS.border}`,
    borderBottom: `4px solid ${COLORS.border}`,
    borderRadius: 999,
    padding: "0 18px",
    boxShadow: `0 5px 0 ${COLORS.borderSoft}, 0 4px 12px rgba(42,51,64,0.04)`,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
    color: COLORS.inkSoft,
    opacity: 0.75,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    border: "none",
    background: "transparent",
    color: COLORS.ink,
    padding: "14px 0",
    fontSize: 15,
    outline: "none",
    fontFamily: "inherit",
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  searchClear: {
    background: COLORS.borderSoft,
    border: "none",
    borderRadius: 999,
    width: 24,
    height: 24,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.inkMuted,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  createBtn: {
    background: COLORS.blue,
    color: COLORS.creamSoft,
    border: "none",
    borderBottom: `4px solid ${COLORS.blueDark}`,
    borderRadius: 999,
    padding: "0 24px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
    whiteSpace: "nowrap",
    boxShadow: `0 5px 0 ${COLORS.blueDark}, 0 6px 16px rgba(90,127,168,0.25)`,
    transition: "transform 0.12s ease, box-shadow 0.12s ease",
    minHeight: 48,
  },
  genreScroll: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 4,
  },
  genreChip: {
    flexShrink: 0,
    background: COLORS.creamSoft,
    color: COLORS.inkSoft,
    border: `1px solid ${COLORS.border}`,
    borderBottom: `3px solid ${COLORS.border}`,
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
    transition: "all 0.12s ease",
    boxShadow: `0 3px 0 ${COLORS.borderSoft}`,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 160,
  },
  genreChipActive: {
    background: COLORS.blue,
    color: COLORS.creamSoft,
    borderColor: COLORS.blueDark,
    borderBottomColor: COLORS.blueDark,
    fontWeight: 700,
    boxShadow: `0 3px 0 ${COLORS.blueDark}, 0 4px 10px rgba(90,127,168,0.25)`,
  },
  genreChipMyActive: {
    background: COLORS.yellow,
    color: COLORS.ink,
    borderColor: COLORS.yellowDark,
    borderBottomColor: COLORS.yellowDark,
    fontWeight: 700,
    boxShadow: `0 3px 0 ${COLORS.yellowDark}, 0 4px 10px rgba(232,199,107,0.25)`,
  },

  // ── Hero ──
  hero: {
    position: "relative",
    borderRadius: 24,
    overflow: "hidden",
    minHeight: 260,
    display: "flex",
    alignItems: "flex-end",
    marginBottom: 36,
    animation: "fadeUp 0.4s ease both",
    borderBottom: "4px solid rgba(0,0,0,0.2)",
    boxShadow: "0 8px 32px rgba(42,51,64,0.18)",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)",
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
    padding: "32px clamp(20px, 5vw, 40px)",
    width: "100%",
  },
  heroKicker: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: "uppercase",
    padding: "4px 12px",
    borderRadius: 999,
    marginBottom: 12,
    fontFamily: FONTS.display,
  },
  heroTitle: {
    fontFamily: FONTS.display,
    fontSize: "clamp(28px, 5vw, 48px)",
    fontWeight: 700,
    color: "#FFFFFF",
    margin: "0 0 12px",
    lineHeight: 1.1,
    textShadow: "0 2px 8px rgba(0,0,0,0.3)",
    overflowWrap: "break-word",
    wordBreak: "break-word",
  },
  heroMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  heroMetaItem: {
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(255,255,255,0.9)",
    fontFamily: FONTS.body,
  },
  heroBtn: {
    background: COLORS.cream,
    color: COLORS.ink,
    border: "none",
    borderBottom: "4px solid rgba(0,0,0,0.15)",
    borderRadius: 999,
    padding: "14px 36px",
    fontWeight: 700,
    fontSize: 16,
    cursor: "pointer",
    fontFamily: FONTS.display,
    letterSpacing: 1,
    transition: "transform 0.12s ease, box-shadow 0.12s ease",
    boxShadow: "0 5px 0 rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.2)",
    textTransform: "uppercase",
  },
  heroRemoveBtn: {
    background: "rgba(255,80,80,0.2)",
    color: "#FFB3B3",
    border: "1px solid rgba(255,100,100,0.3)",
    borderBottom: "3px solid rgba(255,80,80,0.2)",
    borderRadius: 999,
    padding: "10px 20px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
  },
  cardMiniBtn: {
    background: COLORS.creamSoft,
    color: COLORS.inkSoft,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 999,
    width: 24,
    height: 24,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: FONTS.display,
    padding: 0,
  },
  cardMiniRemove: {
    background: "rgba(255,80,80,0.15)",
    color: COLORS.coralDark,
    border: "1px solid rgba(255,80,80,0.2)",
    borderRadius: 999,
    width: 24,
    height: 24,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: FONTS.display,
    padding: 0,
  },
  seedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 3,
    background: "rgba(0,0,0,0.55)",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 999,
    letterSpacing: 1,
    fontFamily: FONTS.display,
  },
  seedBadgeSm: {
    background: "rgba(255,255,255,0.25)",
    color: "inherit",
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 999,
    letterSpacing: 0.5,
    fontFamily: FONTS.display,
  },

  // ── Section ──
  section: {
    marginBottom: 36,
    animation: "fadeUp 0.5s ease both",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: "clamp(18px, 3vw, 22px)",
    fontWeight: 700,
    color: COLORS.ink,
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  sectionSub: {
    fontSize: 13,
    color: COLORS.inkSoft,
    margin: "2px 0 0",
    fontWeight: 500,
  },
  scrollRow: {
    display: "flex",
    gap: 14,
    overflowX: "auto",
    paddingBottom: 8,
  },

  // ── Large Card ──
  cardLarge: {
    width: 220,
    position: "relative",
    background: COLORS.creamSoft,
    border: `1px solid ${COLORS.border}`,
    borderBottom: `4px solid ${COLORS.border}`,
    borderRadius: 16,
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: `0 5px 0 ${COLORS.borderSoft}, 0 6px 16px rgba(42,51,64,0.06)`,
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    display: "flex",
    flexDirection: "column",
  },
  cardLargeTop: {
    height: 80,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "12px 14px 0",
    minWidth: 0,
  },
  cardLargeCategory: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#FFFFFF",
    fontFamily: FONTS.display,
    textShadow: "0 1px 3px rgba(0,0,0,0.2)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 140,
  },
  cardLargeBody: {
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  cardLargeTitle: {
    fontFamily: FONTS.display,
    fontSize: 15,
    fontWeight: 700,
    color: COLORS.ink,
    margin: "0 0 8px",
    lineHeight: 1.25,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardLargeMeta: {
    display: "flex",
    gap: 10,
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.inkSoft,
    flexWrap: "wrap",
    overflow: "hidden",
  },
  cardLargeFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 10,
    minWidth: 0,
    gap: 8,
  },
  cardPlayBtn: {
    background: COLORS.sageDark,
    color: COLORS.ink,
    border: "none",
    borderBottom: "3px solid #375031",
    borderRadius: 999,
    padding: "6px 16px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
    boxShadow: "0 3px 0 #375031, 0 3px 8px rgba(55,80,49,0.2)",
    transition: "transform 0.12s ease, box-shadow 0.12s ease",
  },

  // ── Compact Card ──
  cardCompact: {
    width: 170,
    minWidth: 0,
    background: COLORS.creamSoft,
    border: `1px solid ${COLORS.border}`,
    borderBottom: `4px solid ${COLORS.border}`,
    borderRadius: 14,
    padding: "14px",
    cursor: "pointer",
    boxShadow: `0 5px 0 ${COLORS.borderSoft}, 0 5px 12px rgba(42,51,64,0.05)`,
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    overflow: "hidden",
  },
  cardCompactCat: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: FONTS.display,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardCompactTitle: {
    fontFamily: FONTS.display,
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.ink,
    margin: 0,
    lineHeight: 1.2,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    overflowWrap: "break-word",
  },
  cardCompactMeta: {
    display: "flex",
    gap: 8,
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.inkSoft,
    flexWrap: "wrap",
    overflow: "hidden",
  },

  // ── Feedback / Error ──
  feedbackBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    border: `1px solid ${COLORS.sageDark}`,
    background: COLORS.sageSoft,
    color: COLORS.quizPositive,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 16,
    cursor: "pointer",
  },
  errorBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    border: `1px solid ${COLORS.coral}`,
    background: COLORS.coralSoft,
    color: COLORS.coralDark,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 16,
  },
  retryBtn: {
    background: COLORS.coralDark,
    color: COLORS.creamSoft,
    border: "none",
    borderRadius: 999,
    padding: "6px 14px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: FONTS.display,
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    animation: "fadeUp 0.4s ease both",
  },
  authPrompt: {
    textAlign: "center",
    padding: "60px 20px",
    animation: "fadeUp 0.4s ease both",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    background: COLORS.creamSoft,
    marginTop: 20,
  },
  authTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.ink,
    margin: "0 0 8px",
  },
  authText: {
    color: COLORS.inkMuted,
    margin: "0 0 16px",
    fontSize: 14,
  },
  authBtn: {
    background: COLORS.blue,
    color: COLORS.creamSoft,
    border: "none",
    borderBottom: `4px solid ${COLORS.blueDark}`,
    borderRadius: 999,
    padding: "12px 32px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: FONTS.display,
    letterSpacing: 0.5,
    boxShadow: `0 5px 0 ${COLORS.blueDark}, 0 6px 16px rgba(90,127,168,0.25)`,
    transition: "transform 0.12s ease, box-shadow 0.12s ease",
  },

  // ── Owner actions (inline in cards - removed, handled via preview page) ──
});
