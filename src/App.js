import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase"; // ← make sure supabase.js is in src/

const N8N_WEBHOOK_URL = "https://arslanalvi.app.n8n.cloud/webhook/87d55049-63da-42d0-99db-dd1940f702a3";

const scholarshipCategories = [
  { id: "merit",    icon: "🏆", label: "Merit Based",          color: "#FFD700", desc: "Academic excellence awards" },
  { id: "abroad",   icon: "✈️",  label: "Study Abroad",         color: "#00C9FF", desc: "International opportunities" },
  { id: "need",     icon: "🤝", label: "Need Based",           color: "#7CFC00", desc: "Financial assistance programs" },
  { id: "sports",   icon: "⚽", label: "Sports",               color: "#FF6B35", desc: "Athletic achievement grants" },
  { id: "stem",     icon: "🔬", label: "STEM",                 color: "#A855F7", desc: "Science & technology focus" },
  { id: "arts",     icon: "🎨", label: "Arts & Culture",       color: "#F472B6", desc: "Creative talent support" },
  { id: "minority", icon: "🌍", label: "Minority & Diversity",  color: "#14B8A6", desc: "Inclusive opportunity grants" },
  { id: "govt",     icon: "🏛️", label: "Government",           color: "#F59E0B", desc: "Official state & federal aid" },
];

const suggestedQuestions = [
  "Find me merit scholarships for engineering students",
  "What study abroad scholarships are available in Germany?",
  "List need-based scholarships for Pakistani students",
  "Show me STEM scholarships for women",
  "Government scholarships deadline 2025",
];

// ── Admin fallback profile ────────────────────────────────────────
const ADMIN_PROFILE = {
  fullName: "Admin User", age: "25", educationLevel: "Masters",
  fieldOfStudy: "Computer Science / IT", cgpa: "3.8",
  financialStatus: "Middle Income", country: "Pakistan",
  city: "Lahore", nationality: "Pakistani",
  workExperience: "2 years", extraCurriculars: "Chess, Coding",
};

// ── Map Supabase DB columns → app format ─────────────────────────
const mapProfile = (p) => ({
  fullName:        p.full_name,
  age:             p.age,
  educationLevel:  p.education_level,
  fieldOfStudy:    p.field_of_study,
  cgpa:            p.cgpa,
  financialStatus: p.financial_status,
  country:         p.country,
  city:            p.city,
  nationality:     p.nationality,
  workExperience:  p.work_experience,
  extraCurriculars:p.extra_curriculars,
});

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage]               = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  // Auth state
  const [authTab, setAuthTab]         = useState("login");
  const [loginForm, setLoginForm]     = useState({ username: "", password: "" });
  const [signupForm, setSignupForm]   = useState({ username: "", password: "", confirm: "" });
  const [authError, setAuthError]     = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Chat state
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const messagesEndRef                = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (page === "chat" && messages.length === 0) {
      const catLabel = scholarshipCategories.find(c => c.id === activeCategory)?.label || "all";
      const p = currentUser?.profile;
      setMessages([{
        role: "assistant",
        text: p
          ? `Hello **${p.fullName || currentUser.username}**! 👋\n\nYou're a **${p.educationLevel}** student in **${p.fieldOfStudy}** from **${p.city}, ${p.country}**.\n\nI'll find **${catLabel}** scholarships tailored to your profile!`
          : `Hello **${currentUser?.username}**! 👋 I'm your scholarship assistant. You're exploring **${catLabel}** scholarships.\n\nAsk me anything — I'll search through curated data to find the best matches!`,
      }]);
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps
  // ── BUILD CONTEXT from user profile ────────────────────────────
  const buildContext = () => {
    const p = currentUser?.profile;
    if (!p) return "";
    return `STUDENT PROFILE:
- Name: ${p.fullName}
- Age: ${p.age}
- Education: ${p.educationLevel}
- Field: ${p.fieldOfStudy}
- CGPA: ${p.cgpa}
- Financial: ${p.financialStatus}
- Location: ${p.city}, ${p.country}
- Nationality: ${p.nationality}
- Work Experience: ${p.workExperience || "None"}
- Extra Curriculars: ${p.extraCurriculars || "None"}
- Category: ${scholarshipCategories.find(c => c.id === activeCategory)?.label || "General"}

IMPORTANT: Only recommend scholarships matching this student's exact profile.

USER QUESTION: `;
  };

  // ── LOGIN ──────────────────────────────────────────────────────
  const handleLogin = async () => {
    setAuthError("");
    const { username, password } = loginForm;
    if (!username || !password) return setAuthError("Please fill in all fields.");

    // Admin shortcut — no Supabase needed
    if (username === "admin" && password === "786") {
      setCurrentUser({ username: "admin", isAdmin: true, profile: ADMIN_PROFILE });
      setPage("dashboard");
      return;
    }

    setAuthLoading(true);
    try {
      // Sign in via Supabase (we store username as email: username@schlr.app)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@schlr.app`,
        password,
      });
      if (error) return setAuthError("Invalid credentials. Please sign up first.");

      // Fetch profile from DB
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      setCurrentUser({
        username,
        isAdmin: false,
        supabaseId: data.user.id,
        profile: profile ? mapProfile(profile) : null,
      });
      setPage("dashboard");
    } catch {
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // ── SIGNUP ──────────────────────────────────────────────────────
  const handleSignup = async () => {
    setAuthError("");
    const { username, password, confirm } = signupForm;
    if (!username || !password || !confirm) return setAuthError("Please fill in all fields.");
    if (password !== confirm) return setAuthError("Passwords do not match.");

    setAuthLoading(true);
    try {
      // Create Supabase auth user
      const { data, error } = await supabase.auth.signUp({
        email: `${username}@schlr.app`,
        password,
      });
      if (error) return setAuthError(error.message);

      // Insert basic profile with just username (no profile form in this version)
      await supabase.from("profiles").insert({
        id:       data.user.id,
        username: username,
        full_name: username, // default until they edit profile
      });

      setCurrentUser({
        username,
        isAdmin: false,
        supabaseId: data.user.id,
        profile: null,
      });
      setPage("dashboard");
    } catch {
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // ── LOGOUT ─────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setLoginForm({ username: "", password: "" });
    setSignupForm({ username: "", password: "", confirm: "" });
    setAuthTab("login");
    setPage("login");
  };

  // ── CHAT ───────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            content: buildContext() + userMsg,
            additional_kwargs: {},
            response_metadata: {},
          }],
        }),
      });
      const data   = await res.json();
      const answer = data?.output || data?.text || data?.answer || JSON.stringify(data);
      setMessages(prev => [...prev, { role: "assistant", text: answer }]);
    } catch (err) {
      console.error("Error:", err);
      setMessages(prev => [...prev, { role: "assistant", text: "⚠️ Could not reach the scholarship database." }]);
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────
  if (page === "login") return (
    <AuthPage
      tab={authTab} setTab={t => { setAuthTab(t); setAuthError(""); }}
      loginForm={loginForm} setLoginForm={setLoginForm}
      signupForm={signupForm} setSignupForm={setSignupForm}
      error={authError} authLoading={authLoading}
      onLogin={handleLogin} onSignup={handleSignup}
    />
  );

  if (page === "dashboard") return (
    <Dashboard
      user={currentUser}
      onSelectCategory={cat => { setActiveCategory(cat); setMessages([]); setPage("chat"); }}
      onLogout={handleLogout}
    />
  );

  if (page === "chat") return (
    <ChatPage
      user={currentUser}
      category={activeCategory}
      messages={messages}
      input={input} setInput={setInput}
      loading={loading}
      onSend={sendMessage}
      onBack={() => setPage("dashboard")}
      suggested={suggestedQuestions}
      messagesEndRef={messagesEndRef}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// AUTH PAGE
// ═══════════════════════════════════════════════════════════════
function AuthPage({ tab, setTab, loginForm, setLoginForm, signupForm, setSignupForm, error, authLoading, onLogin, onSignup }) {
  return (
    <div style={styles.authBg}>
      <div style={{ ...styles.orb, width: 400, height: 400, top: -100, left: -100, background: "radial-gradient(circle, #00C9FF33 0%, transparent 70%)" }} />
      <div style={{ ...styles.orb, width: 300, height: 300, bottom: -50, right: -50, background: "radial-gradient(circle, #A855F733 0%, transparent 70%)" }} />

      <div style={styles.authCard}>
        {/* Logo */}
        <div style={styles.authLogo}>
          <span style={styles.authLogoIcon}>🎓</span>
          <div>
            <div style={styles.authLogoTitle}>SCHLR</div>
            <div style={styles.authLogoSub}>Your AI Scholarship Navigator</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.authTabs}>
          {["login", "signup"].map(t => (
            <button key={t} style={{ ...styles.authTab, ...(tab === t ? styles.authTabActive : {}) }} onClick={() => setTab(t)}>
              {t === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {tab === "login" ? (
          <div>
            <AuthInput icon="👤" placeholder="Username"  value={loginForm.username} onChange={v => setLoginForm(p => ({ ...p, username: v }))} />
            <AuthInput icon="🔒" placeholder="Password" type="password" value={loginForm.password} onChange={v => setLoginForm(p => ({ ...p, password: v }))} onEnter={onLogin} />
            {error && <div style={styles.authError}>{error}</div>}
            <button style={{ ...styles.authBtn, opacity: authLoading ? 0.7 : 1 }} onClick={onLogin} disabled={authLoading}>
              {authLoading ? "Signing in…" : "Sign In →"}
            </button>
            <div style={styles.authHint}>Admin: <code style={{ color: "#00C9FF" }}>admin / 786</code></div>
          </div>
        ) : (
          <div>
            <AuthInput icon="👤" placeholder="Choose a username"  value={signupForm.username} onChange={v => setSignupForm(p => ({ ...p, username: v }))} />
            <AuthInput icon="🔒" placeholder="Create password"   type="password" value={signupForm.password} onChange={v => setSignupForm(p => ({ ...p, password: v }))} />
            <AuthInput icon="✅" placeholder="Confirm password"  type="password" value={signupForm.confirm}  onChange={v => setSignupForm(p => ({ ...p, confirm: v }))}  onEnter={onSignup} />
            {error && <div style={styles.authError}>{error}</div>}
            <button style={{ ...styles.authBtn, opacity: authLoading ? 0.7 : 1 }} onClick={onSignup} disabled={authLoading}>
              {authLoading ? "Creating account…" : "Create Account →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthInput({ icon, placeholder, type = "text", value, onChange, onEnter }) {
  return (
    <div style={styles.inputWrap}>
      <span style={styles.inputIcon}>{icon}</span>
      <input
        style={styles.input} type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onEnter && onEnter()}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
function Dashboard({ user, onSelectCategory, onLogout }) {
  const [hovered, setHovered] = useState(null);
  const p = user?.profile;

  return (
    <div style={styles.dashBg}>
      <div style={styles.dashOrb1} />
      <div style={styles.dashOrb2} />

      <header style={styles.header}>
        <div style={styles.headerLogo}>🎓 <span style={{ color: "#00C9FF", fontWeight: 700 }}>SCHLR</span></div>
        <div style={styles.headerRight}>
          <div style={styles.headerUser}>
            <span style={styles.userAvatar}>{(p?.fullName || user.username)[0].toUpperCase()}</span>
            <div>
              <div style={{ color: "#ccc", fontSize: 13, fontWeight: 600 }}>{p?.fullName || user.username}</div>
              {p && <div style={{ color: "#00C9FF", fontSize: 11 }}>{p.educationLevel} • {p.fieldOfStudy?.split("/")[0]}</div>}
            </div>
            {user.isAdmin && <span style={styles.adminBadge}>ADMIN</span>}
          </div>
          <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
        </div>
      </header>

      {/* Profile strip */}
      {p && (
        <div style={styles.strip}>
          {[
            p.educationLevel && `🎓 ${p.educationLevel}`,
            p.fieldOfStudy   && `📚 ${p.fieldOfStudy}`,
            p.cgpa           && `📊 ${p.cgpa}`,
            (p.city || p.country) && `🌍 ${[p.city, p.country].filter(Boolean).join(", ")}`,
            p.financialStatus && `💰 ${p.financialStatus}`,
          ].filter(Boolean).map((tag, i) => (
            <span key={i} style={styles.stripTag}>{tag}</span>
          ))}
        </div>
      )}

      <div style={styles.dashHero}>
        <div style={styles.dashHeroTag}>✨ AI-Powered Scholarship Search</div>
        <h1 style={styles.dashTitle}>Find Your Perfect<br /><span style={styles.dashTitleAccent}>Scholarship</span></h1>
        <p style={styles.dashSubtitle}>Choose a category and let SCHLR's AI find the best matches for your profile.</p>
      </div>

      <div style={styles.catGrid}>
        {scholarshipCategories.map(cat => (
          <div key={cat.id}
            style={{ ...styles.catCard, border: `1px solid ${hovered === cat.id ? cat.color : "#ffffff15"}`, boxShadow: hovered === cat.id ? `0 0 30px ${cat.color}33` : "0 4px 20px #0005", transform: hovered === cat.id ? "translateY(-6px) scale(1.02)" : "none" }}
            onMouseEnter={() => setHovered(cat.id)} onMouseLeave={() => setHovered(null)}
            onClick={() => onSelectCategory(cat.id)}>
            <div style={{ ...styles.catIcon, background: `${cat.color}22`, color: cat.color }}>{cat.icon}</div>
            <div style={styles.catLabel}>{cat.label}</div>
            <div style={styles.catDesc}>{cat.desc}</div>
            <div style={{ ...styles.catArrow, color: cat.color }}>Ask AI →</div>
          </div>
        ))}
      </div>

      <div style={styles.allBtn} onClick={() => onSelectCategory(null)}>🔍 &nbsp; Search All Scholarships</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CHAT PAGE
// ═══════════════════════════════════════════════════════════════
function ChatPage({ user, category, messages, input, setInput, loading, onSend, onBack, suggested, messagesEndRef }) {
  const cat = scholarshipCategories.find(c => c.id === category);
  const p   = user?.profile;

  // Personalized suggested questions
  const personalSuggested = p ? [
    `Find ${cat?.label || ""} scholarships for ${p.educationLevel} students in ${p.fieldOfStudy}`,
    `What are the deadlines for ${cat?.label || ""} scholarships in ${p.country}?`,
    `Am I eligible with CGPA ${p.cgpa} for ${cat?.label || ""} scholarships?`,
  ] : suggested;

  return (
    <div style={styles.chatBg}>
      <header style={styles.chatHeader}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <div style={styles.chatHeaderCenter}>
          <span style={{ fontSize: 22 }}>{cat?.icon || "🔍"}</span>
          <div>
            <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{cat?.label || "All Scholarships"}</div>
            <div style={{ fontSize: 12, color: "#00C9FF" }}>● AI Connected{p ? " • Profile Loaded" : ""}</div>
          </div>
        </div>
        <div style={styles.headerUser}>
          <span style={styles.userAvatar}>{(p?.fullName || user.username)[0].toUpperCase()}</span>
        </div>
      </header>

      <div style={styles.messagesWrap}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 16 }}>
            {msg.role === "assistant" && <div style={styles.aiAvatar}>🎓</div>}
            <div style={{ ...styles.bubble, ...(msg.role === "user" ? styles.userBubble : styles.aiBubble) }}>
              {msg.text.split("\n").map((line, j) => (
                <span key={j}>
                  {line.split(/\*\*(.*?)\*\*/g).map((part, k) =>
                    k % 2 === 1 ? <strong key={k} style={{ color: "#00C9FF" }}>{part}</strong> : part
                  )}
                  {j < msg.text.split("\n").length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={styles.aiAvatar}>🎓</div>
            <div style={styles.aiBubble}>
              <div style={styles.typingDots}><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 1 && (
        <div style={styles.suggestedWrap}>
          {personalSuggested.slice(0, 3).map((q, i) => (
            <button key={i} style={styles.suggestChip} onClick={() => onSend(q)}>{q}</button>
          ))}
        </div>
      )}

      <div style={styles.inputBar}>
        <input style={styles.chatInput}
          placeholder="Ask about scholarships, deadlines, eligibility..."
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !loading && onSend()} />
        <button style={{ ...styles.sendBtn, opacity: loading ? 0.5 : 1 }} onClick={() => !loading && onSend()} disabled={loading}>➤</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = {
  authBg:          { minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif", position: "relative", overflow: "hidden" },
  orb:             { position: "absolute", borderRadius: "50%", pointerEvents: "none" },
  authCard:        { background: "#12192B", border: "1px solid #ffffff15", borderRadius: 24, padding: "40px 36px", width: 400, position: "relative", zIndex: 1, boxShadow: "0 20px 60px #00000066" },
  authLogo:        { display: "flex", alignItems: "center", gap: 14, marginBottom: 28 },
  authLogoIcon:    { fontSize: 36 },
  authLogoTitle:   { fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 },
  authLogoSub:     { fontSize: 12, color: "#888", marginTop: 2 },
  authTabs:        { display: "flex", background: "#0A0E1A", borderRadius: 12, padding: 4, marginBottom: 24 },
  authTab:         { flex: 1, padding: "10px 0", border: "none", borderRadius: 10, cursor: "pointer", background: "transparent", color: "#888", fontSize: 14, fontWeight: 600, transition: "all .2s" },
  authTabActive:   { background: "#1E2D4A", color: "#00C9FF" },
  inputWrap:       { display: "flex", alignItems: "center", background: "#0A0E1A", border: "1px solid #ffffff15", borderRadius: 12, padding: "0 14px", marginBottom: 12 },
  inputIcon:       { fontSize: 16, marginRight: 10 },
  input:           { flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14, padding: "14px 0", fontFamily: "inherit" },
  authError:       { background: "#FF444420", border: "1px solid #FF444440", borderRadius: 10, color: "#FF7777", fontSize: 13, padding: "10px 14px", marginBottom: 12 },
  authBtn:         { width: "100%", padding: "14px 0", background: "linear-gradient(135deg, #00C9FF, #0070FF)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4, letterSpacing: 0.3 },
  authHint:        { textAlign: "center", color: "#555", fontSize: 12, marginTop: 14 },
  dashBg:          { minHeight: "100vh", background: "#070C18", fontFamily: "'Segoe UI', sans-serif", position: "relative", overflow: "hidden", paddingBottom: 60 },
  dashOrb1:        { position: "absolute", width: 500, height: 500, top: -100, right: -100, background: "radial-gradient(circle, #00C9FF18 0%, transparent 65%)", borderRadius: "50%", pointerEvents: "none" },
  dashOrb2:        { position: "absolute", width: 400, height: 400, bottom: 0, left: -100, background: "radial-gradient(circle, #A855F718 0%, transparent 65%)", borderRadius: "50%", pointerEvents: "none" },
  header:          { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", borderBottom: "1px solid #ffffff0A", background: "#070C18CC", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 10 },
  headerLogo:      { fontSize: 20, fontWeight: 800, letterSpacing: -0.5 },
  headerRight:     { display: "flex", alignItems: "center", gap: 16 },
  headerUser:      { display: "flex", alignItems: "center", gap: 8 },
  userAvatar:      { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #00C9FF, #0070FF)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 },
  adminBadge:      { background: "#FFD70020", color: "#FFD700", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, border: "1px solid #FFD70040" },
  logoutBtn:       { background: "transparent", border: "1px solid #ffffff20", color: "#888", padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13 },
  strip:           { display: "flex", gap: 8, padding: "10px 40px", borderBottom: "1px solid #ffffff08", flexWrap: "wrap" },
  stripTag:        { background: "#0F1829", border: "1px solid #ffffff10", borderRadius: 20, color: "#888", fontSize: 11, padding: "4px 12px", whiteSpace: "nowrap" },
  dashHero:        { textAlign: "center", padding: "60px 20px 40px" },
  dashHeroTag:     { display: "inline-block", background: "#00C9FF15", color: "#00C9FF", border: "1px solid #00C9FF30", borderRadius: 20, padding: "6px 18px", fontSize: 13, marginBottom: 20 },
  dashTitle:       { fontSize: 48, fontWeight: 900, color: "#fff", margin: "0 0 16px", lineHeight: 1.1, letterSpacing: -1 },
  dashTitleAccent: { background: "linear-gradient(90deg, #00C9FF, #A855F7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  dashSubtitle:    { color: "#888", fontSize: 16, maxWidth: 500, margin: "0 auto" },
  catGrid:         { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20, padding: "0 40px", maxWidth: 1200, margin: "0 auto" },
  catCard:         { background: "#0F1829", borderRadius: 20, padding: "28px 24px", cursor: "pointer", transition: "all .25s cubic-bezier(.34,1.56,.64,1)" },
  catIcon:         { width: 52, height: 52, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 },
  catLabel:        { color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 6 },
  catDesc:         { color: "#666", fontSize: 13, lineHeight: 1.5, marginBottom: 16 },
  catArrow:        { fontSize: 13, fontWeight: 600 },
  allBtn:          { display: "block", margin: "40px auto 0", width: "fit-content", background: "linear-gradient(135deg, #00C9FF22, #A855F722)", border: "1px solid #00C9FF44", color: "#00C9FF", padding: "14px 32px", borderRadius: 16, cursor: "pointer", fontWeight: 700, fontSize: 15 },
  chatBg:          { height: "100vh", background: "#070C18", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI', sans-serif" },
  chatHeader:      { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid #ffffff0A", background: "#0F1829", gap: 12 },
  chatHeaderCenter:{ display: "flex", alignItems: "center", gap: 12, flex: 1, justifyContent: "center" },
  backBtn:         { background: "transparent", border: "1px solid #ffffff20", color: "#888", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" },
  messagesWrap:    { flex: 1, overflowY: "auto", padding: "24px 24px 8px", display: "flex", flexDirection: "column" },
  aiAvatar:        { width: 36, height: 36, borderRadius: "50%", background: "#00C9FF20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginRight: 10, flexShrink: 0, alignSelf: "flex-end" },
  bubble:          { maxWidth: "72%", padding: "12px 16px", borderRadius: 18, fontSize: 14, lineHeight: 1.65, wordBreak: "break-word" },
  userBubble:      { background: "linear-gradient(135deg, #0070FF, #00C9FF)", color: "#fff", borderBottomRightRadius: 4 },
  aiBubble:        { background: "#0F1829", color: "#ccc", border: "1px solid #ffffff10", borderBottomLeftRadius: 4 },
  typingDots:      { display: "flex", gap: 5 },
  suggestedWrap:   { padding: "0 24px 12px", display: "flex", gap: 8, flexWrap: "wrap" },
  suggestChip:     { background: "#0F1829", border: "1px solid #00C9FF33", color: "#00C9FF", borderRadius: 20, padding: "8px 14px", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" },
  inputBar:        { display: "flex", gap: 10, padding: "14px 24px", borderTop: "1px solid #ffffff0A", background: "#0A0E1A" },
  chatInput:       { flex: 1, background: "#0F1829", border: "1px solid #ffffff15", borderRadius: 14, color: "#fff", padding: "14px 18px", fontSize: 14, outline: "none", fontFamily: "inherit" },
  sendBtn:         { width: 50, height: 50, borderRadius: 14, background: "linear-gradient(135deg, #00C9FF, #0070FF)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
};

const styleTag = document.createElement("style");
styleTag.innerHTML = `
  @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
  .typing span{width:7px;height:7px;background:#00C9FF;border-radius:50%;display:inline-block;animation:bounce 1.2s infinite}
  .typing span:nth-child(2){animation-delay:.2s}
  .typing span:nth-child(3){animation-delay:.4s}
`;
document.head.appendChild(styleTag);