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
  const ORDER = ["font", "projects", "radio", "listening", "photos", "paint", "decks", "guestbook", "letter", "trash"];
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
      /* cascade: claim the lowest slot no other live window is sitting in,
         so two windows never land on the same pixel (even when several
         icons are opened in the same tick) */
      const taken = new Set([...host.querySelectorAll(".dkw[data-slot]")]
        .filter((x) => x !== el).map((x) => x.dataset.slot));
      let step = 0; while (step < 8 && taken.has(String(step))) step++;
      el.dataset.slot = step;
      el.style.left = Math.max(4, Math.min(W - w - 4, 120 + step * 46)) + "px";
      el.style.top = Math.max(4, Math.min(H - h - 4, 26 + step * 40)) + "px";
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
      <div className="dkw" ref={ref} style={{ zIndex: z, display: minimized ? "none" : "flex", "--wc": app.tint || "#41669a" }} onPointerDown={() => focus(id)}>
        <div className="dkw-bar" onPointerDown={onDown}>
          <span className="dkw-ic"><Icon s={16} /></span><b>{app.title}</b>
          <span className="dkw-btns">
            <button onClick={() => min(id)} aria-label="Minimize">{I.Mark.min}</button>
            <button className="cl" onClick={() => close(id)} aria-label="Close">{I.Mark.close}</button>
          </span>
        </div>
        <div className={`dkw-body ${app.bleed ? "bleed" : ""}`}>{children}</div>
        <span className="dkw-rz" onPointerDown={onRz} />
      </div>);
  }

  /* ---------------- corner player ----------------
     The radio has no window: this IS the radio. Opens centred, drags
     anywhere (position is per-visit, not saved), lists the uploaded mixes,
     and closing it leaves the music playing — the tray speaker brings it
     back. The visualizer fills the panel; clicking it cycles the six modes
     (per visit, default radial). Grain and scanline dials are owner-only
     and mirror the Tweaks panel through localStorage. */
  const KINDS = window.DESK_VIZ_KINDS || ["radial", "bars", "wave", "grid", "dancer", "stars"];
  function MiniPlayer({ shown, onClose, editable }) {
    const p = window.usePlayer && window.usePlayer();
    const ref = useRef(null);
    const [shade, setShade] = useState(false);
    /* opening the radio window shows the bottom bar right away — before, the
       bar only appeared once you hit play */
    useEffect(() => { if (shown && p && p.armRadio) p.armRadio(); }, [shown, p && p.armRadio]);
    const [list, setList] = useState(false);
    const [gear, setGear] = useState(false);
    const [kind, setKind] = useState("radial");
    const num = (k, d) => { try { const v = parseFloat(localStorage.getItem("jf-pv-" + k)); return isFinite(v) ? v : d; } catch (e) { return d; } };
    const [grain, setGrain] = useState(() => num("vizGrain", 0.2));
    const [scan, setScan] = useState(() => num("vizScan", 0.2));
    useEffect(() => {
      const f = () => { setGrain(num("vizGrain", 0.2)); setScan(num("vizScan", 0.2)); };
      window.addEventListener("jf-tweak", f);
      const t2 = setInterval(f, 1200);   /* the Tweaks panel writes the same keys */
      return () => { window.removeEventListener("jf-tweak", f); clearInterval(t2); };
    }, []);
    useEffect(() => {
      if (!shown) return;
      const el = ref.current, host = el && el.parentElement; if (!host) return;
      el.style.left = Math.max(6, Math.round((host.clientWidth - el.offsetWidth) / 2)) + "px";
      el.style.top = Math.max(6, Math.round((host.clientHeight - el.offsetHeight) / 2)) + "px";
    }, [shown]);
    if (!p || !shown) return null;
    const title = p.isMix ? (p.mix ? p.mix.title : "My Mixes") : (p.playlist ? p.playlist.name : "nothing loaded");
    const fmt = (s) => (!isFinite(s) || s < 0 ? "0:00" : Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0"));
    const onDown = (e) => {
      if (e.target.closest("input,button,.dkm-stage")) return;
      const el = ref.current, host = el.parentElement;
      const W = host.clientWidth, H = host.clientHeight;
      const sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
      el.classList.add("grab");
      const move = (ev) => {
        el.style.left = Math.max(0, Math.min(Math.max(0, W - el.offsetWidth), ox + ev.clientX - sx)) + "px";
        el.style.top = Math.max(0, Math.min(Math.max(0, H - el.offsetHeight), oy + ev.clientY - sy)) + "px";
      };
      const up = () => { el.classList.remove("grab"); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    };
    const pick = (i) => { p.openMixes(); p.toMix(i); setList(false); };
    const cycle = (e) => {
      if (e.target.closest(".dkm-ctl,.dkm-list,.dkm-gear")) return;
      const next = KINDS[(KINDS.indexOf(kind) + 1) % KINDS.length];
      setKind(next);
      window.VizKind && window.VizKind.set(next);   /* the taskbar thumbnail follows */
    };
    const setDial = (key, v) => {
      const s = String(v);
      try { localStorage.setItem("jf-pv-" + key, s); } catch (e2) {}
      window.dispatchEvent(new Event("jf-tweak"));
      if (key === "vizGrain") setGrain(v); else setScan(v);
    };
    return (
      <div className={`dk-mini ${shade ? "shade" : ""}`} ref={ref} style={{ "--vc": p.accent }} onPointerDown={(e) => e.stopPropagation()}>
        <div className="dkm-bar" onPointerDown={onDown}>
          <span className="dkm-grip" /><b>radio</b>
          <span className="dkm-btns">
            {editable && <button onClick={() => setGear((v) => !v)} title="Visualizer grain">⚙</button>}
            <button onClick={() => setList((v) => !v)} title="Mixes">☰</button>
            <button onClick={() => setShade((s) => !s)} title={shade ? "Unshade" : "Shade"}>{shade ? "▾" : "▴"}</button>
            <button className="x" onClick={onClose} title="Close">✕</button>
          </span>
        </div>
        <div className="dkm-body">
          <div className="dkm-stage" onClick={cycle} title="Click to change the visualizer">
            <window.DeskViz kind={kind} grain={grain} scan={scan} real={p.isMix && p.playing} analyser={p.analyser} />
            <div className="dkm-scrim" />
            <div className="dkm-kind">{kind}</div>
            {gear &&
              <div className="dkm-gear" onClick={(e) => e.stopPropagation()}>
                <label>grain <b>{Math.round(grain * 100)}%</b>
                  <input type="range" min={0} max={0.6} step={0.02} value={grain} onChange={(e) => setDial("vizGrain", +e.target.value)} /></label>
                <label>scanlines <b>{Math.round(scan * 100)}%</b>
                  <input type="range" min={0} max={0.6} step={0.02} value={scan} onChange={(e) => setDial("vizScan", +e.target.value)} /></label>
              </div>}
            <div className="dkm-ctl">
              <div className="dkm-lcd">
                <span className="dkm-track"><span className="dkm-scroll"><em>{title}</em><em>{title}</em></span></span>
                <small>{fmt(p.time)} / {fmt(p.dur)}</small>
              </div>
              <input className="dkm-seek" type="range" min={0} max={Math.max(1, p.dur || 1)} step={0.1}
                value={Math.min(p.time || 0, p.dur || 1)} disabled={!p.isMix}
                style={{ "--pct": (p.dur ? (p.time / p.dur) * 100 : 0) + "%" }}
                onChange={(e) => p.seek(+e.target.value)} aria-label="Seek" />
              <div className="dkm-row">
                <button className="dkm-t" onClick={p.prev} title="Previous">◂◂</button>
                <button className="dkm-t" onClick={() => (p.on ? p.togglePlay() : p.openMixes())} title={p.playing ? "Pause" : "Play"}>{p.playing ? "❚❚" : "▸"}</button>
                <button className="dkm-t" onClick={p.next} title="Next">▸▸</button>
                <input className="dkm-vol" type="range" min={0} max={1} step={0.02} value={p.volume}
                  onChange={(e) => p.changeVolume(+e.target.value)} aria-label="Volume" />
              </div>
              {list &&
                <div className="dkm-list">
                  {(p.mixes || []).map((m, i) =>
                    <button key={m.id} className={p.isMix && p.mixIdx === i ? "on" : ""} onClick={() => pick(i)}>{m.title}</button>)}
                </div>}
            </div>
          </div>
        </div>
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
    const [mini, setMini] = useState(false);
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
    /* two layers so each change is a 5s dissolve, not a cut: the outgoing
       still fades down while the incoming fades up. Fresh keys each tick so
       the CSS animations restart. */
    const [wp, setWp] = useState({ cur: 0, prev: null, k: 0 });
    useEffect(() => {
      if (walls.length < 2) return;
      const t = setInterval(() => setWp((s) => ({ cur: (s.cur + 1) % walls.length, prev: s.cur, k: s.k + 1 })), 26000);
      return () => clearInterval(t);
    }, [walls.length]);

    const nextZ = () => ++zRef.current;
    const focus = useCallback((key) => { const z = nextZ(); setWins((w) => w.map((x) => x.key === key ? { ...x, z, minimized: false } : x)); }, []);
    const open = useCallback((id) => {
      if (id === "radio") { setMini(true); return; }   /* the radio is the corner player now */
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

    /* Icons are locked: the arrangement is the ORDER grid, same for Jacob and
       for visitors. Reordering is a code change now, on request. */

    const iconLayout = useMemo(() => {
      // Fit the column to the screen instead of a fixed 78px pitch: a short
      // window used to push the last icons under the taskbar, and visitors
      // can't drag them back out.
      const H = deskH || 700;
      const n = ORDER.length;
      /* 82px icon box + 10px of air: the slot is always taller than the
         selection highlight, so nothing overlaps. Short screens wrap into
         another column instead of tightening the pitch. */
      const pitch = 92;
      const perCol = Math.max(1, Math.floor((H - 12) / pitch));
      return { pitch, perCol };
    }, [deskH]);

    const iconPos = (key, i) => {
      const { pitch, perCol } = iconLayout;
      return { left: 10 + Math.floor(i / perCol) * 96, top: 12 + (i % perCol) * pitch };
    };

    if (!booted) return <Boot onDone={() => { try { localStorage.setItem(BOOT_KEY, "1"); } catch (e) {} setBooted(true); }} />;

    const n = walls.length || 1;
    const wall = walls[wp.cur % n];
    const wallPrev = wp.prev == null ? null : walls[wp.prev % n];
    return (
      <div className="dk" onPointerDown={() => { setMenu(false); setSel(null); }}>
        <div className="dk-screen" ref={screenRef}>
          <div className="dk-wall">
            {wallPrev ? <div className="dk-wl out" key={"p" + wp.k}><CroppedImg value={wallPrev} alt="" /></div> : null}
            {wall ? <div className={`dk-wl ${wp.prev == null ? "" : "in"}`} key={"c" + wp.k}><CroppedImg value={wall} alt="" /></div> : null}
          </div>
          {ORDER.map((key, i) => {
            const a = APPS.registry[key]; const Icon = a.Icon;
            return (
              <button key={key} className={`dk-ic ${sel === key ? "sel" : ""}`} style={iconPos(key, i)}
                onPointerDown={(e) => { e.stopPropagation(); setSel(key); }}
                onClick={() => open(key)} onDoubleClick={() => open(key)}>
                <Icon /><span>{a.title}</span>
              </button>);
          })}
          {wins.map((w) => (
            <Win key={w.key} id={w.key} app={w.app} z={w.z} minimized={w.minimized} focus={focus} close={close} min={min}>
              {w.app.body({ open })}
            </Win>))}
          <MiniPlayer shown={mini} onClose={() => setMini(false)} editable={editable} />
        </div>

        {menu && <StartMenu open={open} onClose={() => setMenu(false)} exit={exit} editable={editable} />}

        <div className="dk-bar" onPointerDown={(e) => e.stopPropagation()}>
          <button className="dk-start" onClick={() => setMenu((m) => !m)}><em />start</button>
          <div className="dk-tasks">
            {wins.map((w) => { const Icon = w.app.Icon; return (
              <button key={w.key} className={`dk-task ${!w.minimized ? "on" : ""}`} onClick={() => (w.minimized ? focus(w.key) : min(w.key))}>
                <Icon s={15} /><span>{w.app.title}</span>
              </button>); })}
            <button className="dk-back" onClick={exit}><I.Home s={15} />Back to portfolio</button>
          </div>
          <div className="dk-tray">
            <span className="name">JF</span>
            <button onClick={() => setMini(true)} aria-label="Radio">{player && player.playing ? "🔊" : "🔈"}</button>
            {player && player.on && <span className="np">{player.isMix ? (player.mix && player.mix.title) : (player.playlist && player.playlist.name)}</span>}
            <span>{clock.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
          </div>
        </div>
      </div>);
  }

  window.PlaygroundApp = Desktop;
})();
