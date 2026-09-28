/* =========================================================================
   teaser-desk.jsx — the mini live desktop on the main site. Wallpaper from
   the desktop's wallpaper slots, three icons that deep-link into their app,
   and all three Krinkys wandering around talking. Lines live in data.js →
   krinkyCrew. Clicking anywhere (except a Krinky) enters the desktop.
   ========================================================================= */
(function () {
  const { useState, useEffect, useRef, useMemo } = React;
  const DATA = window.PORTFOLIO_DATA || {};
  const FPS = 12, MS = 1000 / FPS, SZ = 60, TB = 30, ICONW = 96, STEP = 2700;
  const KINDS = ["disc", "cursor", "player"];
  const crew = () => DATA.krinkyCrew || {};
  const lines = (k, pool = "lines") => ((crew()[k] || {})[pool]) || [];
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  const ICONS = [
    { app: "radio", label: "Radio", ic: "Radio" },
    { app: "listening", label: "What I'm listening to", ic: "Headphones" },
    { app: "guestbook", label: "Guestbook", ic: "Book" }];

  /* the desktop reads this once it has booted and opens that app */
  window.deskDeepLink = (app) => {
    try { if (app) sessionStorage.setItem("jf-desk-open", app); } catch (e) {}
    location.hash = "playground";
  };

  function MiniDesk() {
    const slots = window.useMediaSlots ? window.useMediaSlots() : {};
    const walls = useMemo(() => {
      const w = window.MediaSlots.collectCrops(slots, "wall:", 12);
      if (w.length) return w;
      const out = [];
      for (let a = 0; a < 4; a++) { const c = window.MediaSlots.crop(slots, "alb:" + a + ":cover"); if (c) out.push(c); }
      return out;
    }, [slots]);
    const [wi, setWi] = useState(0);
    useEffect(() => {
      if (walls.length < 2) return;
      const t = setInterval(() => setWi((i) => (i + 1) % walls.length), 9000);
      return () => clearInterval(t);
    }, [walls.length]);

    const hostRef = useRef(null);
    const [, setT] = useState(0);
    const vis = useRef(true);
    const frame = useRef(0);
    const reduced = useMemo(() => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
    const bots = useRef(KINDS.map((k) => ({ k, x: 0, y: 0, tx: null, ty: null, f: 1, s: "idle", hop: 0, spin: 0, placed: false })));
    const [bub, setBub] = useState(null);
    const [poke, setPoke] = useState(null);
    const pokeT = useRef(0);

    /* motion clock */
    useEffect(() => {
      const el = hostRef.current; if (!el) return;
      const io = new IntersectionObserver(([e]) => { vis.current = e.isIntersecting; }, { threshold: 0.05 });
      io.observe(el);
      let raf = 0, last = performance.now(), acc = 0, dead = false;
      const tick = () => {
        const W = el.clientWidth, H = el.clientHeight - TB;
        if (W < 160 || H < 100) return;
        const n = ++frame.current;
        const left = W < 520 ? 8 : ICONW;
        bots.current.forEach((b, i) => {
          if (!b.placed) { b.placed = true; b.x = left + (W - left) * (0.22 + i * 0.26) - SZ / 2; b.y = H * (0.5 + (i % 2 ? 0.14 : -0.04)) - SZ / 2; b.f = i === 1 ? -1 : 1; }
          if (b.hop > 0) b.hop--;
          if (b.spin > 0) b.spin--;
          if (!reduced && b.tx != null) {
            const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy), sp = b.spin ? 8 : 3;
            if (d < sp) { b.tx = null; b.s = "idle"; }
            else { b.s = "walk"; if (Math.abs(dx) > 0.5) b.f = dx > 0 ? 1 : -1; b.x += dx / d * sp; b.y += dy / d * sp; }
          } else if (!reduced && Math.random() < 0.014) {
            b.tx = left + Math.random() * Math.max(20, W - left - SZ - 8);
            b.ty = 8 + Math.random() * Math.max(20, H - SZ - 16);
          }
          b.x = Math.max(4, Math.min(W - SZ - 4, b.x));
          b.y = Math.max(4, Math.min(H - SZ - 4, b.y));
        });
        setT(n);
      };
      const loop = (ts) => {
        if (dead) return;
        try { acc += ts - last; last = ts; if (acc >= MS) { acc = Math.min(acc - MS, MS); if (vis.current) tick(); } } catch (e) {}
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      return () => { dead = true; cancelAnimationFrame(raf); io.disconnect(); };
    }, []);

    /* who talks: solo lines take turns; sometimes a little scene */
    useEffect(() => {
      let dead = false, lastK = null;
      const T = [];
      const later = (fn, ms) => T.push(setTimeout(() => { if (!dead) fn(); }, ms));
      const next = () => {
        if (!vis.current) { later(next, 1500); return; }
        const cs = crew().convos || [];
        if (cs.length && Math.random() < 0.45) {
          const c = rnd(cs);
          c.forEach(([k, t], i) => later(() => setBub({ k, text: t, id: Math.random() }), i * STEP));
          later(() => { setBub(null); later(next, 1300); }, c.length * STEP + 500);
        } else {
          const ks = KINDS.filter((k) => k !== lastK && lines(k).length);
          if (!ks.length) return;
          const k = rnd(ks); lastK = k;
          setBub({ k, text: rnd(lines(k)), id: Math.random() });
          later(() => { setBub(null); later(next, 1300); }, 3900);
        }
      };
      later(next, 900);
      return () => { dead = true; T.forEach(clearTimeout); };
    }, []);

    const enter = () => { location.hash = "playground"; };
    const poked = (e, b) => {
      e.stopPropagation(); e.preventDefault();
      const el = hostRef.current;
      b.spin = 14; b.hop = 6;
      if (el) { b.tx = Math.random() * (el.clientWidth - SZ); b.ty = Math.random() * (el.clientHeight - TB - SZ); }
      const L = lines(b.k, "click");
      if (L.length) {
        clearTimeout(pokeT.current);
        setPoke({ k: b.k, text: rnd(L), id: Math.random() });
        pokeT.current = setTimeout(() => setPoke(null), 2600);
      }
    };
    useEffect(() => () => clearTimeout(pokeT.current), []);

    const el = hostRef.current;
    const W = el ? el.clientWidth : 900;
    const show = poke || bub;
    const sb = show && bots.current.find((b) => b.k === show.k);
    let bStyle = null;
    if (sb) {
      const BW = Math.min(240, W - 16);
      const below = sb.y < 96;
      bStyle = { left: Math.max(8, Math.min(W - BW - 8, sb.x + SZ / 2 - BW / 2)), width: BW, top: below ? sb.y + SZ + 8 : sb.y - 8, transform: below ? "none" : "translateY(-100%)" };
    }
    const I = window.DeskIcons || {};
    const wall = walls.length ? walls[wi % walls.length] : null;
    const clock = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    return (
      <div className="mdw" role="link" tabIndex={0} aria-label="Open jacob_desktop.exe"
        onClick={enter} onKeyDown={(e) => { if (e.key === "Enter") enter(); }}>
      <div className="mdw-bar">
        <span className="mdw-title">jacob_desktop.exe</span>
        <button className="mdw-x" type="button" aria-label="Close (does nothing)" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
          <svg viewBox="0 0 8 7" aria-hidden="true"><path d="M0 0h2v1h1v1h2V1h1V0h2v1H7v1H6v1H5v1h1v1h1v1h1v1H6V6H5V5H3v1H2v1H0V6h1V5h1V4h1V3H2V2H1V1H0z" fill="currentColor" /></svg>
        </button>
      </div>
      <div className="md" ref={hostRef}>
        <div className="md-wall">
          {wall ? <div className="md-wl" key={wi}><CroppedImg value={wall} alt="" /></div> : <div className="md-wl md-wl-empty" />}
        </div>
        <div className="md-icons">
          {ICONS.map((x) => {
            const Ic = I[x.ic];
            return (
              <button key={x.app} className="md-ic" onClick={(e) => { e.stopPropagation(); window.deskDeepLink(x.app); }} aria-label={"Open " + x.label}>
                {Ic ? <Ic s={40} /> : null}<span>{x.label}</span>
              </button>);
          })}
        </div>
        {bots.current.map((b) => {
          const hopY = b.hop > 0 ? -Math.sin((6 - b.hop) / 6 * Math.PI) * 16 : 0;
          return (
            <div key={b.k} className="md-kr" style={{ left: b.x, top: b.y + hopY, width: SZ, height: SZ }}
              onPointerEnter={() => { if (!b.hop) b.hop = 6; }} onClick={(e) => poked(e, b)}>
              {window.KrinkyArt && <window.KrinkyArt kind={b.k} state={b.s} frame={frame.current + KINDS.indexOf(b.k) * 7} facing={b.f} spin={b.spin > 0} size={SZ} />}
            </div>);
        })}
        {show && bStyle && <div className="md-bub" key={show.id} style={bStyle}><div className="md-bal">{show.text}</div></div>}
        <div className="md-bar">
          <span className="md-start"><em><i></i><i></i><i></i><i></i></em>start</span>
          <span className="md-task">{I.Home ? <I.Home s={14} /> : null}<span>jacob_desktop.exe</span></span>
          <span className="md-cta">click to come in →</span>
          <span className="md-tray">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h3l4-3v10l-4-3H2z" fill="#fff" /><path d="M11 5.5c1 .8 1 4.2 0 5M12.8 4c1.8 1.6 1.8 6.4 0 8" fill="none" stroke="#fff" strokeWidth="1.2" /></svg>
            {clock}
          </span>
        </div>
      </div>
      </div>);
  }

  window.MiniDesk = MiniDesk;
})();
