import { useState, useRef, useCallback } from "react";

// ── Preset walkthroughs ──────────────────────────────────────────────
const PRESETS = {
  "Auth Refactor": {
    title: "PR #482: Refactor auth middleware",
    repo: "github/acme/backend",
    base: "main",
    head: "feat/auth-refactor",
    authors: ["alice", "bob"],
    steps: [
      {
        type: "text",
        body: "This PR replaces the legacy session-based auth with JWT tokens. We'll walk through the changes bottom-up, starting at the token utility layer."
      },
      {
        type: "source",
        file: "src/utils/token.ts",
        lines: [12, 48],
        highlight: [30, 35],
        note: "New `verifyToken` helper — note the fallback on L34."
      },
      {
        type: "diff",
        file: "src/middleware/auth.ts",
        hunks: [2, 3],
        collapse: false,
        note: "Session lookup replaced with verifyToken call."
      },
      {
        type: "code",
        lang: "typescript",
        body: "// Before (conceptual)\nconst user = await Session.find(req.cookie.sid);\n\n// After\nconst user = decodeJWT(req.headers.authorization);"
      },
      {
        type: "annotation",
        file: "src/middleware/auth.ts",
        line: 42,
        severity: "warn",
        body: "Race condition if token refresh fires mid-request."
      },
      {
        type: "checkpoint",
        prompt: "What happens if the token is expired?",
        choices: [
          { text: "Returns 401 Unauthorized", correct: true, explain: "See L34 — the catch block returns early." },
          { text: "Falls back to session auth", correct: false, explain: "Session fallback was removed in this PR." },
          { text: "Silently ignores the error", correct: false, explain: "No — expired tokens always throw." }
        ]
      },
      {
        type: "reveal",
        label: "Show edge-case discussion",
        body: "If the clock is skewed >30s, `exp` validation can reject valid tokens. We may want `clockTolerance` in the verify options."
      },
      {
        type: "link",
        url: "https://jwt.io/introduction",
        label: "JWT primer (external)"
      }
    ]
  },
  "API Pagination": {
    title: "PR #115: Cursor-based pagination",
    repo: "github/acme/api",
    base: "main",
    head: "feat/cursor-pagination",
    authors: ["charlie"],
    steps: [
      {
        type: "text",
        body: "Migrates all list endpoints from offset pagination to cursor-based. This eliminates skipped/duplicate rows under concurrent writes."
      },
      {
        type: "compare",
        left: { file: "src/routes/users.ts", ref: "main", lines: [10, 30] },
        right: { file: "src/routes/users.ts", ref: "feat/cursor-pagination", lines: [10, 38] },
        note: "Old offset vs new cursor approach side-by-side."
      },
      {
        type: "source",
        file: "src/lib/paginate.ts",
        lines: [1, 45],
        highlight: [20, 30],
        note: "Generic cursor encoder/decoder using base64 composite keys."
      },
      {
        type: "diff",
        file: "src/routes/users.ts",
        hunks: [1],
        note: "Query params change: page → cursor + limit."
      },
      {
        type: "shell",
        cmd: "curl localhost:3000/users?limit=2",
        output: '{\n  "data": [{"id":1},{"id":2}],\n  "next_cursor": "eyJpZCI6Mn0="\n}',
        note: "Response now includes a cursor token instead of page count."
      },
      {
        type: "checkpoint",
        prompt: "Why is cursor pagination better for concurrent writes?",
        choices: [
          { text: "Cursors point to a stable row, so inserts don't shift the window", correct: true, explain: "Exactly — offset N can shift when rows are added before it." },
          { text: "It uses less memory", correct: false, explain: "Memory usage is similar; the gain is consistency." }
        ]
      },
      {
        type: "section",
        title: "Migration notes",
        id: "migration",
        steps: [
          { type: "text", body: "All clients must update to use `cursor` instead of `page`. We added a deprecation header for the old param." },
          { type: "annotation", file: "src/routes/users.ts", line: 15, severity: "info", body: "Deprecation warning header added here." }
        ]
      }
    ]
  },
  "Quick Fix": {
    title: "Quick fix: null check",
    repo: "github/acme/app",
    base: "main",
    head: "fix/null-check",
    authors: ["dana"],
    steps: [
      { type: "text", body: "One-liner fix for a crash when user profile is missing." },
      {
        type: "diff",
        file: "src/components/Profile.tsx",
        hunks: [1],
        note: "Added optional chaining."
      },
      {
        type: "code",
        lang: "tsx",
        body: "// Crashed:\nconst name = user.profile.name;\n\n// Fixed:\nconst name = user?.profile?.name ?? 'Anonymous';"
      },
      {
        type: "annotation",
        file: "src/components/Profile.tsx",
        line: 8,
        severity: "praise",
        body: "Clean fix. Fallback string is a nice touch."
      }
    ]
  }
};

const TYPE_META = {
  text:       { icon: "¶",  color: "#7c8da6" },
  source:     { icon: "◇",  color: "#5b9cf5" },
  diff:       { icon: "±",  color: "#dba14e" },
  code:       { icon: "<>", color: "#a87ee0" },
  compare:    { icon: "⇄",  color: "#3ebfa5" },
  link:       { icon: "↗",  color: "#5b9cf5" },
  annotation: { icon: "●",  color: "#e06070" },
  checkpoint: { icon: "?",  color: "#dba14e" },
  reveal:     { icon: "▸",  color: "#7c8da6" },
  shell:      { icon: "$",  color: "#3ebfa5" },
  section:    { icon: "§",  color: "#a87ee0" },
  branch:     { icon: "⑂",  color: "#dba14e" },
};
const SEV = { info: "#5b9cf5", warn: "#dba14e", issue: "#e06070", praise: "#3ebfa5" };
const MONO = "'DM Mono','Menlo',monospace";
const SANS = "'Plus Jakarta Sans',system-ui,sans-serif";

/* ── tiny seed-random for stable fake code blocks ── */
const fakeBar = (seed) => "█".repeat(6 + ((seed * 7 + 13) % 28));

/* ── Step Renderers ─────────────────────────────────────────────── */

function FileBadge({ file, right }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 10px", background:"rgba(255,255,255,0.025)", borderBottom:"1px solid #1e1f24", borderRadius:"7px 7px 0 0", fontFamily:MONO, fontSize:11 }}>
      <span style={{ color:"#aaa", fontWeight:500 }}>{file}</span>
      <span style={{ color:"#555" }}>{right}</span>
    </div>
  );
}

function CodeBlock({ children }) {
  return <div style={{ fontFamily:MONO, fontSize:11.5, lineHeight:1.7, padding:"6px 0", background:"rgba(0,0,0,0.3)", borderRadius:"0 0 7px 7px", overflowX:"auto" }}>{children}</div>;
}

function CLine({ num, hl, hlColor, children }) {
  return (
    <div style={{ padding:"0 12px", whiteSpace:"pre", background: hl ? `${hlColor || "#dba14e"}11` : "transparent", borderLeft: hl ? `2px solid ${hlColor || "#dba14e"}` : "2px solid transparent" }}>
      {num != null && <span style={{ display:"inline-block", width:30, color:"#3a3c44", textAlign:"right", marginRight:12, userSelect:"none" }}>{num}</span>}
      {children}
    </div>
  );
}

function Note({ children }) {
  return <p style={{ margin:"8px 0 0", fontSize:11.5, color:"#6b7280", lineHeight:1.55, fontStyle:"italic" }}>{children}</p>;
}

function RSource({ step }) {
  const rows = step.lines[1] - step.lines[0] + 1;
  return (<div>
    <FileBadge file={step.file} right={`L${step.lines[0]}–${step.lines[1]}`} />
    <CodeBlock>
      {Array.from({length: Math.min(rows, 20)}, (_,i) => {
        const ln = step.lines[0]+i;
        const isHl = step.highlight && ln >= step.highlight[0] && ln <= step.highlight[1];
        return <CLine key={i} num={ln} hl={isHl}><span style={{opacity:0.25}}>{fakeBar(ln)}</span></CLine>;
      })}
      {rows > 20 && <CLine><span style={{color:"#444"}}>  … {rows-20} more lines</span></CLine>}
    </CodeBlock>
    {step.note && <Note>{step.note}</Note>}
  </div>);
}

const MOCK_DIFF = [
  { t:"ctx", s:"  const config = loadConfig();" },
  { t:"del", s:"- const user = await Session.find(sid);" },
  { t:"del", s:"- if (!user) return res.status(401).end();" },
  { t:"add", s:"+ const token = req.headers.authorization;" },
  { t:"add", s:"+ const user = verifyToken(token);" },
  { t:"add", s:"+ if (!user) return res.status(401).json({ error: 'Unauthorized' });" },
  { t:"ctx", s:"  req.user = user;" },
];
const DC = { ctx:"inherit", del:"#e06070", add:"#3ebfa5" };
const DB = { ctx:"transparent", del:"rgba(224,96,112,0.06)", add:"rgba(62,191,165,0.06)" };

function RDiff({ step }) {
  return (<div>
    <FileBadge file={step.file} right={`hunks ${Array.isArray(step.hunks)?step.hunks.join(", "):step.hunks}`} />
    <CodeBlock>
      {MOCK_DIFF.map((l,i) => (
        <div key={i} style={{ padding:"0 12px", whiteSpace:"pre", color:DC[l.t], background:DB[l.t] }}>
          <span style={{ display:"inline-block", width:30, color:"#3a3c44", textAlign:"right", marginRight:12, userSelect:"none" }}>{i+1}</span>{l.s}
        </div>
      ))}
    </CodeBlock>
    {step.note && <Note>{step.note}</Note>}
  </div>);
}

function RCode({ step }) {
  const lines = step.body.split("\n");
  return (<div>
    <FileBadge file="snippet" right={step.lang} />
    <CodeBlock>
      {lines.map((l,i) => (
        <CLine key={i} num={i+1}>
          <span style={{ color: l.trim().startsWith("//")||l.trim().startsWith("#") ? "#555" : "inherit" }}>{l}</span>
        </CLine>
      ))}
    </CodeBlock>
  </div>);
}

function RCompare({ step }) {
  const Side = ({ d, label }) => (
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#555", marginBottom:4 }}>{label}</div>
      <FileBadge file={d.file} right={`${d.ref} L${d.lines[0]}–${d.lines[1]}`} />
      <CodeBlock>
        {Array.from({length: d.lines[1]-d.lines[0]+1}, (_,i) => (
          <CLine key={i} num={d.lines[0]+i}><span style={{opacity:0.2}}>{fakeBar(d.lines[0]+i+7)}</span></CLine>
        ))}
      </CodeBlock>
    </div>
  );
  return (<div>
    <div style={{ display:"flex", gap:8 }}><Side d={step.left} label="before" /><Side d={step.right} label="after" /></div>
    {step.note && <Note>{step.note}</Note>}
  </div>);
}

function RAnnotation({ step }) {
  const c = SEV[step.severity] || "#7c8da6";
  return (
    <div style={{ borderLeft:`3px solid ${c}`, paddingLeft:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
        <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:c }}>{step.severity}</span>
        <span style={{ fontFamily:MONO, fontSize:10, color:"#555" }}>{step.file}:{step.line}</span>
      </div>
      <p style={{ margin:0, lineHeight:1.55 }}>{step.body}</p>
    </div>
  );
}

function RCheckpoint({ step }) {
  const [picked, setPicked] = useState(null);
  const ch = picked !== null ? step.choices[picked] : null;
  return (<div>
    <p style={{ margin:"0 0 10px", fontWeight:600, color:"#ddd" }}>{step.prompt}</p>
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {step.choices.map((c,i) => {
        const on = picked===i;
        const ok = c.correct;
        const bdr = on ? (ok?"#3ebfa5":"#e06070") : "#2a2b30";
        const bg = on ? (ok?"rgba(62,191,165,0.08)":"rgba(224,96,112,0.08)") : "transparent";
        return (
          <button key={i} onClick={()=>setPicked(i)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:7, border:`1px solid ${bdr}`, background:bg, color:"#d4d4d8", fontSize:12.5, fontFamily:SANS, textAlign:"left", cursor:"pointer", transition:"all .12s" }}>
            <span style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${bdr}`, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:10, flexShrink:0, color: on?(ok?"#3ebfa5":"#e06070"):"#555" }}>
              {on?(ok?"✓":"✗"):""}
            </span>
            {c.text}
          </button>
        );
      })}
    </div>
    {ch && <div style={{ marginTop:8, padding:"7px 12px", borderRadius:6, fontSize:12, background: ch.correct?"rgba(62,191,165,0.08)":"rgba(224,96,112,0.08)", color: ch.correct?"#3ebfa5":"#e06070", lineHeight:1.5 }}>{ch.explain}</div>}
  </div>);
}

function RReveal({ step }) {
  const [open, setOpen] = useState(false);
  return (<div>
    <button onClick={()=>setOpen(!open)} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 12px", borderRadius:6, border:"1px solid #2a2b30", background:"transparent", color:"#7c8da6", fontSize:12, fontWeight:500, fontFamily:SANS, cursor:"pointer" }}>
      <span style={{ display:"inline-block", transform:open?"rotate(90deg)":"none", transition:"transform .12s" }}>▸</span>
      {step.label}
    </button>
    {open && <div style={{ marginTop:8, padding:"10px 14px", background:"rgba(255,255,255,0.02)", borderRadius:7, lineHeight:1.6, fontSize:12.5, whiteSpace:"pre-wrap" }}>{step.body}</div>}
  </div>);
}

function RShell({ step }) {
  return (<div>
    <CodeBlock>
      <CLine><span style={{color:"#3ebfa5"}}>$</span> {step.cmd}</CLine>
      {step.output && step.output.split("\n").map((l,i)=><CLine key={i}><span style={{opacity:0.6}}>{l}</span></CLine>)}
    </CodeBlock>
    {step.note && <Note>{step.note}</Note>}
  </div>);
}

function RSection({ step, depth }) {
  return (
    <div style={{ borderLeft:"2px solid rgba(168,126,224,0.25)", paddingLeft:14, marginLeft: depth>0?0:0 }}>
      <div style={{ fontSize:13, fontWeight:700, color:"#a87ee0", marginBottom:10, letterSpacing:"-0.01em" }}>{step.title}</div>
      {step.steps && step.steps.map((s,i) => <StepCard key={i} step={s} index={`${step.id||"s"}.${i+1}`} depth={(depth||0)+1} />)}
    </div>
  );
}

function RLink({ step }) {
  return <a href={step.url} target="_blank" rel="noopener" style={{ color:"#5b9cf5", textDecoration:"none", borderBottom:"1px dashed rgba(91,156,245,0.4)", fontSize:13 }}>{step.label || step.url} ↗</a>;
}

function RText({ step }) {
  return <p style={{ margin:0, lineHeight:1.65, whiteSpace:"pre-wrap", color:"#bbb" }}>{step.body}</p>;
}

const R = { text:RText, source:RSource, diff:RDiff, code:RCode, compare:RCompare, link:RLink, annotation:RAnnotation, checkpoint:RCheckpoint, reveal:RReveal, shell:RShell, section:RSection };

function StepCard({ step, index, depth }) {
  const m = TYPE_META[step.type] || { icon:"?", color:"#7c8da6" };
  const Comp = R[step.type];
  return (
    <div style={{ border:"1px solid #1e1f24", borderRadius:9, padding:"12px 14px", background:"#141518", marginBottom: 2 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <span style={{ fontFamily:MONO, fontSize:10.5, fontWeight:600, padding:"2px 9px", borderRadius:5, background:`${m.color}12`, color:m.color, letterSpacing:"0.04em" }}>{m.icon} {step.type}</span>
        <span style={{ fontSize:10, color:"#3a3c44", fontFamily:MONO }}>#{index}</span>
      </div>
      {Comp ? <Comp step={step} depth={depth||0} /> : <pre style={{ margin:0, fontSize:11, opacity:0.5, whiteSpace:"pre-wrap" }}>{JSON.stringify(step,null,2)}</pre>}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────── */
export default function App() {
  const [pk, setPk] = useState("Auth Refactor");
  const [json, setJson] = useState(JSON.stringify(PRESETS["Auth Refactor"], null, 2));
  const [parsed, setParsed] = useState(PRESETS["Auth Refactor"]);
  const [err, setErr] = useState(null);

  const pick = (k) => {
    setPk(k);
    const t = JSON.stringify(PRESETS[k], null, 2);
    setJson(t);
    setParsed(PRESETS[k]);
    setErr(null);
  };
  const edit = useCallback((t) => {
    setJson(t);
    try { const o=JSON.parse(t); setParsed(o); setErr(null); } catch(e) { setErr(e.message.slice(0,80)); }
  },[]);

  const steps = parsed?.steps || [];

  return (
    <div style={{ display:"flex", height:"100vh", width:"100vw", fontFamily:SANS, fontSize:13, color:"#c8cad0", background:"#101114", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#2a2b30;border-radius:9px}
        button{cursor:pointer;font-family:inherit}
      `}</style>

      {/* LEFT */}
      <div style={{ width:"44%", minWidth:320, display:"flex", flexDirection:"column", borderRight:"1px solid #1a1b20", background:"#0c0d10" }}>
        <div style={{ padding:"16px 18px 6px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{ fontFamily:MONO, fontSize:13, fontWeight:500, color:"#5b9cf5" }}>{"{ }"}</span>
            <span style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#7c8da6" }}>Walkthrough DSL</span>
          </div>
          <div style={{ fontSize:10.5, color:"#444" }}>Edit the JSON or switch presets</div>
        </div>

        <div style={{ display:"flex", gap:5, padding:"10px 18px 12px", flexWrap:"wrap" }}>
          {Object.keys(PRESETS).map(k=>(
            <button key={k} onClick={()=>pick(k)} style={{ padding:"4px 11px", borderRadius:5, border: k===pk?"1px solid #5b9cf5":"1px solid #252630", background: k===pk?"rgba(91,156,245,0.08)":"transparent", color: k===pk?"#5b9cf5":"#666", fontSize:11, fontWeight:500, transition:"all .12s" }}>{k}</button>
          ))}
        </div>

        <div style={{ flex:1, position:"relative", minHeight:0 }}>
          <textarea value={json} onChange={e=>edit(e.target.value)} spellCheck={false} style={{ width:"100%", height:"100%", resize:"none", border:"none", outline:"none", padding:"12px 18px", fontFamily:MONO, fontSize:11.5, lineHeight:1.6, color:"#9ca0ae", background:"transparent", tabSize:2 }} />
          {err && <div style={{ position:"absolute", bottom:8, left:14, right:14, padding:"5px 10px", borderRadius:6, fontSize:10.5, fontFamily:MONO, background:"rgba(224,96,112,0.1)", color:"#e06070", border:"1px solid rgba(224,96,112,0.15)" }}>{err}</div>}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {parsed && <>
          {/* Header */}
          <div style={{ padding:"18px 22px 14px", borderBottom:"1px solid #1a1b20" }}>
            <div style={{ fontSize:17, fontWeight:700, color:"#e8e9ed", letterSpacing:"-0.02em" }}>{parsed.title||"Untitled"}</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
              {parsed.repo && <span style={{ fontSize:10.5, padding:"2px 9px", borderRadius:20, background:"rgba(91,156,245,0.08)", color:"#5b9cf5", fontFamily:MONO, fontWeight:500 }}>{parsed.repo}</span>}
              {parsed.base && parsed.head && <span style={{ fontSize:10.5, padding:"2px 9px", borderRadius:20, background:"rgba(219,161,78,0.08)", color:"#dba14e", fontFamily:MONO, fontWeight:500 }}>{parsed.base} ← {parsed.head}</span>}
              {parsed.authors && parsed.authors.map(a=>(
                <span key={a} style={{ fontSize:10.5, padding:"2px 9px", borderRadius:20, background:"rgba(168,126,224,0.08)", color:"#a87ee0", fontFamily:MONO, fontWeight:500 }}>@{a}</span>
              ))}
            </div>
          </div>

          {/* Step type strip */}
          <div style={{ display:"flex", gap:1, padding:"8px 22px", borderBottom:"1px solid #1a1b20", overflowX:"auto" }}>
            {steps.map((s,i)=>{
              const m = TYPE_META[s.type]||TYPE_META.text;
              return <div key={i} title={`#${i+1} ${s.type}`} style={{ width:26, height:26, borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:MONO, fontSize:12, color:m.color, background:`${m.color}0a`, flexShrink:0 }}>{m.icon}</div>;
            })}
          </div>

          {/* Steps */}
          <div style={{ flex:1, overflowY:"auto", padding:"14px 22px 40px", display:"flex", flexDirection:"column", gap:8 }}>
            {steps.map((s,i) => <StepCard key={`${pk}-${i}`} step={s} index={i+1} />)}
            {steps.length===0 && <div style={{ textAlign:"center", padding:40, color:"#333" }}>No steps defined</div>}
          </div>
        </>}
      </div>
    </div>
  );
}
