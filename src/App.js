import { useState, useEffect, useRef } from "react";

const N8N_WEBHOOK_URL = "https://arslanalvi.app.n8n.cloud/webhook/87d55049-63da-42d0-99db-dd1940f702a3";

// ─── Fonts ───────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800&family=Instrument+Sans:wght@400;500;600&display=swap";
document.head.appendChild(fontLink);

const injectStyles = (dark) => {
  let tag = document.getElementById("app-styles");
  if (!tag) { tag = document.createElement("style"); tag.id = "app-styles"; document.head.appendChild(tag); }
  tag.innerHTML = `
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Instrument Sans',sans-serif; background:${dark?"#0A0A0F":"#F5F5F0"}; transition:background .3s; }
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:${dark?"#2A2A3A":"#D0D0C8"};border-radius:4px}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
    .fu{animation:fadeUp .3s ease forwards}
    .fi{animation:fadeIn .25s ease forwards}
    input::placeholder,textarea::placeholder{color:${dark?"#3A3A4A":"#ABABAB"}}
    input:focus,textarea:focus,select:focus{outline:none!important;border-color:${dark?"#6366F1":"#6366F1"}!important}
    select option{background:${dark?"#13131A":"#fff"};color:${dark?"#fff":"#111"}}
    button{cursor:pointer;transition:all .18s ease}
    .dot{width:7px;height:7px;border-radius:50%;display:inline-block;background:${dark?"#6366F1":"#6366F1"};animation:blink 1.1s infinite}
    .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
  `;
};

// ─── Constants ───────────────────────────────────────────────────
const CATEGORIES = [
  { id:"merit",    icon:"🏆", label:"Merit Based",         color:"#F59E0B", bg:"#F59E0B" },
  { id:"abroad",   icon:"✈️",  label:"Study Abroad",        color:"#6366F1", bg:"#6366F1" },
  { id:"need",     icon:"🤝", label:"Need Based",          color:"#10B981", bg:"#10B981" },
  { id:"sports",   icon:"⚽", label:"Sports",              color:"#EF4444", bg:"#EF4444" },
  { id:"stem",     icon:"🔬", label:"STEM",                color:"#8B5CF6", bg:"#8B5CF6" },
  { id:"arts",     icon:"🎨", label:"Arts & Culture",      color:"#EC4899", bg:"#EC4899" },
  { id:"minority", icon:"🌍", label:"Minority & Diversity", color:"#06B6D4", bg:"#06B6D4" },
  { id:"govt",     icon:"🏛️", label:"Government",          color:"#F97316", bg:"#F97316" },
];

const EDU_LEVELS = ["Matric (10th)","Intermediate (12th)","Bachelors","Masters","PhD","Post-Doctoral"];
const FIELDS     = ["Computer Science / IT","Engineering","Medicine / Health","Business / Finance","Arts / Design","Law","Education","Social Sciences","Natural Sciences","Other"];
const FINANCIAL  = ["Low Income (Need-Based)","Middle Income","High Income (Self-Funded)","Prefer not to say"];
const EMPTY_P    = { fullName:"",age:"",educationLevel:"",fieldOfStudy:"",cgpa:"",financialStatus:"",country:"",city:"",nationality:"",workExperience:"",extraCurriculars:"" };

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [dark, setDark]                     = useState(true);
  const [page, setPage]                     = useState("auth");
  const [users, setUsers]                   = useState([{
    username:"admin", password:"786", isAdmin:true,
    profile:{ fullName:"Admin User", age:"25", educationLevel:"Masters", fieldOfStudy:"Computer Science / IT", cgpa:"3.8", financialStatus:"Middle Income", country:"Pakistan", city:"Lahore", nationality:"Pakistani", workExperience:"2 years", extraCurriculars:"Chess, Coding competitions" }
  }]);
  const [currentUser, setCurrentUser]       = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [authTab, setAuthTab]               = useState("login");
  const [signupStep, setSignupStep]         = useState(1);
  const [loginForm, setLoginForm]           = useState({ username:"", password:"" });
  const [signupCreds, setSignupCreds]       = useState({ username:"", password:"", confirm:"" });
  const [profileForm, setProfileForm]       = useState({ ...EMPTY_P });
  const [authError, setAuthError]           = useState("");
  const [messages, setMessages]             = useState([]);
  const [input, setInput]                   = useState("");
  const [loading, setLoading]               = useState(false);
  const messagesEndRef                      = useRef(null);

  const T = dark ? DARK : LIGHT;

  useEffect(() => { injectStyles(dark); }, [dark]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);
  useEffect(() => {
    if (page === "chat" && messages.length === 0) {
      const cat = CATEGORIES.find(c => c.id === activeCategory);
      const p   = currentUser?.profile;
      setMessages([{ role:"assistant", text: p
        ? `Hello **${p.fullName||currentUser.username}**! 👋\n\nYou're a **${p.educationLevel}** student in **${p.fieldOfStudy}** from **${p.city}, ${p.country}**.\n\nI'll find **${cat?.label||"all"}** scholarships tailored to your profile. What would you like to know?`
        : `Hello **${currentUser?.username}**! Ask me anything about **${cat?.label||"scholarships"}**.`
      }]);
    }
  }, [page, messages.length, activeCategory, currentUser]);

  // ── Auth ──────────────────────────────────────────────────────
  const handleLogin = () => {
    setAuthError("");
    if (!loginForm.username || !loginForm.password) return setAuthError("Please fill in all fields.");
    const found = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (!found) return setAuthError("Account not found. Please sign up first.");
    setCurrentUser(found); setPage("dashboard");
  };
  const handleStep1 = () => {
    setAuthError("");
    const { username, password, confirm } = signupCreds;
    if (!username || !password || !confirm) return setAuthError("Please fill all fields.");
    if (password !== confirm) return setAuthError("Passwords do not match.");
    if (users.find(u => u.username === username)) return setAuthError("Username already taken.");
    setSignupStep(2);
  };
  const handleSignupComplete = () => {
    setAuthError("");
    if (!profileForm.fullName || !profileForm.educationLevel || !profileForm.fieldOfStudy || !profileForm.country)
      return setAuthError("Fill required fields: Name, Education, Field & Country.");
    const newUser = { username:signupCreds.username, password:signupCreds.password, isAdmin:false, profile:{...profileForm} };
    setUsers(p => [...p, newUser]); setCurrentUser(newUser); setPage("dashboard");
  };
  const handleProfileSave = (updated) => {
    const u = { ...currentUser, profile:updated };
    setCurrentUser(u);
    setUsers(p => p.map(x => x.username === currentUser.username ? u : x));
  };

  // ── Chat ──────────────────────────────────────────────────────
  const buildCtx = () => {
    const p = currentUser?.profile;
    if (!p) return "";
    return `STUDENT PROFILE:\n- Name: ${p.fullName}\n- Age: ${p.age}\n- Education: ${p.educationLevel}\n- Field: ${p.fieldOfStudy}\n- CGPA: ${p.cgpa}\n- Financial: ${p.financialStatus}\n- Location: ${p.city}, ${p.country}\n- Nationality: ${p.nationality}\n- Work Exp: ${p.workExperience||"None"}\n- Extra: ${p.extraCurriculars||"None"}\n- Category: ${CATEGORIES.find(c=>c.id===activeCategory)?.label||"General"}\nOnly recommend scholarships matching this profile.\n`;
  };
  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(p => [...p, { role:"user", text:msg }]);
    setLoading(true);
    try {
      const res  = await fetch(N8N_WEBHOOK_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ messages:[{ content:`${buildCtx()}\nUSER: ${msg}`, additional_kwargs:{}, response_metadata:{} }] }) });
      const data = await res.json();
      setMessages(p => [...p, { role:"assistant", text:data?.output||data?.text||data?.answer||JSON.stringify(data) }]);
    } catch {
      setMessages(p => [...p, { role:"assistant", text:"⚠️ Could not reach the scholarship database. Please try again." }]);
    } finally { setLoading(false); }
  };
  const logout = () => { setCurrentUser(null); setLoginForm({username:"",password:""}); setSignupCreds({username:"",password:"",confirm:""}); setProfileForm({...EMPTY_P}); setSignupStep(1); setAuthTab("login"); setAuthError(""); setPage("auth"); };

  const props = { dark, T, currentUser };

  if (page==="auth")      return <AuthPage {...props} tab={authTab} setTab={t=>{setAuthTab(t);setAuthError("");setSignupStep(1);}} loginForm={loginForm} setLoginForm={setLoginForm} signupCreds={signupCreds} setSignupCreds={setSignupCreds} profileForm={profileForm} setProfileForm={setProfileForm} signupStep={signupStep} error={authError} onLogin={handleLogin} onStep1={handleStep1} onComplete={handleSignupComplete} onBack={()=>setSignupStep(1)} toggleDark={()=>setDark(d=>!d)} />;
  if (page==="dashboard") return <Dashboard {...props} onCat={cat=>{setActiveCategory(cat);setMessages([]);setPage("chat");}} onProfile={()=>setPage("profile")} onLogout={logout} toggleDark={()=>setDark(d=>!d)} />;
  if (page==="profile")   return <ProfilePage {...props} onSave={handleProfileSave} onBack={()=>setPage("dashboard")} toggleDark={()=>setDark(d=>!d)} />;
  if (page==="chat")      return <ChatPage {...props} category={activeCategory} messages={messages} input={input} setInput={setInput} loading={loading} onSend={sendMessage} onBack={()=>setPage("dashboard")} messagesEndRef={messagesEndRef} />;
}

// ═══════════════════════════════════════════════════════════════
// AUTH PAGE
// ═══════════════════════════════════════════════════════════════
function AuthPage({ dark, T, tab, setTab, loginForm, setLoginForm, signupCreds, setSignupCreds, profileForm, setProfileForm, signupStep, error, onLogin, onStep1, onComplete, onBack, toggleDark }) {
  const wide = tab==="signup" && signupStep===2;
  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative"}}>
      {/* Theme toggle */}
      <button onClick={toggleDark} style={{position:"absolute",top:20,right:20,...btnGhost(T)}}>
        {dark?"☀️ Light":"🌙 Dark"}
      </button>

      {/* Decorative circles */}
      <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",border:`1px solid ${T.border}`,top:-80,left:-80,pointerEvents:"none"}}/>
      <div style={{position:"absolute",width:200,height:200,borderRadius:"50%",border:`1px solid ${T.border}`,bottom:-40,right:40,pointerEvents:"none"}}/>

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:"40px 36px",width:"100%",maxWidth:wide?640:400,boxShadow:dark?"0 32px 64px #00000066":"0 16px 48px #0000001A",transition:"max-width .3s ease"}} className="fu">

        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:32}}>
          <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🎓</div>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:T.text,fontFamily:"Cabinet Grotesk,sans-serif",letterSpacing:-.5}}>ScholarAI</div>
            <div style={{fontSize:11,color:T.muted,marginTop:1}}>Scholarship Navigator</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",background:T.bg,borderRadius:12,padding:3,marginBottom:28}}>
          {["login","signup"].map(t=>(
            <button key={t} style={{flex:1,padding:"9px 0",border:"none",borderRadius:10,background:tab===t?T.card:"transparent",color:tab===t?T.accent:T.muted,fontSize:13,fontWeight:600,fontFamily:"Instrument Sans,sans-serif",boxShadow:tab===t?(dark?"0 2px 8px #0004":"0 2px 8px #0001"):"none"}}
              onClick={()=>setTab(t)}>{t==="login"?"Sign In":"Create Account"}</button>
          ))}
        </div>

        {/* LOGIN */}
        {tab==="login" && <div className="fu">
          <AuthField dark={dark} T={T} icon="👤" ph="Username"         val={loginForm.username}  set={v=>setLoginForm(p=>({...p,username:v}))} />
          <AuthField dark={dark} T={T} icon="🔒" ph="Password" pw      val={loginForm.password}  set={v=>setLoginForm(p=>({...p,password:v}))} onEnter={onLogin} />
          {error && <ErrMsg msg={error} />}
          <GradBtn onClick={onLogin}>Sign In →</GradBtn>
          <div style={{textAlign:"center",color:T.muted,fontSize:12,marginTop:14}}>Admin: <code style={{color:T.accent}}>admin / 786</code></div>
        </div>}

        {/* SIGNUP STEP 1 */}
        {tab==="signup" && signupStep===1 && <div className="fu">
          <StepPill n={1} label="Account Setup" T={T} />
          <AuthField dark={dark} T={T} icon="👤" ph="Username"           val={signupCreds.username} set={v=>setSignupCreds(p=>({...p,username:v}))} />
          <AuthField dark={dark} T={T} icon="🔒" ph="Password"      pw   val={signupCreds.password} set={v=>setSignupCreds(p=>({...p,password:v}))} />
          <AuthField dark={dark} T={T} icon="🔒" ph="Confirm Password" pw val={signupCreds.confirm}  set={v=>setSignupCreds(p=>({...p,confirm:v}))} onEnter={onStep1} />
          {error && <ErrMsg msg={error} />}
          <GradBtn onClick={onStep1}>Next: Profile →</GradBtn>
        </div>}

        {/* SIGNUP STEP 2 */}
        {tab==="signup" && signupStep===2 && <div className="fu">
          <StepPill n={2} label="Your Profile" T={T} />
          <div style={{background:dark?"#6366F110":"#6366F108",border:`1px solid ${dark?"#6366F130":"#6366F120"}`,borderRadius:10,padding:"10px 14px",marginBottom:16,color:T.muted,fontSize:13}}>
            🎯 This helps AI find scholarships matched specifically to you
          </div>
          <ProfileFormGrid T={T} dark={dark} form={profileForm} setForm={setProfileForm} />
          {error && <ErrMsg msg={error} />}
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <button style={{...btnGhost(T),padding:"13px 18px"}} onClick={onBack}>← Back</button>
            <GradBtn onClick={onComplete} flex>Complete Registration 🎓</GradBtn>
          </div>
        </div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
function Dashboard({ dark, T, currentUser, onCat, onProfile, onLogout, toggleDark }) {
  const [hov, setHov] = useState(null);
  const p = currentUser?.profile;

  return (
    <div style={{minHeight:"100vh",background:T.bg}}>
      {/* Header */}
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 32px",borderBottom:`1px solid ${T.border}`,background:T.card,position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🎓</div>
          <span style={{fontSize:17,fontWeight:800,color:T.text,fontFamily:"Cabinet Grotesk,sans-serif",letterSpacing:-.5}}><span style={{color:T.accent}}>Scholar</span>AI</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={toggleDark} style={{...btnGhost(T),padding:"7px 14px",fontSize:13}}>{dark?"☀️":"🌙"}</button>
          {/* Profile button */}
          <button onClick={onProfile} style={{display:"flex",alignItems:"center",gap:9,background:T.surface,border:`1px solid ${T.border}`,borderRadius:40,padding:"6px 14px 6px 6px"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:12,fontFamily:"Cabinet Grotesk,sans-serif"}}>{(p?.fullName||currentUser.username)[0].toUpperCase()}</div>
            <div style={{textAlign:"left"}}>
              <div style={{color:T.text,fontSize:12,fontWeight:600}}>{p?.fullName?.split(" ")[0]||currentUser.username}</div>
              {p && <div style={{color:T.muted,fontSize:10}}>{p.educationLevel}</div>}
            </div>
            <span style={{color:T.muted,fontSize:12}}>✏️</span>
          </button>
          <button onClick={onLogout} style={{...btnGhost(T),padding:"7px 14px",fontSize:13}}>Logout</button>
        </div>
      </header>

      {/* Profile info strip */}
      {p && (
        <div style={{display:"flex",gap:8,padding:"10px 32px",borderBottom:`1px solid ${T.border}`,overflowX:"auto",flexWrap:"wrap"}}>
          {[
            p.educationLevel && `🎓 ${p.educationLevel}`,
            p.fieldOfStudy   && `📚 ${p.fieldOfStudy}`,
            p.cgpa           && `📊 ${p.cgpa}`,
            (p.city||p.country) && `🌍 ${[p.city,p.country].filter(Boolean).join(", ")}`,
            p.financialStatus && `💰 ${p.financialStatus}`,
          ].filter(Boolean).map((tag,i)=>(
            <span key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,color:T.muted,fontSize:11,padding:"4px 12px",whiteSpace:"nowrap"}}>{tag}</span>
          ))}
        </div>
      )}

      {/* Hero */}
      <div style={{textAlign:"center",padding:"56px 24px 36px"}}>
        <div style={{display:"inline-block",background:dark?"#6366F115":"#6366F110",border:`1px solid ${dark?"#6366F130":"#6366F120"}`,borderRadius:20,padding:"5px 16px",fontSize:12,color:T.accent,fontWeight:600,marginBottom:20,letterSpacing:.3}}>
          ✦ Personalized for {p?.fullName?.split(" ")[0]||currentUser.username}
        </div>
        <h1 style={{fontSize:42,fontWeight:800,color:T.text,lineHeight:1.15,letterSpacing:-1.5,fontFamily:"Cabinet Grotesk,sans-serif",marginBottom:12}}>
          Find Your Perfect<br/><span style={{background:"linear-gradient(90deg,#6366F1,#8B5CF6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Scholarship</span>
        </h1>
        <p style={{color:T.muted,fontSize:15,maxWidth:400,margin:"0 auto"}}>Choose a category — AI matches scholarships to your exact academic profile.</p>
      </div>

      {/* Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:14,padding:"0 32px",maxWidth:1080,margin:"0 auto"}}>
        {CATEGORIES.map(cat=>(
          <div key={cat.id}
            style={{background:hov===cat.id?`${cat.color}12`:T.card,border:`1px solid ${hov===cat.id?cat.color:T.border}`,borderRadius:16,padding:"22px 18px",cursor:"pointer",transition:"all .2s ease",transform:hov===cat.id?"translateY(-4px)":"none"}}
            onMouseEnter={()=>setHov(cat.id)} onMouseLeave={()=>setHov(null)}
            onClick={()=>onCat(cat.id)}>
            <div style={{width:40,height:40,borderRadius:12,background:`${cat.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:14}}>{cat.icon}</div>
            <div style={{color:T.text,fontWeight:700,fontSize:14,marginBottom:6,fontFamily:"Cabinet Grotesk,sans-serif"}}>{cat.label}</div>
            <div style={{color:cat.color,fontSize:12,fontWeight:600}}>Ask AI →</div>
          </div>
        ))}
      </div>

      <div style={{textAlign:"center",marginTop:32,paddingBottom:60}}>
        <button onClick={()=>onCat(null)} style={{background:T.card,border:`1px solid ${T.border}`,color:T.accent,borderRadius:40,padding:"12px 28px",fontSize:14,fontWeight:600}}>
          🔍 &nbsp;Search All Scholarships
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROFILE PAGE
// ═══════════════════════════════════════════════════════════════
function ProfilePage({ dark, T, currentUser, onSave, onBack, toggleDark }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm]         = useState({...EMPTY_P,...currentUser.profile});
  const [saved, setSaved]       = useState(false);

  const save = () => { onSave({...form}); setEditMode(false); setSaved(true); setTimeout(()=>setSaved(false),3000); };
  const p = editMode ? form : (currentUser.profile||{});

  const sections = [
    { title:"Personal", icon:"👤", cols:3, fields:[
      {label:"Full Name",    icon:"🙋",key:"fullName",    type:"text"},
      {label:"Age",          icon:"🎂",key:"age",         type:"number"},
      {label:"Nationality",  icon:"🛂",key:"nationality", type:"text"},
    ]},
    { title:"Education", icon:"🎓", cols:3, fields:[
      {label:"Education Level",icon:"🎓",key:"educationLevel",type:"select",opts:EDU_LEVELS},
      {label:"Field of Study", icon:"📚",key:"fieldOfStudy",  type:"select",opts:FIELDS},
      {label:"CGPA / Marks",   icon:"📊",key:"cgpa",          type:"text"},
    ]},
    { title:"Location", icon:"🌍", cols:2, fields:[
      {label:"Country",icon:"🌍",key:"country",type:"text"},
      {label:"City",   icon:"🏙️",key:"city",   type:"text"},
    ]},
    { title:"Background", icon:"💼", cols:2, fields:[
      {label:"Financial Status",  icon:"💰",key:"financialStatus",  type:"select",opts:FINANCIAL},
      {label:"Work Experience",   icon:"💼",key:"workExperience",   type:"text"},
      {label:"Extra Curriculars", icon:"🏅",key:"extraCurriculars", type:"textarea",wide:true},
    ]},
  ];

  return (
    <div style={{minHeight:"100vh",background:T.bg}}>
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 32px",borderBottom:`1px solid ${T.border}`,background:T.card,position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🎓</div>
          <span style={{fontSize:17,fontWeight:800,color:T.text,fontFamily:"Cabinet Grotesk,sans-serif",letterSpacing:-.5}}><span style={{color:T.accent}}>Scholar</span>AI</span>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={toggleDark} style={{...btnGhost(T),padding:"7px 14px",fontSize:13}}>{dark?"☀️":"🌙"}</button>
          <button onClick={onBack} style={btnGhost(T)}>← Dashboard</button>
        </div>
      </header>

      <div style={{maxWidth:820,margin:"0 auto",padding:"32px 24px"}} className="fi">
        {/* Profile hero card */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:"28px 28px",marginBottom:20,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
          <div style={{width:68,height:68,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:26,fontFamily:"Cabinet Grotesk,sans-serif",flexShrink:0}}>
            {(p?.fullName||currentUser.username)[0]?.toUpperCase()}
          </div>
          <div style={{flex:1}}>
            <h2 style={{fontSize:22,fontWeight:800,color:T.text,fontFamily:"Cabinet Grotesk,sans-serif",marginBottom:8}}>{p?.fullName||currentUser.username}</h2>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[p?.educationLevel,p?.fieldOfStudy,[p?.city,p?.country].filter(Boolean).join(", ")].filter(Boolean).map((t,i)=>(
                <span key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,color:T.muted,fontSize:11,padding:"3px 10px"}}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {saved && <span style={{background:"#10B98118",border:"1px solid #10B98130",color:"#10B981",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:600}}>✓ Saved</span>}
            {!editMode
              ? <button style={{background:"linear-gradient(135deg,#6366F1,#8B5CF6)",border:"none",borderRadius:10,color:"#fff",padding:"9px 18px",fontSize:13,fontWeight:600}} onClick={()=>setEditMode(true)}>✏️ Edit Profile</button>
              : <>
                  <button style={btnGhost(T)} onClick={()=>{setForm({...EMPTY_P,...currentUser.profile});setEditMode(false);}}>Cancel</button>
                  <button style={{background:"linear-gradient(135deg,#10B981,#6366F1)",border:"none",borderRadius:10,color:"#fff",padding:"9px 18px",fontSize:13,fontWeight:600}} onClick={save}>💾 Save</button>
                </>
            }
          </div>
        </div>

        {/* Sections */}
        {sections.map((sec,si)=>(
          <div key={si} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"22px 24px",marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:"Cabinet Grotesk,sans-serif",marginBottom:16,paddingBottom:12,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8}}>
              <span>{sec.icon}</span> {sec.title}
            </div>
            <div style={{display:"grid",gridTemplateColumns:`repeat(${sec.cols},1fr)`,gap:14}}>
              {sec.fields.map((f,fi)=>(
                <div key={fi} style={{gridColumn:f.wide?"1 / -1":"auto"}}>
                  <div style={{fontSize:11,color:T.muted,fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>{f.label}</div>
                  {!editMode ? (
                    <div style={{fontSize:13,color:T.text,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",minHeight:40}}>{p?.[f.key]||<span style={{color:T.muted,fontStyle:"italic"}}>Not provided</span>}</div>
                  ) : f.type==="select" ? (
                    <select style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,color:form[f.key]?T.text:T.muted,fontSize:13,padding:"10px 12px",fontFamily:"Instrument Sans,sans-serif"}} value={form[f.key]} onChange={e=>setForm(x=>({...x,[f.key]:e.target.value}))}>
                      <option value="">Select…</option>
                      {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type==="textarea" ? (
                    <textarea style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,fontSize:13,padding:"10px 12px",minHeight:72,resize:"vertical",fontFamily:"Instrument Sans,sans-serif"}} value={form[f.key]} onChange={e=>setForm(x=>({...x,[f.key]:e.target.value}))} placeholder={`Enter ${f.label}`}/>
                  ) : (
                    <input style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,fontSize:13,padding:"10px 12px",fontFamily:"Instrument Sans,sans-serif"}} type={f.type} value={form[f.key]} onChange={e=>setForm(x=>({...x,[f.key]:e.target.value}))} placeholder={`Enter ${f.label}`}/>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {editMode && (
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingBottom:40}}>
            <button style={btnGhost(T)} onClick={()=>{setForm({...EMPTY_P,...currentUser.profile});setEditMode(false);}}>Cancel</button>
            <button style={{background:"linear-gradient(135deg,#10B981,#6366F1)",border:"none",borderRadius:10,color:"#fff",padding:"10px 22px",fontSize:13,fontWeight:600}} onClick={save}>💾 Save Changes</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CHAT PAGE
// ═══════════════════════════════════════════════════════════════
function ChatPage({ dark, T, currentUser, category, messages, input, setInput, loading, onSend, onBack, messagesEndRef }) {
  const cat = CATEGORIES.find(c=>c.id===category);
  const p   = currentUser?.profile;
  const sug = [
    `Find ${cat?.label||""} scholarships for ${p?.educationLevel||"my level"}`,
    `Deadlines for ${cat?.label||""} scholarships in ${p?.country||"my country"}`,
    `Eligibility with CGPA ${p?.cgpa||"3.5"} for ${cat?.label||""} scholarships`,
  ];

  return (
    <div style={{height:"100vh",background:T.bg,display:"flex",flexDirection:"column"}}>
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 24px",borderBottom:`1px solid ${T.border}`,background:T.card}}>
        <button style={btnGhost(T)} onClick={onBack}>← Back</button>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>{cat?.icon||"🔍"}</span>
          <div>
            <div style={{fontWeight:700,color:T.text,fontSize:14,fontFamily:"Cabinet Grotesk,sans-serif"}}>{cat?.label||"All Scholarships"}</div>
            <div style={{fontSize:11,color:"#10B981"}}>● AI Connected • Profile Active</div>
          </div>
        </div>
        {p && (
          <div style={{display:"flex",alignItems:"center",gap:8,background:T.surface,border:`1px solid ${T.border}`,borderRadius:40,padding:"5px 12px 5px 5px"}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:11}}>{(p.fullName||currentUser.username)[0].toUpperCase()}</div>
            <div style={{fontSize:11}}>
              <div style={{color:T.text,fontWeight:600}}>{p.fullName?.split(" ")[0]||currentUser.username}</div>
              <div style={{color:T.muted}}>{p.educationLevel}</div>
            </div>
          </div>
        )}
      </header>

      <div style={{flex:1,overflowY:"auto",padding:"20px 24px 8px",display:"flex",flexDirection:"column"}}>
        {messages.map((msg,i)=>(
          <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",marginBottom:14}}>
            {msg.role==="assistant" && (
              <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,marginRight:8,flexShrink:0,alignSelf:"flex-end"}}>🎓</div>
            )}
            <div style={{maxWidth:"72%",padding:"11px 15px",borderRadius:16,fontSize:14,lineHeight:1.65,wordBreak:"break-word",...(msg.role==="user"
              ?{background:"linear-gradient(135deg,#6366F1,#8B5CF6)",color:"#fff",borderBottomRightRadius:4}
              :{background:T.card,color:T.text,border:`1px solid ${T.border}`,borderBottomLeftRadius:4}
            )}}>
              {msg.text.split("\n").map((line,j)=>(
                <span key={j}>
                  {line.split(/\*\*(.*?)\*\*/g).map((part,k)=>k%2===1?<strong key={k} style={{color:msg.role==="user"?"#fff":T.accent}}>{part}</strong>:part)}
                  {j<msg.text.split("\n").length-1&&<br/>}
                </span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,marginRight:8}}>🎓</div>
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,borderBottomLeftRadius:4,padding:"12px 16px",display:"flex",gap:5,alignItems:"center"}}>
              <span className="dot"/><span className="dot"/><span className="dot"/>
            </div>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>

      {messages.length<=1 && (
        <div style={{padding:"0 24px 10px",display:"flex",gap:8,flexWrap:"wrap"}}>
          {sug.map((q,i)=>(
            <button key={i} style={{background:T.surface,border:`1px solid ${T.border}`,color:T.accent,borderRadius:20,padding:"7px 14px",fontSize:12,fontWeight:500}} onClick={()=>onSend(q)}>{q}</button>
          ))}
        </div>
      )}

      <div style={{display:"flex",gap:10,padding:"12px 24px",borderTop:`1px solid ${T.border}`,background:T.card}}>
        <input style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,color:T.text,padding:"12px 16px",fontSize:14,fontFamily:"Instrument Sans,sans-serif"}}
          placeholder="Ask about scholarships, deadlines, eligibility…"
          value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onSend()}/>
        <button style={{width:46,height:46,borderRadius:12,background:"linear-gradient(135deg,#6366F1,#8B5CF6)",border:"none",color:"#fff",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",opacity:loading?.5:1}} onClick={()=>onSend()} disabled={loading}>➤</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROFILE FORM GRID (signup)
// ═══════════════════════════════════════════════════════════════
function ProfileFormGrid({ T, dark, form, setForm }) {
  const s = (k,v) => setForm(p=>({...p,[k]:v}));
  const iStyle = {width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:11,color:T.text,fontSize:13,padding:"12px 14px",fontFamily:"Instrument Sans,sans-serif"};
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[
          {ph:"Full Name *",           key:"fullName",        type:"text"},
          {ph:"Age",                   key:"age",             type:"number"},
        ].map(f=>(
          <input key={f.key} style={iStyle} type={f.type||"text"} placeholder={f.ph} value={form[f.key]} onChange={e=>s(f.key,e.target.value)}/>
        ))}
        <select style={{...iStyle,color:form.educationLevel?T.text:T.muted,gridColumn:"1"}} value={form.educationLevel} onChange={e=>s("educationLevel",e.target.value)}>
          <option value="">Education Level *</option>
          {EDU_LEVELS.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
        <select style={{...iStyle,color:form.fieldOfStudy?T.text:T.muted}} value={form.fieldOfStudy} onChange={e=>s("fieldOfStudy",e.target.value)}>
          <option value="">Field of Study *</option>
          {FIELDS.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
        <input style={iStyle} placeholder="CGPA / Marks / Grade" value={form.cgpa} onChange={e=>s("cgpa",e.target.value)}/>
        <select style={{...iStyle,color:form.financialStatus?T.text:T.muted}} value={form.financialStatus} onChange={e=>s("financialStatus",e.target.value)}>
          <option value="">Financial Status</option>
          {FINANCIAL.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
        <input style={iStyle} placeholder="Country *"    value={form.country}     onChange={e=>s("country",e.target.value)}/>
        <input style={iStyle} placeholder="City"         value={form.city}        onChange={e=>s("city",e.target.value)}/>
        <input style={iStyle} placeholder="Nationality"  value={form.nationality} onChange={e=>s("nationality",e.target.value)}/>
        <input style={iStyle} placeholder="Work Experience" value={form.workExperience} onChange={e=>s("workExperience",e.target.value)}/>
      </div>
      <textarea style={{...iStyle,minHeight:70,resize:"vertical",marginTop:10,paddingTop:12}} placeholder="Extra Curriculars / Sports / Arts / Achievements" value={form.extraCurriculars} onChange={e=>s("extraCurriculars",e.target.value)}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ═══════════════════════════════════════════════════════════════
function AuthField({ T, icon, ph, type="text", val, set, onEnter, pw }) {
  return (
    <div style={{display:"flex",alignItems:"center",background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"0 14px",marginBottom:10,transition:"border .2s"}}>
      <span style={{fontSize:14,marginRight:10,flexShrink:0}}>{icon}</span>
      <input style={{flex:1,background:"transparent",border:"none",outline:"none",color:T.text,fontSize:14,padding:"13px 0",fontFamily:"Instrument Sans,sans-serif"}}
        type={pw?"password":type} placeholder={ph} value={val} onChange={e=>set(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onEnter&&onEnter()}/>
    </div>
  );
}
function GradBtn({ onClick, children, flex }) {
  return <button style={{...(flex?{flex:1}:{width:"100%"}),padding:"13px 0",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",border:"none",borderRadius:12,color:"#fff",fontWeight:700,fontSize:14,fontFamily:"Cabinet Grotesk,sans-serif",letterSpacing:.2}} onClick={onClick}>{children}</button>;
}
function ErrMsg({ msg }) {
  return <div style={{background:"#EF444415",border:"1px solid #EF444430",borderRadius:10,color:"#EF4444",fontSize:13,padding:"10px 14px",marginBottom:12}}>{msg}</div>;
}
function StepPill({ n, label, T }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
      <span style={{width:20,height:20,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{n}</span>
      <span style={{color:T.muted,fontSize:12}}>of 2 —</span>
      <span style={{color:T.accent,fontWeight:600,fontSize:12}}>{label}</span>
    </div>
  );
}
const btnGhost = (T) => ({padding:"8px 16px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:10,color:T.muted,fontWeight:500,fontSize:13,fontFamily:"Instrument Sans,sans-serif"});

// ═══════════════════════════════════════════════════════════════
// THEMES
// ═══════════════════════════════════════════════════════════════
const DARK = {
  bg:      "#0A0A0F",
  card:    "#13131A",
  surface: "#0A0A0F",
  border:  "#1E1E2E",
  text:    "#F0F0F5",
  muted:   "#4A4A6A",
  accent:  "#818CF8",
};
const LIGHT = {
  bg:      "#F5F5F0",
  card:    "#FFFFFF",
  surface: "#F0F0EB",
  border:  "#E5E5E0",
  text:    "#111118",
  muted:   "#888884",
  accent:  "#6366F1",
};