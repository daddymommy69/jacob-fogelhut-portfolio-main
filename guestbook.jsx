/* =========================================================================
   guestbook.jsx — Myspace-era forum guestbook (desktop app).
   Entries are shared through a Google Sheet (data.js → guestbook.endpoint,
   an Apps Script web-app URL — see GUESTBOOK-SETUP.md). With no endpoint
   set, entries save to this browser only. Delete an entry by deleting its
   row in the sheet. The three Krinky posts are fixed, at the bottom.
   ========================================================================= */
(function () {
  const { useState, useEffect, useRef } = React;
  const DATA = window.PORTFOLIO_DATA || {};
  const cfg = () => DATA.guestbook || {};
  const LOCAL = "jf-guestbook-v2";
  const SMILEYS = [":)", ":D", ";)", ":P", "xD", "<3", "^_^", ":O", "B)", ":("];
  const SM_RE = /(:\)|:D|;\)|:P|xD|&lt;3|<3|\^_\^|:O|B\)|:\()/g;
  const INKS = ["#1b1a16", "#e0245e", "#2f6fd1", "#2e9b4f"];
  const DW = 300, DH = 150;

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmt = (t) => {
    const d = new Date(t); if (isNaN(d)) return "";
    let h = d.getHours(); const ap = h >= 12 ? "pm" : "am"; h = h % 12 || 12;
    return `Posted: ${DAYS[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${h}:${String(d.getMinutes()).padStart(2, "0")} ${ap}`;
  };
  const href = (u) => { u = String(u || "").trim(); if (!u) return ""; return /^https?:\/\//i.test(u) ? u : "https://" + u; };
  const withSmileys = (s) => String(s || "").split(SM_RE).map((p, i) => (i % 2 ? <b key={i} className="gb-sm">{p}</b> : p));
  const parseQ = (q) => { if (!q) return null; if (typeof q === "object") return q; try { return JSON.parse(q); } catch (e) { return null; } };

  function Doodle({ onChange, resetKey }) {
    const cv = useRef(null);
    const [ink, setInk] = useState(INKS[0]);
    const [erase, setErase] = useState(false);
    const drawing = useRef(false), dirty = useRef(false);
    const clear = () => {
      const c = cv.current; if (!c) return;
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, DW, DH);
      dirty.current = false; onChange(null);
    };
    useEffect(clear, [resetKey]);
    const pt = (e) => { const r = cv.current.getBoundingClientRect(); return [(e.clientX - r.left) * DW / r.width, (e.clientY - r.top) * DH / r.height]; };
    const down = (e) => {
      e.preventDefault(); cv.current.setPointerCapture(e.pointerId); drawing.current = true;
      const x = cv.current.getContext("2d"), [px, py] = pt(e);
      x.lineCap = x.lineJoin = "round"; x.strokeStyle = erase ? "#fff" : ink; x.lineWidth = erase ? 14 : 3;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + 0.1, py); x.stroke();
    };
    const move = (e) => { if (!drawing.current) return; const x = cv.current.getContext("2d"), [px, py] = pt(e); x.lineTo(px, py); x.stroke(); dirty.current = true; };
    const up = () => {
      if (!drawing.current) return; drawing.current = false;
      if (!dirty.current) return;
      let u = cv.current.toDataURL("image/png");
      if (u.length > 40000) u = cv.current.toDataURL("image/jpeg", 0.6);
      onChange(u);
    };
    return (
      <div className="gb-doodle">
        <canvas ref={cv} width={DW} height={DH} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}></canvas>
        <div className="gb-tools">
          {INKS.map((c) => <button key={c} type="button" className={`gb-ink ${!erase && ink === c ? "on" : ""}`} style={{ background: c }} onClick={() => { setInk(c); setErase(false); }} aria-label={"Ink " + c}></button>)}
          <button type="button" className={`gb-tool ${erase ? "on" : ""}`} onClick={() => setErase((v) => !v)}>eraser</button>
          <button type="button" className="gb-tool" onClick={clear}>clear</button>
        </div>
      </div>);
  }

  function GuestbookApp() {
    const endpoint = cfg().endpoint || "";
    const [posts, setPosts] = useState([]);
    const [status, setStatus] = useState(endpoint ? "loading" : "local");
    const [open, setOpen] = useState(false);
    const [f, setF] = useState({ n: "", m: "", w: "", l: "", hp: "" });
    const [doodle, setDoodle] = useState(null);
    const [quote, setQuote] = useState(null);
    const [resetKey, setResetKey] = useState(0);
    const [busy, setBusy] = useState(false);
    const [cool, setCool] = useState(false);
    const taRef = useRef(null), bodyRef = useRef(null);

    const load = () => {
      if (!endpoint) { try { setPosts(JSON.parse(localStorage.getItem(LOCAL) || "[]")); } catch (e) {} return Promise.resolve(); }
      return fetch(endpoint).then((r) => r.json()).then((d) => { setPosts(Array.isArray(d) ? d : d.entries || []); setStatus("live"); })
        .catch(() => setStatus("offline"));
    };
    useEffect(() => { load(); }, []);

    const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
    const addSmiley = (s) => {
      const ta = taRef.current; const m = f.m;
      const at = ta ? ta.selectionStart : m.length;
      const pad = at && m[at - 1] !== " " ? " " : "";
      setF((x) => ({ ...x, m: m.slice(0, at) + pad + s + " " + m.slice(at) }));
      setTimeout(() => ta && ta.focus(), 0);
    };
    const startQuote = (p) => {
      setQuote({ n: p.n || "anon", m: String(p.m || "").slice(0, 220) });
      setOpen(true);
      setTimeout(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0; taRef.current && taRef.current.focus(); }, 30);
    };
    const submit = (e) => {
      e.preventDefault();
      if (busy || cool || f.hp) return;
      if (!f.m.trim() && !doodle) return;
      const entry = { t: new Date().toISOString(), n: f.n.trim().slice(0, 40) || "anon", m: f.m.trim().slice(0, 1200), w: f.w.trim().slice(0, 200), l: f.l.trim().slice(0, 60), d: doodle || "", q: quote ? JSON.stringify(quote) : "" };
      const done = () => {
        setF({ n: f.n, m: "", w: f.w, l: f.l, hp: "" }); setDoodle(null); setQuote(null); setResetKey((k) => k + 1);
        setOpen(false); setBusy(false); setCool(true); setTimeout(() => setCool(false), 20000);
      };
      setPosts((p) => [entry, ...p]);
      if (!endpoint) {
        try { const all = JSON.parse(localStorage.getItem(LOCAL) || "[]"); localStorage.setItem(LOCAL, JSON.stringify([entry, ...all].slice(0, 80))); } catch (err) {}
        done(); return;
      }
      setBusy(true);
      fetch(endpoint, { method: "POST", body: JSON.stringify(entry) }).then(() => load()).catch(() => {}).then(done);
    };

    const crew = (cfg().krinkyPosts || []);
    const list = [...posts].sort((a, b) => new Date(b.t) - new Date(a.t));
    const total = list.length + crew.length;

    const Post = ({ p, fixed }) => {
      const q = parseQ(p.q);
      return (
        <div className={`gb-post ${fixed ? "gb-crew" : ""}`}>
          <div className="gb-who">
            {p.w ? <a href={href(p.w)} target="_blank" rel="noreferrer nofollow ugc" className="gb-name">{p.n || "anon"}</a> : <span className="gb-name">{p.n || "anon"}</span>}
            {p.l && <span className="gb-loc">{p.l}</span>}
            {p.w && <a className="gb-site" href={href(p.w)} target="_blank" rel="noreferrer nofollow ugc">{String(p.w).replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 28)}</a>}
          </div>
          <div className="gb-main">
            <div className="gb-meta"><span>{fmt(p.t)}</span>{!fixed && <button type="button" onClick={() => startQuote(p)}>quote</button>}</div>
            {q && <blockquote className="gb-q"><b>{q.n} wrote:</b>{withSmileys(q.m)}</blockquote>}
            {p.m && <p className="gb-msg">{withSmileys(p.m)}</p>}
            {p.d && <img className="gb-dimg" src={p.d} alt={"doodle by " + (p.n || "anon")} />}
          </div>
        </div>);
    };

    return (
      <div className="gb" ref={bodyRef}>
        <div className="gb-head">
          <div className="gb-title">Jacob's Guestbook <i>✦</i></div>
          <div className="gb-sub">{total} signature{total === 1 ? "" : "s"} · {status === "local" ? "saved on this device" : status === "offline" ? "couldn't reach the guestbook" : status === "loading" ? "loading…" : "live"}</div>
        </div>
        <div className="gb-bar">
          <span>Leave me a message</span>
          <button type="button" className="gb-sign" onClick={() => setOpen((v) => !v)}>{open ? "never mind" : "Sign my guestbook!"}</button>
        </div>
        {open &&
          <form className="gb-form" onSubmit={submit}>
            {quote && <div className="gb-qchip">replying to <b>{quote.n}</b><button type="button" onClick={() => setQuote(null)} aria-label="Remove quote">×</button></div>}
            <div className="gb-fields">
              <label>name<input value={f.n} onChange={set("n")} maxLength={40} placeholder="xXcoolnameXx" /></label>
              <label>location<input value={f.l} onChange={set("l")} maxLength={60} placeholder="where u at" /></label>
              <label className="gb-wide">website<input value={f.w} onChange={set("w")} maxLength={200} placeholder="optional" /></label>
            </div>
            <input className="gb-hp" tabIndex={-1} autoComplete="off" value={f.hp} onChange={set("hp")} aria-hidden="true" />
            <label className="gb-wide">message<textarea ref={taRef} value={f.m} onChange={set("m")} maxLength={1200} placeholder="say something nice (or weird)"></textarea></label>
            <div className="gb-smileys">{SMILEYS.map((s) => <button type="button" key={s} onClick={() => addSmiley(s)}>{s}</button>)}</div>
            <div className="gb-dlabel">draw something (optional)</div>
            <Doodle onChange={setDoodle} resetKey={resetKey} />
            <div className="gb-actions">
              <button type="submit" className="gb-post-btn" disabled={busy || cool || (!f.m.trim() && !doodle)}>{busy ? "posting…" : cool ? "posted!" : "Post"}</button>
            </div>
          </form>}
        <div className="gb-list">
          {list.map((p, i) => <Post key={(p.t || "") + i} p={p} />)}
          {crew.map((p, i) => <Post key={"k" + i} p={p} fixed />)}
        </div>
      </div>);
  }

  window.GuestbookApp = GuestbookApp;
})();
