/* =========================================================================
   XP DESKTOP — opens from the monitor object in the desk scene.
   Windows-XP (2004) homage: Bliss-ish wallpaper, Luna title bars,
   green Start button, taskbar. Holds the "computer" apps:
   Projects/websites, Decks, Letter writer, readme, Recycle Bin.
   Exports <XPDesktop/> to window.
   ========================================================================= */
(function () {
  const { useState, useEffect, useRef, useCallback } = React;
  const DATA = window.PORTFOLIO_DATA;
  const PG = DATA.playground;

  /* ---------- little XP-ish icons (inline SVG) ---------- */
  const SvgFolder = () => (
    <svg viewBox="0 0 48 48"><path d="M5 12h13l4 5h21a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2z" fill="#f6c14b" stroke="#b07e1e"/><path d="M5 19h40v20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="#ffd874" stroke="#b07e1e"/></svg>
  );
  const SvgWeb = () => (
    <svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#2b7fe0" stroke="#16458f"/><ellipse cx="24" cy="24" rx="9" ry="19" fill="none" stroke="#cfe6ff"/><path d="M6 19h36M6 29h36M5 24h38" stroke="#cfe6ff" fill="none"/><path d="M16 12c4 6 12 6 16 0M16 36c4-6 12-6 16 0" stroke="#cfe6ff" fill="none"/></svg>
  );
  const SvgNote = () => (
    <svg viewBox="0 0 48 48"><path d="M12 5h17l8 8v30H12z" fill="#fff" stroke="#9aa0aa"/><path d="M29 5v8h8" fill="#dfe3e8" stroke="#9aa0aa"/><path d="M17 20h14M17 25h14M17 30h10" stroke="#5b7fb0"/></svg>
  );
  const SvgLetter = () => (
    <svg viewBox="0 0 48 48"><rect x="6" y="11" width="36" height="26" rx="2" fill="#fff" stroke="#9aa0aa"/><path d="M6 13l18 13 18-13" fill="none" stroke="#e8624a" strokeWidth="2"/></svg>
  );
  const SvgRecycle = ({ full }) => (
    <svg viewBox="0 0 48 48"><path d="M13 16h22l-2 26a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2z" fill={full ? "#9fb7d4" : "#cdd6e0"} stroke="#5a6b80"/><path d="M19 22v15M24 22v15M29 22v15" stroke="#5a6b80"/><path d="M10 14h28" stroke="#5a6b80" strokeWidth="2"/><path d="M19 14l2-4h6l2 4" fill="none" stroke="#5a6b80"/></svg>
  );
  const SvgDeck = () => (
    <svg viewBox="0 0 48 48"><rect x="8" y="9" width="32" height="24" rx="1.5" fill="#2b7fe0" stroke="#16458f"/><path d="M12 13h24v16H12z" fill="#bfe0ff"/><path d="M24 33v6M16 41h16" stroke="#5a6b80" strokeWidth="2"/></svg>
  );
  const SvgImg = () => (
    <svg viewBox="0 0 48 48"><rect x="6" y="9" width="36" height="30" rx="2" fill="#fff" stroke="#9aa0aa"/><circle cx="16" cy="18" r="3" fill="#f6c14b"/><path d="M9 35l10-11 7 7 6-5 7 9z" fill="#7cc26a" stroke="#4f9e2e"/></svg>
  );

  /* ---------- draggable window ---------- */
  /* Window-control marks drawn on the same 16px grid / 1.6px weight as the
     desk's icon set, so the XP chrome matches the rest of the playground
     instead of borrowing Unicode glyphs from three different typefaces. */
  const XIco = {
    min: <svg className="xwico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4.4 11.2 H11.6" /></svg>,
    close: <svg className="xwico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4.8 4.8 L11.2 11.2 M11.2 4.8 L4.8 11.2" /></svg>,
    tidy: <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><rect x="2.4" y="3" width="5.6" height="4.6" rx="1" /><rect x="8.6" y="8.4" width="5" height="4.6" rx="1" /></svg>
  };

  function XWin({ id, title, icon, z, minimized, onFocus, onClose, onMin, onGeom, children, init }) {
    const ref = useRef(null);
    /* Every measurement here is against the parent .xp-desk — the computer's
       SCREEN — not window.innerWidth/innerHeight. The viewport-based version
       spawned windows off-centre whenever the computer was windowed, and its
       drag clamp let you pull a window clean out of the computer, where
       overflow:hidden erased it with no way to get it back. */
    const host = () => ref.current && ref.current.parentElement;
    useEffect(() => {
      const el = ref.current, p = host();
      if (!el || !p) return;
      const W = p.clientWidth, H = p.clientHeight;
      el.style.maxHeight = Math.max(140, H - 12) + "px";
      const w = el.offsetWidth, h = el.offsetHeight;
      const x = init?.x ?? Math.round((W - w) / 2 + (Math.random() * 44 - 22));
      const y = init?.y ?? Math.round((H - h) / 2 - 16);
      el.style.left = Math.max(4, Math.min(Math.max(4, W - w - 4), x)) + "px";
      el.style.top = Math.max(4, Math.min(Math.max(4, H - h - 4), y)) + "px";
      onGeom && onGeom();
    }, []);
    const onDown = (e) => {
      if (e.target.closest(".xw-btns")) return;
      onFocus(id);
      const el = ref.current, p = host(), bar = e.currentTarget; bar.classList.add("grab");
      const W = p.clientWidth, H = p.clientHeight;
      const sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
      const move = (ev) => {
        const w = el.offsetWidth, h = el.offsetHeight;
        el.style.left = Math.max(0, Math.min(Math.max(0, W - w), ox + ev.clientX - sx)) + "px";
        el.style.top = Math.max(0, Math.min(Math.max(0, H - h), oy + ev.clientY - sy)) + "px";
      };
      const up = () => {
        bar.classList.remove("grab");
        window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
        onGeom && onGeom();
      };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    };
    /* One bottom-right grip, the way XP did it. The CSS max-width has to be
       released first or an explicit width past 640px silently does nothing. */
    const onRz = (e) => {
      e.preventDefault(); e.stopPropagation(); onFocus(id);
      const el = ref.current, p = host();
      const W = p.clientWidth, H = p.clientHeight;
      const l = el.offsetLeft, t = el.offsetTop;
      const sx = e.clientX, sy = e.clientY, w0 = el.offsetWidth, h0 = el.offsetHeight;
      el.style.maxWidth = "none"; el.style.maxHeight = "none";
      const move = (ev) => {
        el.style.width = Math.max(240, Math.min(W - l - 4, w0 + ev.clientX - sx)) + "px";
        el.style.height = Math.max(120, Math.min(H - t - 4, h0 + ev.clientY - sy)) + "px";
      };
      const up = () => {
        window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
        onGeom && onGeom();
      };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    };
    return (
      <div className="xwin" ref={ref} style={{ zIndex: z, display: minimized ? "none" : "flex" }} onPointerDown={() => onFocus(id)}>
        <div className="xw-bar" onPointerDown={onDown}>
          <span className="xw-ic">{icon}</span>
          <b>{title}</b>
          <span className="xw-btns">
            <button className="mn" onClick={() => onMin(id)} title="Minimize" aria-label="Minimize">{XIco.min}</button>
            <button className="cl" onClick={() => onClose(id)} title="Close" aria-label="Close">{XIco.close}</button>
          </span>
        </div>
        <div className="xw-body">{children}</div>
        <span className="xw-rz" onPointerDown={onRz} title="Drag to resize" />
      </div>
    );
  }

  /* ---------- apps ---------- */
  function ProjectsFolder({ onOpen }) {
    return (
      <div className="xfolder">
        {PG.projects.map((p) => (
          <button key={p.id} className="xfile" onClick={() => onOpen(p.kind === "web" ? "web:" + p.id : "img:" + p.id)}>
            <span className="xf-img">{p.kind === "web" ? <SvgWeb/> : <SvgImg/>}</span>
            <span className="xf-lbl">{p.title}</span>
          </button>
        ))}
      </div>
    );
  }
  function WebViewer({ project }) {
    return (
      <div className="xp-web">
        <div className="xw-url"><span>🌐</span><input readOnly value={project.src} /><a href={project.src} target="_blank" rel="noreferrer">Go</a></div>
        <iframe src={project.src} title={project.title} loading="lazy"></iframe>
      </div>
    );
  }
  function ImageViewer({ project }) {
    return (<><div className="xp-img">{project.pending ? "IMAGE COMING SOON" : ""}</div><div className="xp-pane" style={{ paddingTop: 0 }}>{project.note}</div></>);
  }
  function DecksFolder() {
    return (
      <div>
        {DATA.decks.map((d) => (
          <a key={d.id} className="deckrow" href={`mailto:${DATA.email}?subject=${encodeURIComponent("Deck request — " + d.client + " " + d.title)}`}>
            <span className="dk-art">DECK</span>
            <span><b>{d.client} — {d.title}</b><span>{d.note} · click to request</span></span>
          </a>
        ))}
      </div>
    );
  }
  function Readme() {
    return <div className="xp-pane"><h4>readme.txt</h4><div className="xp-readme">{PG.about}</div></div>;
  }
  function LetterApp({ marker }) {
    const [text, setText] = useState("Dear friend,\n\n");
    const download = async () => {
      try { await document.fonts.load('40px JacobMarker'); await document.fonts.ready; } catch (e) {}
      const W = 800, H = 1040, pad = 70;
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#efe2c4"; ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W/2, H/3, 100, W/2, H/2, H);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(90,60,20,0.14)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(150,120,70,0.35)"; ctx.lineWidth = 1;
      for (let y = pad + 46; y < H - pad; y += 46) { ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke(); }
      ctx.fillStyle = "#2a2118"; ctx.font = '40px JacobMarker, serif'; ctx.textBaseline = "alphabetic";
      const maxW = W - pad * 2; let y = pad + 40;
      text.split("\n").forEach((line) => {
        let words = line.split(" "), cur = "";
        words.forEach((w) => { const test = cur ? cur + " " + w : w; if (ctx.measureText(test).width > maxW && cur) { ctx.fillText(cur, pad, y); y += 46; cur = w; } else cur = test; });
        ctx.fillText(cur, pad, y); y += 46;
      });
      const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = "letter.png"; a.click();
    };
    return (
      <div className="xletter">
        <div className="l-paper" style={!marker ? { fontFamily: "monospace", fontSize: 15, lineHeight: "30px" } : null}>{text || " "}</div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="write your letter…" />
        <div className="l-row"><button className="xbtn" onClick={download}>💾 Download as PNG</button><span style={{ fontSize: 11, color: "#6b6452" }}>written in Jacob's hand</span></div>
      </div>
    );
  }
  function RecycleApp() {
    const [msg, setMsg] = useState("");
    const lines = ["nice try.", "that idea stays buried.", "you didn't see anything.", "deleted for a reason 😅", "the cutting room floor."];
    return (
      <div className="xp-trash">
        {PG.trash.map((f, i) => (<button className="tr" key={f} onClick={() => setMsg(lines[i % lines.length])} style={{ width: "100%", textAlign: "left", background: "none", border: 0 }}><span>📄</span>{f}</button>))}
        <div className="tr-msg">{msg}</div>
      </div>
    );
  }

  /* ---------- app registry ---------- */
  const APPS = {
    projects: { title: "My Projects", icon: <SvgFolder/>, body: (ctx) => <ProjectsFolder onOpen={ctx.open} /> },
    decks:    { title: "Pitch Decks", icon: <SvgDeck/>,   body: () => <DecksFolder /> },
    letter:   { title: "Letter Writer", icon: <SvgLetter/>, body: (ctx) => <LetterApp marker={ctx.marker} /> },
    readme:   { title: "readme.txt — Notepad", icon: <SvgNote/>, body: () => <Readme /> },
    trash:    { title: "Recycle Bin", icon: <SvgRecycle full/>, body: () => <RecycleApp /> }
  };
  function webApp(p) { return { title: p.title + " — Internet", icon: <SvgWeb/>, body: () => <WebViewer project={p} /> }; }
  function imgApp(p) { return { title: p.title, icon: <SvgImg/>, body: () => <ImageViewer project={p} /> }; }

  const DESK_ICONS = [
    { id: "projects", lbl: "My Projects", icon: <SvgFolder/> },
    { id: "decks", lbl: "Pitch Decks", icon: <SvgDeck/> },
    { id: "letter", lbl: "Letter Writer", icon: <SvgLetter/> },
    { id: "readme", lbl: "readme.txt", icon: <SvgNote/> },
    { id: "trash", lbl: "Recycle Bin", icon: <SvgRecycle/> }
  ];

  function XPDesktop({ onExit, marker, wallpaper, wallpaperCrop, windowed, onRestore }) {
    const [wins, setWins] = useState([]);   // {key, app}
    const [clock, setClock] = useState(() => new Date());
    const [stray, setStray] = useState(false);
    const deskRef = useRef(null);
    /* z lives in a ref, not state. The old code called setZTop inside a setWins
       updater (and read a stale zTop from its closure), so opening several
       windows in the same tick handed them all the SAME z-index and clicking
       one no longer reliably brought it to the front. */
    const zRef = useRef(10);
    const nextZ = () => ++zRef.current;
    useEffect(() => { const id = setInterval(() => setClock(new Date()), 30000); return () => clearInterval(id); }, []);

    const focus = useCallback((key) => {
      const nz = nextZ();
      setWins((w) => w.map((x) => x.key === key ? { ...x, z: nz, minimized: false } : x));
    }, []);
    const open = useCallback((id) => {
      let key = id, app;
      if (id.startsWith("web:")) { const p = PG.projects.find((x) => x.id === id.slice(4)); app = webApp(p); }
      else if (id.startsWith("img:")) { const p = PG.projects.find((x) => x.id === id.slice(4)); app = imgApp(p); }
      else app = APPS[id];
      if (!app) return;
      const nz = nextZ();
      setWins((w) => {
        const ex = w.find((x) => x.key === key);
        if (ex) return w.map((x) => x.key === key ? { ...x, z: nz, minimized: false } : x);
        return [...w, { key, app, z: nz, minimized: false }];
      });
    }, []);
    const close = (key) => setWins((w) => w.filter((x) => x.key !== key));
    const min = (key) => setWins((w) => w.map((x) => x.key === key ? { ...x, minimized: true } : x));

    /* Containment keeps windows in, but a window can still end up out of
       reach if the computer is resized smaller around it — so the tidy button
       appears only once something is actually stranded. */
    const checkStray = useCallback(() => {
      const d = deskRef.current; if (!d) return;
      const W = d.clientWidth, H = d.clientHeight;
      const bad = Array.from(d.querySelectorAll(".xwin")).some((w) => {
        if (w.style.display === "none") return false;
        return w.offsetLeft < -2 || w.offsetTop < -2 ||
          w.offsetLeft + w.offsetWidth > W + 2 || w.offsetTop + w.offsetHeight > H + 2;
      });
      setStray(bad);
    }, []);
    useEffect(() => {
      const on = () => checkStray();
      window.addEventListener("resize", on);
      const id = setInterval(on, 1200);
      return () => { window.removeEventListener("resize", on); clearInterval(id); };
    }, [checkStray]);
    const tidy = () => {
      const d = deskRef.current; if (!d) return;
      const W = d.clientWidth, H = d.clientHeight;
      Array.from(d.querySelectorAll(".xwin")).forEach((w, i) => {
        w.style.maxWidth = "none";
        w.style.width = Math.min(w.offsetWidth, Math.max(240, W - 32)) + "px";
        w.style.height = Math.min(w.offsetHeight, Math.max(120, H - 32)) + "px";
        w.style.left = Math.min(Math.max(0, W - w.offsetWidth), 16 + i * 24) + "px";
        w.style.top = Math.min(Math.max(0, H - w.offsetHeight), 16 + i * 24) + "px";
      });
      setStray(false);
    };

    const ctx = { open, marker };
    const showPhoto = wallpaper === "cycle" && wallpaperCrop && wallpaperCrop.u;

    return (
      <div className={windowed ? "xp xp-win" : "xp"}>
        {onRestore && <button className="xp-restore-sq" onClick={onRestore} title="Restore down">▢</button>}
        <div className="xp-wall"></div>
        {showPhoto && <div className="xp-wall-photo"><CroppedImg value={wallpaperCrop} /></div>}
        <div className="xp-desk" ref={deskRef}>
          <div className="xp-icons">
            {DESK_ICONS.map((ic) => (
              <button key={ic.id} className="xp-ic" onClick={() => open(ic.id)}>
                <span className="xi-img">{ic.icon}</span>
                <span className="xi-lbl">{ic.lbl}</span>
              </button>
            ))}
          </div>
          {wins.map((w) => (
            <XWin key={w.key} id={w.key} title={w.app.title} icon={w.app.icon} z={w.z} minimized={w.minimized}
                  onFocus={focus} onClose={close} onMin={min} onGeom={checkStray}>
              {w.app.body(ctx)}
            </XWin>
          ))}
          {stray && <button className="xp-tidy" onClick={tidy} title="Bring stranded windows back">{XIco.tidy}tidy windows</button>}
        </div>
        <div className="xp-task">
          <button className="xp-start"><span className="orb"></span>start</button>
          <div className="xp-tasks">
            {wins.map((w) => (
              <button key={w.key} className={`xp-tab ${!w.minimized ? "on" : ""}`} onClick={() => (w.minimized ? focus(w.key) : min(w.key))}>
                {w.app.icon}<span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.app.title}</span>
              </button>
            ))}
          </div>
          {onRestore && <button className="xp-exit" onClick={onRestore} title="Restore to window">⤢ window</button>}
          <button className="xp-exit" onClick={onExit}>✕ leave desktop</button>
          <div className="xp-clock">{clock.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
        </div>
      </div>
    );
  }

  window.XPDesktop = XPDesktop;
})();
