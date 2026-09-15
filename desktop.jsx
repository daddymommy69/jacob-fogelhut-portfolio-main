/* =========================================================================
   desktop.jsx — the Playground route. One full-screen desktop; every part
   of the old desk scene is an app inside it.

   Icon positions are Jacob's, not the visitor's: they persist through the
   host bridge into desk-icons.state.json (allowlisted *.state.json write,
   same rule as the media stores), so a visitor sees the arrangement he
   committed and cannot move it.
   ========================================================================= */
(function () {
  const { useState, useEffect, useRef, useCallback, useMemo } = React;
  const DATA = window.PORTFOLIO_DATA;
  const PG = DATA.playground;
  const I = window.DeskIcons;
  const APPS = window.DeskApps;
  const CroppedImg = window.CroppedImg;

  const POS_FILE = "desk-icons.state.json";
  const BOOT_KEY = "jf-desk-booted-v1";
  const ORDER = ["projects", "radio", "photos", "paint", "decks", "guestbook", "letter", "font", "trash"];
  const writer = () => (window.omelette && window.omelette.writeFile) || null;

  /* ---------------- boot ---------------- */
  function Boot({ onDone }) {
    const [out, setOut] = useState(false);
    useEffect(() => {
      const a = setTimeout(() => setOut(true), 2300);
      const b = setTimeout(onDone, 2850);
      return () => { clearTimeout(a); clearTimeout(b); };
    }, [onDone]);
    return (
      <div className={`dk-boot ${out ? "out" : ""}`} onClick={onDone}>
        <div className="dk-boot-in">
          <div className="dk-boot-name">{DATA.name}</div>
          <div className="dk-boot-sub">starting up</div>
          <div className="dk-boot-bar"><i /></div>
        </div>
      </div>);
  }

  /* ---------------- window ---------------- */
  function Win({ id, app, z, minimized, focus, close, min, children }) {
    const ref = useRef(null);
    useEffect(() => {
      const el = ref.current, host = el && el.parentElement; if (!host) return;
      const W = host.clientWidth, H = host.clientHeight;
      const w = Math.min(app.size.w, Math.max(240, W - 24));
      const h = Math.min(app.size.h, Math.max(160, H - 24));
      el.style.width = w + "px"; el.style.height = h + "px";
      const n = host.querySelectorAll(".dkw").length;
      el.style.left = Math.max(4, Math.min(W - w - 4, 130 + (n % 5) * 26)) + "px";
      el.style.top = Math.max(4, Math.min(H - h - 4, 34 + (n % 5) * 24)) + "px";
    }, []);
    const onDown = (e) => {
      if (e.target.closest(".dkw-btns")) return;
      focus(id);
      const el = ref.current, host = el.parentElement, bar = e.currentTarget;
      bar.classList.add("grab");
      const W = host.clientWidth, H = host.clientHeight;
      const sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
      const move = (ev) => {
        el.style.left = Math.max(0, Math.min(Math.max(0, W - el.offsetWidth), ox + ev.clientX - sx)) + "px";
        el.style.top = Math.max(0, Math.min(Math.max(0, H - el.offsetHeight), oy + ev.clientY - sy)) + "px";
      };
      const up = () => { bar.classList.remove("grab"); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    };
    const onRz = (e) => {
      e.preventDefault(); e.stopPropagation(); focus(id);
      const el = ref.current, host = el.parentElement;
      const W = host.clientWidth, H = host.clientHeight, l = el.offsetLeft, t = el.offsetTop;
      const sx = e.clientX, sy = e.clientY, w0 = el.offsetWidth, h0 = el.offsetHeight;
      const move = (ev) => {
        el.style.width = Math.max(240, Math.min(W - l - 4, w0 + ev.clientX - sx)) + "px";
        el.style.height = Math.max(150, Math.min(H - t - 4, h0 + ev.clientY - sy)) + "px";
      };
      const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    };
    const Icon = app.Icon;
    return (
      <div className="dkw" ref={ref} style={{ zIndex: z, display: minimized ? "none" : "flex" }} onPointerDown={() => focus(id)}>
        <div className="dkw-bar" onPointerDown={onDown}>
          <span className="dkw-ic"><Icon s={16} /></span><b>{app.title}</b>
          <span className="dkw-btns">
            <button onClick={() => min(id)} aria-label="Minimize">{I.Mark.min}</button>
            <button className="cl" onClick={() => close(id)} aria-label="Close">{I.Mark.close}</button>
          </span>
        </div>
        <div className="dkw-body">{children}</div>
        <span className="dkw-rz" onPointerDown={onRz} />
      </div>);
  }

  /* ---------------- start menu ---------------- */
  function StartMenu({ open, onClose, exit, editable }) {
    const links = (DATA.social || {});
    const item = (Icon, label, props) => <a className="dk-mi" {...props}><Icon s={18} />{label}</a>;
    return (
      <div className="dk-menu" onPointerDown={(e) => e.stopPropagation()}>
        <div className="dk-menu-head"><i>JF</i><b>{DATA.name}</b></div>
        <div className="dk-menu-cols">
          <div>
            {ORDER.concat("readme").map((k) => {
              const a = APPS.registry[k]; const Icon = a.Icon;
              return <button key={k} className="dk-mi" onClick={() => { open(k); onClose(); }}><Icon s={18} />{a.title}</button>;
            })}
          </div>
          <div>
            {item(I.Mail, "Email", { href: "mailto:" + DATA.email })}
            {links.instagram && item(I.Link, "Instagram", { href: links.instagram, target: "_blank", rel: "noreferrer" })}
            {links.spotify && item(I.Link, "Spotify", { href: links.spotify, target: "_blank", rel: "noreferrer" })}
            {links.linkedin && item(I.Link, "LinkedIn", { href: links.linkedin, target: "_blank", rel: "noreferrer" })}
            {links.phone && item(I.Link, links.phone, { href: "tel:" + links.phone.replace(/[^\d+]/g, "") })}
            {/* Owner-only reminder: these four are wired but data.js has no
                handles yet, so a visitor sees nothing rather than dead links. */}
            {editable && ["instagram", "spotify", "linkedin", "phone"].filter((k) => !links[k]).map((k) =>
              <span key={k} className="dk-mi" style={{ opacity: .45, cursor: "default" }} title={`Add ${k} to data.js`}><I.Link s={18} />{k}</span>)}
            <div className="dk-menu-sep" />
            <button className="dk-mi" onClick={exit}><I.Home s={18} />Back to portfolio</button>
          </div>
        </div>
        <div className="dk-menu-foot"><button onClick={exit}><I.Power s={18} />Shut down</button></div>
      </div>);
  }

  /* ---------------- desktop ---------------- */
  function Desktop() {
    const slots = window.useMediaSlots();
    const [booted, setBooted] = useState(() => { try { return localStorage.getItem(BOOT_KEY) === "1"; } catch (e) { return true; } });
    const [wins, setWins] = useState([]);
    const [menu, setMenu] = useState(false);
    const [sel, setSel] = useState(null);
    const [clock, setClock] = useState(() => new Date());
    const [pos, setPos] = useState(null);
    const zRef = useRef(10);
    const screenRef = useRef(null);
    const [deskH, setDeskH] = useState(0);
    useEffect(() => {
      const el = screenRef.current; if (!el) return;
      const f = () => setDeskH(el.clientHeight);
      f();
      const ro = new ResizeObserver(f); ro.observe(el);
      return () => ro.disconnect();
    }, [booted]);
    const player = window.usePlayer && window.usePlayer();
    const editable = !!writer();

    useEffect(() => { const t = setInterval(() => setClock(new Date()), 20000); return () => clearInterval(t); }, []);
    useEffect(() => {
      let on = true;
      fetch(POS_FILE).then((r) => (r.ok ? r.json() : null)).then((d) => { if (on) setPos(d || {}); }).catch(() => { if (on) setPos({}); });
      return () => { on = false; };
    }, []);

    /* wallpaper: the work stills, cycling slowly */
    const walls = useMemo(() => {
      const a = DATA.work.map((w) => window.MediaSlots.crop(slots, "still:" + w.id)).filter(Boolean);
      const b = window.MediaSlots.collectCrops(slots, "wall:", 12);
      return [...b, ...a];
    }, [slots]);
    const [wi, setWi] = useState(0);
    useEffect(() => {
      if (walls.length < 2) return;
      const t = setInterval(() => setWi((i) => (i + 1) % walls.length), 26000);
      return () => clearInterval(t);
    }, [walls.length]);

    const nextZ = () => ++zRef.current;
    const focus = useCallback((key) => { const z = nextZ(); setWins((w) => w.map((x) => x.key === key ? { ...x, z, minimized: false } : x)); }, []);
    const open = useCallback((id) => {
      let app;
      if (id.startsWith("web:")) app = APPS.webApp(PG.projects.find((p) => p.id === id.slice(4)));
      else if (id.startsWith("img:")) app = APPS.imageApp(PG.projects.find((p) => p.id === id.slice(4)));
      else app = APPS.registry[id];
      if (!app) return;
      const z = nextZ();
      setWins((w) => w.some((x) => x.key === id)
        ? w.map((x) => x.key === id ? { ...x, z, minimized: false } : x)
        : [...w, { key: id, app, z, minimized: false }]);
    }, []);
    const close = (key) => setWins((w) => w.filter((x) => x.key !== key));
    const min = (key) => setWins((w) => w.map((x) => x.key === key ? { ...x, minimized: true } : x));
    const exit = () => { location.hash = ""; };

    /* icon drag — owner only; a visitor's pointer just opens the app */
    const startDrag = (key) => (e) => {
      if (!editable) return;
      const el = e.currentTarget, host = screenRef.current;
      const W = host.clientWidth, H = host.clientHeight;
      const sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
      let moved = 0;
      el.setPointerCapture(e.pointerId);
      const move = (ev) => {
        moved += Math.abs(ev.movementX) + Math.abs(ev.movementY);
        if (moved < 5) return;
        el.classList.add("drag");
        el.style.left = Math.max(0, Math.min(W - el.offsetWidth, ox + ev.clientX - sx)) + "px";
        el.style.top = Math.max(0, Math.min(H - el.offsetHeight, oy + ev.clientY - sy)) + "px";
      };
      const up = () => {
        el.classList.remove("drag");
        el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up);
        if (moved < 5) return;
        const next = { ...(pos || {}), [key]: { x: el.offsetLeft, y: el.offsetTop } };
        setPos(next);
        const w = writer(); if (w) Promise.resolve(w(POS_FILE, JSON.stringify(next))).catch(() => {});
      };
      el.addEventListener("pointermove", move); el.addEventListener("pointerup", up);
    };

    const iconLayout = useMemo(() => {
      // Fit the column to the screen instead of a fixed 78px pitch: a short
      // window used to push the last icons under the taskbar, and visitors
      // can't drag them back out.
      const H = deskH || 700;
      const n = ORDER.length;
      const pitch = Math.max(58, Math.min(78, Math.floor((H - 16) / n)));
      const perCol = Math.max(1, Math.floor((H - 12) / pitch));
      return { pitch, perCol };
    }, [deskH]);

    const iconPos = (key, i) => {
      const p = pos && pos[key];
      if (p) return { left: p.x, top: p.y };
      const { pitch, perCol } = iconLayout;
      return { left: 10 + Math.floor(i / perCol) * 96, top: 12 + (i % perCol) * pitch };
    };

    if (!booted) return <Boot onDone={() => { try { localStorage.setItem(BOOT_KEY, "1"); } catch (e) {} setBooted(true); }} />;

    const wall = walls[wi % (walls.length || 1)];
    return (
      <div className="dk" onPointerDown={() => { setMenu(false); setSel(null); }}>
        <div className="dk-screen" ref={screenRef}>
          <div className="dk-wall">{wall ? <CroppedImg value={wall} alt="" /> : null}</div>
          {ORDER.map((key, i) => {
            const a = APPS.registry[key]; const Icon = a.Icon;
            return (
              <button key={key} className={`dk-ic ${sel === key ? "sel" : ""}`} style={iconPos(key, i)}
                onPointerDown={(e) => { e.stopPropagation(); setSel(key); startDrag(key)(e); }}
                onClick={() => open(key)} onDoubleClick={() => open(key)}>
                <Icon /><span>{a.title}</span>
              </button>);
          })}
          {wins.map((w) => (
            <Win key={w.key} id={w.key} app={w.app} z={w.z} minimized={w.minimized} focus={focus} close={close} min={min}>
              {w.app.body({ open })}
            </Win>))}
        </div>

        {menu && <StartMenu open={open} onClose={() => setMenu(false)} exit={exit} editable={editable} />}

        <div className="dk-bar" onPointerDown={(e) => e.stopPropagation()}>
          <button className="dk-start" onClick={() => setMenu((m) => !m)}><em />start</button>
          <div className="dk-tasks">
            {wins.map((w) => { const Icon = w.app.Icon; return (
              <button key={w.key} className={`dk-task ${!w.minimized ? "on" : ""}`} onClick={() => (w.minimized ? focus(w.key) : min(w.key))}>
                <Icon s={15} />{w.app.title}
              </button>); })}
            <button className="dk-back" onClick={exit}><I.Home s={15} />Back to portfolio</button>
          </div>
          <div className="dk-tray">
            <span className="name">JF</span>
            <button onClick={() => open("radio")} aria-label="Radio">{player && player.playing ? "🔊" : "🔈"}</button>
            {player && player.on && <span className="np">{player.isMix ? (player.mix && player.mix.title) : (player.playlist && player.playlist.name)}</span>}
            <span>{clock.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
          </div>
        </div>
      </div>);
  }

  window.PlaygroundApp = Desktop;
})();
