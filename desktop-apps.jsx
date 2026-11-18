/* =========================================================================
   desktop-apps.jsx — the windows that open on the desktop.
   Each app is a plain component; the shell (desktop.jsx) owns the frame,
   dragging, z-order and the taskbar. Exported as window.DeskApps.
   ========================================================================= */
(function () {
  const { useState, useEffect, useRef, useMemo } = React;
  const DATA = window.PORTFOLIO_DATA;
  const PG = DATA.playground;
  const I = window.DeskIcons;
  const CroppedImg = window.CroppedImg;

  /* A full-size photo is shown at native pixel size, so it can overflow its
     window in either axis. Drag to pan (the container also scrolls). */
  function panPhoto(e, onTap) {
    const el = e.currentTarget, box = el.closest(".dk-lb");
    if (!box) return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, sl = box.scrollLeft, st = box.scrollTop;
    let moved = 0;
    el.classList.add("panning");
    const move = (ev) => {
      moved += Math.abs(ev.movementX) + Math.abs(ev.movementY);
      box.scrollLeft = sl - (ev.clientX - sx);box.scrollTop = st - (ev.clientY - sy);
    };
    const up = () => {
      el.classList.remove("panning");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      // a click that did not drag still dismisses, the way it always has
      if (moved < 5 && typeof onTap === "function") onTap();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }
  const srcOf = (v) => typeof v === "string" ? v : v && (v.u || v.url || v.src);

  /* ---- Folders: Design / Websites hold PG.projects by their `folder`.
     An image item counts once it has a picture (Media Manager slot
     "proj:<id>", or a src not marked pending); a web item once it has a URL.
     Empty folders stay off the desktop. ---- */
  const projImg = (slots, p) => slots["proj:" + p.id] || (!p.pending && p.src) || null;
  const filled = (slots, p) => p.kind === "web" ? !!p.src : !!projImg(slots, p);
  const folderItems = (slots, f) => (PG.projects || []).filter((p) => p.folder === f && filled(slots, p));
  function FolderApp({ open, folder }) {
    const slots = window.useMediaSlots();
    const items = folderItems(slots, folder);
    if (!items.length) return <div className="dk-empty">This folder is empty.</div>;
    return (
      <div className="dk-files">
        {items.map((p) =>
          <button key={p.id} className="dk-file" data-krinky={"proj:" + p.id} onClick={() => open(p.kind === "web" ? "web:" + p.id : "img:" + p.id)}>
            {p.icon ? <svg viewBox="0 0 48 48" width={38} height={38} aria-hidden="true"><image href={p.icon} x="0" y="0" width="48" height="48" /></svg> : p.kind === "web" ? <I.Web s={38} /> : <I.Img s={38} />}<span>{p.title}</span>
          </button>)}
      </div>);
  }

  /* A live site in a window. Some sites refuse to be framed and come up
     blank — Jacob chose live-only for now, so this says so plainly rather
     than pretending the window is still loading. */
  function WebApp({ project }) {
    return (
      <div className="dk-pane">
        <div className="dk-url"><span>🌐</span><input readOnly value={project.src} /><a href={project.src} target="_blank" rel="noreferrer">Go</a></div>
        <iframe className="dk-frame" src={project.src} title={project.title} loading="lazy"></iframe>
        <div className="dk-webnote">Blank? Some sites block being shown inside another page — use Go.</div>
      </div>);
  }
  const lk = (t) => (window.linkify ? window.linkify(t) : t);
  /* In-window photo viewer shared by Photos, Decks and the Design folder.
     Arrows, ←/→ keys and a sideways swipe step through `items`. `native`
     keeps the true-pixel pan view on mouse; touch always fits the photo. */
  /* Trackpad swipe: a two-finger sideways swipe arrives as horizontal wheel
     deltas. Collect them and step once per gesture. Non-passive so the
     browser doesn't treat it as back/forward navigation. */
  function useWheelSwipe(ref, onStep, on = true) {
    const cb = useRef(onStep); cb.current = onStep;
    useEffect(() => {
      const el = ref.current; if (!el || !on) return;
      let acc = 0, lock = 0, idle = 0;
      const wh = (e) => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        e.preventDefault();
        clearTimeout(idle); idle = setTimeout(() => { acc = 0; }, 180);
        if (Date.now() < lock) return;
        acc += e.deltaX;
        if (Math.abs(acc) > 50) { cb.current(acc > 0 ? 1 : -1); acc = 0; lock = Date.now() + 420; }
      };
      el.addEventListener("wheel", wh, { passive: false });
      return () => { el.removeEventListener("wheel", wh); clearTimeout(idle); };
    }, [on]);
  }
  const coarse = () => !!(window.matchMedia && window.matchMedia("(pointer:coarse)").matches);
  /* Photo viewer window: size the window to the photo (no upscale), capped at
     80% of the desktop, keeping the window's centre (centred on first open). */
  function fitWin(im) {
    const win = im.closest(".dkw"), body = win && win.querySelector(".dkw-body"), host = win && win.parentElement;
    if (!host || !im.naturalWidth) return;
    const W = host.clientWidth, H = host.clientHeight;
    const cx = win.offsetWidth - body.clientWidth, cy = win.offsetHeight - body.clientHeight, px = 16, py = 60;
    const s = Math.min(1, (W * 0.8 - cx - px) / im.naturalWidth, (H * 0.8 - cy - py) / im.naturalHeight);
    const w = Math.max(300, Math.round(im.naturalWidth * s) + cx + px), h = Math.max(240, Math.round(im.naturalHeight * s) + cy + py);
    const mx = win.dataset.pvc ? win.offsetLeft + win.offsetWidth / 2 : W / 2, my = win.dataset.pvc ? win.offsetTop + win.offsetHeight / 2 : H / 2;
    win.dataset.pvc = "1";
    Object.assign(win.style, { width: w + "px", height: h + "px",
      left: Math.max(0, Math.min(W - w, Math.round(mx - w / 2))) + "px", top: Math.max(0, Math.min(H - h, Math.round(my - h / 2))) + "px" });
  }
  function DkViewer({ items, start, onClose, native, windowed, onIndex }) {
    const n = items.length;
    const [i, setI] = useState(start || 0);
    useEffect(() => { onIndex && onIndex(i); }, [i]);
    const fit = windowed || !native || coarse();
    const box = useRef(null), img = useRef(null);
    /* zoom: z = scale, x/y = pan offset from centre (px). Up to the photo's
       full resolution (at least 1.5x). */
    const [zv, setZv] = useState({ z: 1, x: 0, y: 0 });
    const zr = useRef(zv); zr.current = zv;
    const maxZ = () => { const el = img.current; if (!el || !el.offsetWidth) return 3; return Math.max(1.5, (el.naturalWidth || 0) / el.offsetWidth); };
    const clamp = (z, x, y) => {
      const el = img.current, bx = box.current; if (!el || !bx) return { z, x: 0, y: 0 };
      const mx = Math.max(0, (el.offsetWidth * z - bx.clientWidth) / 2), my = Math.max(0, (el.offsetHeight * z - bx.clientHeight) / 2);
      return { z, x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) };
    };
    const zoomAt = (z2, cx, cy) => {
      const bx = box.current, c = zr.current; if (!bx) return;
      z2 = Math.max(1, Math.min(maxZ(), z2));
      const r = bx.getBoundingClientRect();
      const px = cx == null ? 0 : cx - (r.left + r.width / 2), py = cy == null ? 0 : cy - (r.top + r.height / 2);
      const k = z2 / c.z;
      setZv(z2 === 1 ? { z: 1, x: 0, y: 0 } : clamp(z2, px - (px - c.x) * k, py - (py - c.y) * k));
    };
    const go = (d) => { setZv({ z: 1, x: 0, y: 0 }); setI((k) => (k + d + n) % n); };
    useEffect(() => {
      const onKey = (e) => {
        if (e.key === "Escape") onClose();
        else if (n > 1 && e.key === "ArrowRight" && zr.current.z === 1) { e.preventDefault(); go(1); }
        else if (n > 1 && e.key === "ArrowLeft" && zr.current.z === 1) { e.preventDefault(); go(-1); }
        else if (fit && (e.key === "+" || e.key === "=")) zoomAt(zr.current.z * 1.5);
        else if (fit && e.key === "-") zoomAt(zr.current.z / 1.5);
        else if (fit && e.key === "0") zoomAt(1);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [n, onClose]);
    /* wheel: pinch (ctrl+wheel) or vertical scroll zooms at the cursor;
       sideways swipe steps photos when not zoomed, pans when zoomed */
    useEffect(() => {
      const el = box.current; if (!el || !fit) return;
      let acc = 0, lock = 0, idle = 0;
      const wh = (e) => {
        e.preventDefault();
        const c = zr.current, sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY);
        if (!e.ctrlKey && sideways) {
          if (c.z > 1) { setZv(clamp(c.z, c.x - e.deltaX, c.y - e.deltaY)); return; }
          if (n < 2) return;
          clearTimeout(idle); idle = setTimeout(() => { acc = 0; }, 180);
          if (Date.now() < lock) return;
          acc += e.deltaX;
          if (Math.abs(acc) > 50) { go(acc > 0 ? 1 : -1); acc = 0; lock = Date.now() + 420; }
          return;
        }
        const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002));
        zoomAt(c.z * f, e.clientX, e.clientY);
      };
      el.addEventListener("wheel", wh, { passive: false });
      return () => { el.removeEventListener("wheel", wh); clearTimeout(idle); };
    }, [fit, n, i]);
    /* pointers: 1 finger/mouse = pan when zoomed, swipe when not;
       2 fingers = pinch; quick double tap/click toggles zoom */
    const pts = useRef(new Map()), g = useRef(null), lastTap = useRef({ t: 0, x: 0, y: 0 }), moved = useRef(false);
    const pDown = (e) => {
      if (!fit) return;
      if (e.target.closest && e.target.closest("button")) return;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
      pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const c = zr.current, p = [...pts.current.values()];
      if (p.length === 2) g.current = { pinch: true, d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), z: c.z, mx: (p[0].x + p[1].x) / 2, my: (p[0].y + p[1].y) / 2 };
      else { g.current = { sx: e.clientX, sy: e.clientY, x: c.x, y: c.y }; moved.current = false; }
    };
    const pMove = (e) => {
      if (!pts.current.has(e.pointerId)) return;
      pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const s0 = g.current; if (!s0) return;
      const p = [...pts.current.values()];
      if (s0.pinch && p.length === 2) {
        const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        moved.current = true;
        zoomAt(s0.z * d / s0.d, (p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2);
        return;
      }
      const dx = e.clientX - s0.sx, dy = e.clientY - s0.sy;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved.current = true;
      if (zr.current.z > 1) setZv(clamp(zr.current.z, s0.x + dx, s0.y + dy));
    };
    const pUp = (e) => {
      if (!pts.current.has(e.pointerId)) return;
      pts.current.delete(e.pointerId);
      const s0 = g.current;
      if (pts.current.size) { const q = [...pts.current.values()][0]; g.current = { sx: q.x, sy: q.y, x: zr.current.x, y: zr.current.y }; return; }
      g.current = null;
      if (!s0 || s0.pinch) return;
      const dx = e.clientX - s0.sx, dy = e.clientY - s0.sy;
      if (zr.current.z === 1 && n > 1 && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) { go(dx < 0 ? 1 : -1); return; }
      if (moved.current) return;
      const now = Date.now(), lt = lastTap.current;
      if (now - lt.t < 320 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 30) {
        lastTap.current = { t: 0, x: 0, y: 0 };
        clearTimeout(lt.timer);
        zoomAt(zr.current.z > 1 ? 1 : Math.min(2.5, maxZ()), e.clientX, e.clientY);
        return;
      }
      const ir = img.current && img.current.getBoundingClientRect();
      const onBackdrop = !ir || e.clientX < ir.left || e.clientX > ir.right || e.clientY < ir.top || e.clientY > ir.bottom;
      lastTap.current = { t: now, x: e.clientX, y: e.clientY, timer: !windowed && onBackdrop && zr.current.z === 1 ? setTimeout(onClose, 330) : 0 };
    };
    const v = items[i];
    const zoomed = zv.z > 1.001;
    return (<>
      {fit
        ? <div ref={box} className={`dk-lb dk-lb-fit ${windowed ? "dk-lb-win" : ""} ${zoomed ? "is-zoomed" : ""}`} onPointerDown={pDown} onPointerMove={pMove} onPointerUp={pUp} onPointerCancel={pUp}>
            <img key={i} ref={img} className="dk-fitimg" src={srcOf(v)} alt="" draggable={false} onLoad={windowed ? (e) => fitWin(e.currentTarget) : undefined}
              style={{ transform: `translate(${zv.x}px,${zv.y}px) scale(${zv.z})`, transition: g.current ? "none" : undefined }} />
          </div>
        : <div className="dk-lb" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <img key={i} className="dk-native" src={srcOf(v)} alt="" draggable={false} onPointerDown={(e) => panPhoto(e, onClose)} />
          </div>}
      {!windowed && <button className="dk-lb-x" onClick={onClose} aria-label="Close">✕</button>}
      <div className="dk-lb-nav">
        {n > 1 && <>
          <button onClick={() => go(-1)} aria-label="Previous photo">‹</button>
          {!windowed && <span>{i + 1} / {n}</span>}
          <button onClick={() => go(1)} aria-label="Next photo">›</button>
        </>}
        {fit && <span className="dk-lb-zoom">
          <button onClick={() => zoomAt(zv.z / 1.5)} disabled={!zoomed} aria-label="Zoom out">−</button>
          <button onClick={() => zoomAt(zv.z * 1.5)} aria-label="Zoom in">+</button>
        </span>}
      </div>
    </>);
  }

  /* Cycling strip: the front photo is full size, neighbours shrink and fade
     as they move off. Drag/swipe follows the finger; tap opens the viewer. */
  function Cycle({ items, onOpen, paused }) {
    const n = items.length;
    const [cur, setCur] = useState(0);
    const [drag, setDrag] = useState(0);
    const [live, setLive] = useState(false);
    const stage = useRef(null), st = useRef(null), last = useRef({});
    const step = () => (stage.current ? stage.current.clientWidth * 0.3 : 110);
    const go = (d) => setCur((k) => (k + d + n) % n);
    useWheelSwipe(stage, go, n > 1);
    const offs = items.map((_, i) => { let o = ((i - cur) % n + n) % n; if (o > n / 2) o -= n; return o; });
    useEffect(() => { offs.forEach((o, i) => { last.current[i] = o; }); });
    useEffect(() => {
      if (paused) return;
      const onKey = (e) => {
        const w = stage.current && stage.current.closest(".dkw"); if (!w) return;
        const top = Math.max(...[...document.querySelectorAll(".dkw")].filter((x) => x.style.display !== "none").map((x) => +x.style.zIndex || 0));
        if ((+w.style.zIndex || 0) < top || /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName)) return;
        if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [paused, n]);
    const down = (e) => { st.current = { x: e.clientX, moved: 0 }; setLive(true); try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {} };
    const move = (e) => { const s = st.current; if (!s) return; const dx = e.clientX - s.x; s.moved = Math.max(s.moved, Math.abs(dx)); setDrag(dx); };
    const up = (e) => {
      const s = st.current; st.current = null; setLive(false);
      const dx = drag; setDrag(0);
      if (!s) return;
      if (s.moved < 6) {
        const el = document.elementFromPoint(e.clientX, e.clientY), b = el && el.closest("[data-ci]");
        if (b) onOpen(+b.dataset.ci);
        return;
      }
      const k = Math.round(-dx / step());
      if (k) go(k); else if (Math.abs(dx) > 30) go(dx < 0 ? 1 : -1);
    };
    const sp = step();
    return (
      <div className="dk-cyc">
        <div className={`dk-cyc-stage ${live ? "is-drag" : ""}`} ref={stage} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          {items.map((ph, i) => {
            const p = offs[i] + drag / sp, a = Math.min(1, Math.abs(p));
            const jump = last.current[i] != null && Math.abs(last.current[i] - offs[i]) > 1;
            return (<div key={i} data-ci={i} className={`dk-cyc-it ${/\.png(\?|$)/i.test(srcOf(ph) || "") ? "is-art" : ""}`} aria-hidden={offs[i] !== 0}
              style={{ transform: `translate(-50%,-50%) translateX(${p * 96}%) scale(${1 - 0.3 * a})`, opacity: Math.abs(p) > 1.4 ? 0 : 1 - 0.45 * a,
                zIndex: 10 - Math.round(Math.abs(p) * 2), transition: live || jump ? "none" : undefined }}>
              <CroppedImg value={ph} alt="" />
            </div>);
          })}
        </div>
        {n > 1 && <div className="dk-cyc-nav">
          <button onClick={() => go(-1)} aria-label="Previous photo">‹</button>
          <span>{cur + 1} / {n}</span>
          <button onClick={() => go(1)} aria-label="Next photo">›</button>
        </div>}
      </div>);
  }

  /* A design piece: the work on the left, its label and gallery on the right.
     Stacks on narrow windows. */
  function ImageApp({ project }) {
    const slots = window.useMediaSlots();
    const v = projImg(slots, project);
    const gal = (project.gallery || []).map((g, k) => slots["proj:" + project.id + ":g" + k] || g).filter(Boolean);
    const [view, setView] = useState(null);
    const close = React.useCallback(() => setView(null), []);
    const all = [v, ...gal].filter(Boolean);
    const paras = String(project.desc || project.note || "").split(/\n\s*\n/).filter(Boolean);
    /* Reading past ~93% of the text starts handing space to the gallery,
       tied to the scroll; the text shrinks to a 3-line faded preview of its
       end. Any scroll up over the right side gives the space back. Lets go
       mid-way settle to whichever end is closer. */
    const workRef = useRef(null), sideRef = useRef(null), textRef = useRef(null), gRef = useRef(0);
    useEffect(() => {
      const work = workRef.current, side = sideRef.current, text = textRef.current;
      if (!work || !side || !text || !gal.length) return;
      let idle = 0, raf = 0, pinUntil = 0;
      const narrow = () => work.clientWidth <= 600;
      const pin = () => {
        if (gRef.current > 0) { text.scrollTop = text.scrollHeight; if (narrow()) work.scrollTop = work.scrollHeight; }
        if (Date.now() < pinUntil) raf = requestAnimationFrame(pin); else raf = 0;
      };
      const apply = (v, live) => {
        v = Math.max(0, Math.min(1, v));
        if (v > 0 && gRef.current === 0) work.style.setProperty("--tfull", text.scrollHeight + "px");
        gRef.current = v;
        work.style.setProperty("--g", v.toFixed(3));
        work.classList.toggle("is-live", !!live);
        work.classList.toggle("is-grown", v > 0);
        pinUntil = Date.now() + (live ? 80 : 700);
        if (!raf) raf = requestAnimationFrame(pin);
      };
      const nearEnd = () => {
        const sc = narrow() ? work : text, max = sc.scrollHeight - sc.clientHeight;
        return max <= 2 || sc.scrollTop >= max * 0.93 - 1;
      };
      const feed = (dy, e) => {
        const g = gRef.current;
        if (dy > 0 && g < 1 && (g > 0 || nearEnd())) apply(g + dy / 360, true);
        else if (dy < 0 && g > 0) apply(g + dy / 360, true);
        else if (dy > 0 && g >= 1) { /* fully grown: nothing further to scroll */ }
        else return;
        if (e.cancelable) e.preventDefault();
        clearTimeout(idle);
        idle = setTimeout(() => apply(gRef.current > 0.5 ? 1 : 0, false), 240);
      };
      const wh = (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; feed(e.deltaY, e); };
      let tp = null;
      const ts = (e) => { const t = e.touches[0]; tp = { x: t.clientX, y: t.clientY, dir: 0 }; };
      const tm = (e) => {
        if (!tp) return; const t = e.touches[0];
        const dx = t.clientX - tp.x, dy = tp.y - t.clientY;
        if (!tp.dir) { if (Math.abs(dx) + Math.abs(dy) < 6) return; tp.dir = Math.abs(dy) > Math.abs(dx) ? 1 : 2; }
        if (tp.dir !== 1) return;
        tp.x = t.clientX; tp.y = t.clientY;
        feed(dy * 1.5, e);
      };
      const te = () => { tp = null; };
      const host = work;
      const onW = (e) => { if (narrow() || side.contains(e.target)) wh(e); };
      const onTM = (e) => { if (narrow() || side.contains(e.target)) tm(e); };
      host.addEventListener("wheel", onW, { passive: false });
      host.addEventListener("touchstart", ts, { passive: true });
      host.addEventListener("touchmove", onTM, { passive: false });
      host.addEventListener("touchend", te);
      return () => {
        host.removeEventListener("wheel", onW); host.removeEventListener("touchstart", ts);
        host.removeEventListener("touchmove", onTM); host.removeEventListener("touchend", te);
        clearTimeout(idle); cancelAnimationFrame(raf);
      };
    }, [gal.length]);
    return (
      <div className="dk-workwrap">
        <div className="dk-work" ref={workRef}>
          <button className="dk-work-art" onClick={() => v && setView(0)} aria-label={"View " + project.title + " larger"}>
            {v ? <CroppedImg value={v} alt={project.title} /> : null}
          </button>
          <div className="dk-work-side" ref={sideRef}>
            <div className="dk-work-text" ref={textRef}>
              <h3 className="dk-work-t">{project.title}</h3>
              {paras.map((p, k) => <p key={k}>{lk(p)}</p>)}
            </div>
            {gal.length > 0 && <Cycle items={gal} paused={view != null} onOpen={(k) => setView(k + (v ? 1 : 0))} />}
          </div>
        </div>
        {view != null && <DkViewer items={all} start={view} onClose={close} />}
      </div>);
  }

  /* ---- What I'm listening to: just the list. Clicking a playlist used to
     hand it to the site player, which pulled the visitor into the radio;
     now each row is a plain link out to Spotify/Apple. ---- */
  const outLink = (pl) => pl.page || (pl.embed || "")
    .replace("embed.music.apple.com", "music.apple.com")
    .replace("open.spotify.com/embed/", "open.spotify.com/");
  function ListeningApp() {
    const lists = (PG.radio || []);
    const wrap = useRef(null);
    /* Only one source of audio at a time. We can't reach inside the Spotify /
       Apple players, but clicking into one steals focus from the page — that
       blur is our signal. When it fires we bump every other embed's key, which
       remounts it, which stops whatever it was playing. */
    const [nonce, setNonce] = useState(() => lists.map(() => 0));
    useEffect(() => {
      let lastIdx = -1;
      /* Focus is the only signal a sealed player gives us, and the blur event
         alone missed cases, so we also poll it. */
      const check = () => {
        const el = document.activeElement;
        if (!el || el.tagName !== "IFRAME" || !wrap.current || !wrap.current.contains(el)) return;
        const i = +el.dataset.idx;
        if (i === lastIdx) return;
        lastIdx = i;
        setNonce((n) => n.map((v, k) => (k === i ? v : v + 1)));
      };
      const onBlur = () => setTimeout(check, 0);
      window.addEventListener("blur", onBlur);
      const t = setInterval(check, 500);
      return () => { window.removeEventListener("blur", onBlur); clearInterval(t); };
    }, []);
    if (!lists.length) return <p>No playlists yet.</p>;
    return (
      <div className="dk-pls" ref={wrap}>
        {lists.map((pl, i) =>
          <div className="dk-pl" key={pl.name + i}>
            <div className="dk-pl-name" data-krinky={"radio:" + i}>{pl.name}</div>
            {pl.embed &&
            <div className="dk-embed">
              <iframe key={nonce[i]} data-idx={i} src={pl.embed} allow="autoplay *; encrypted-media *;" loading="lazy" title={pl.name}></iframe>
            </div>}
          </div>)}
      </div>);
  }

  /* ---- Photos: the album slots, unchanged storage ---- */
  function PhotosApp() {
    const slots = window.useMediaSlots();
    const cats = useMemo(() => {
      const names = PG.galleryCategoryNames || PG.albumNames || [];
      return [0, 1, 2, 3].map((a) => ({ a, name: names[a] || "album " + (a + 1), photos: window.MediaSlots.collectCrops(slots, "alb:" + a + ":", 10) }));
    }, [slots]);
    const [tab, setTab] = useState(0);
    const view = (c, i) => window.dispatchEvent(new CustomEvent("jf-photo-view", { detail: { items: c.photos, start: i, album: c.name } }));
    const live = cats.filter((c) => c.photos.length);
    if (!live.length) return <p>No photos uploaded yet.</p>;
    const cur = live[Math.min(tab, live.length - 1)];
    return (
      <div className="dk-fill">
        <div className="dk-tabs">{live.map((c, i) => <button key={c.a} className={`dk-tab ${cur === c ? "on" : ""}`} data-krinky={"album:" + c.a} onClick={() => setTab(i)}>{c.name}</button>)}</div>
        <div className="dk-shots">{cur.photos.map((ph, i) => <button key={i} onClick={() => view(cur, i)}><CroppedImg value={ph} alt="" /></button>)}</div>
      </div>);
  }

  /* ---- Paint: a real canvas; Save downloads the drawing ---- */
  const PAINT_COLORS = ["#000000", "#ffffff", "#c9440f", "#f0c31e", "#3aa64a", "#2f7fd1", "#7d3f9c", "#8a5c07"];
  function PaintApp() {
    const cv = useRef(null), draw = useRef(false), last = useRef(null);
    const [color, setColor] = useState("#000000");
    const [size, setSize] = useState(4);
    const [erase, setErase] = useState(false);
    useEffect(() => {
      const c = cv.current; if (!c) return;
      const fit = () => {
        const r = c.getBoundingClientRect();
        const keep = c.width && c.height ? c.getContext("2d").getImageData(0, 0, c.width, c.height) : null;
        c.width = Math.max(200, Math.round(r.width)); c.height = Math.max(150, Math.round(r.height));
        const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
        if (keep) x.putImageData(keep, 0, 0);
      };
      fit();
      const ro = new ResizeObserver(fit); ro.observe(c);
      return () => ro.disconnect();
    }, []);
    const pt = (e) => { const r = cv.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const down = (e) => { e.preventDefault(); cv.current.setPointerCapture(e.pointerId); draw.current = true; last.current = pt(e); };
    const move = (e) => {
      if (!draw.current) return;
      const x = cv.current.getContext("2d"), p = pt(e);
      x.strokeStyle = erase ? "#ffffff" : color; x.lineWidth = erase ? size * 3 : size; x.lineCap = "round"; x.lineJoin = "round";
      x.beginPath(); x.moveTo(last.current.x, last.current.y); x.lineTo(p.x, p.y); x.stroke();
      last.current = p;
    };
    const up = () => { draw.current = false; };
    const clear = () => { const c = cv.current, x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); };
    const save = () => { const a = document.createElement("a"); a.href = cv.current.toDataURL("image/png"); a.download = "drawing.png"; a.click(); };
    return (
      <div className="dk-pane">
        <div className="dk-paint-tools">
          {PAINT_COLORS.map((c) => <button key={c} className={`dk-sw ${!erase && color === c ? "on" : ""}`} style={{ background: c }} onClick={() => { setColor(c); setErase(false); }} aria-label={c} />)}
          <input type="range" min="1" max="24" value={size} onChange={(e) => setSize(+e.target.value)} aria-label="Brush size" />
          <button className="dk-btn" onClick={() => setErase(!erase)}>{erase ? "Erasing" : "Eraser"}</button>
          <button className="dk-btn" onClick={clear}>Clear</button>
          <button className="dk-btn" onClick={save}>Save</button>
        </div>
        <canvas ref={cv} className="dk-canvas" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}></canvas>
      </div>);
  }

  /* ---- Pitch decks ---- */
  /* Each deck opens its cover image (Media Manager slot "deck:<id>:cover",
     or `cover` in data.js). No cover yet → the row just reads "cover soon". */
  function DecksApp() {
    const slots = window.useMediaSlots();
    const [big, setBig] = useState(null);
    return (<div>{(DATA.decks || []).map((d) => {
      const cv = slots["deck:" + d.id + ":cover"] || d.cover;
      return (<div key={d.id} className={`dk-deck ${cv ? "" : "off"}`}>
        <button className="dk-deck-open" disabled={!cv} onClick={() => setBig(cv)} aria-label={cv ? "Open cover: " + d.client : undefined}>
          {cv ? <span className="dk-deck-th"><CroppedImg value={cv} alt="" /></span> : <I.Deck s={30} />}
        </button>
        <span><b>{cv ? <button className="dk-deck-t" onClick={() => setBig(cv)}>{d.client} — {d.title}</button> : <>{d.client} — {d.title}</>}</b><small>{lk(d.note)}{cv ? "" : " · cover soon"}</small></span>
      </div>); })}
      {big && <div className="dk-lb" onClick={(e) => e.target === e.currentTarget && setBig(null)}>
        <img className="dk-native" src={srcOf(big)} alt="" draggable={false} onPointerDown={(e) => panPhoto(e, () => setBig(null))} />
      </div>}
      {big && <button className="dk-lb-x" onClick={() => setBig(null)} aria-label="Close">✕</button>}
    </div>);
  }

  /* ---- Guestbook: same local store the desk version used ---- */
  const GB_KEY = "jf-guestbook";
  function GuestbookApp() {
    const [notes, setNotes] = useState([]);
    const [name, setName] = useState(""); const [msg, setMsg] = useState("");
    useEffect(() => { try { setNotes(JSON.parse(localStorage.getItem(GB_KEY) || "[]")); } catch (e) {} }, []);
    const add = () => {
      if (!msg.trim()) return;
      const next = [{ n: name.trim() || "anon", m: msg.trim(), t: Date.now() }, ...notes].slice(0, 60);
      setNotes(next); setMsg(""); setName("");
      try { localStorage.setItem(GB_KEY, JSON.stringify(next)); } catch (e) {}
    };
    return (
      <div>
        <h4>Sign the guestbook</h4>
        <div className="dk-row"><input className="dk-ta" style={{ minHeight: 0, marginTop: 0, maxWidth: 180 }} placeholder="your name" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <textarea className="dk-ta" placeholder="leave a note…" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <div className="dk-row"><button className="dk-btn" onClick={add}>Pin it</button><span style={{ fontSize: 11.5, color: "#6b6452" }}>saved on your device</span></div>
        <div className="dk-notes">{notes.map((n, i) => <div className="dk-note" key={i}><b>{n.n}</b>{n.m}</div>)}</div>
      </div>);
  }

  /* ---- Letter writer: renders in Jacob's hand, downloads as PNG ---- */
  function LetterApp() {
    const [text, setText] = useState("Dear Jacob,\n\n");
    const download = async () => {
      try { await document.fonts.load("40px JacobMarker"); await document.fonts.ready; } catch (e) {}
      const W = 800, H = 1040, pad = 70;
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const x = c.getContext("2d");
      x.fillStyle = "#efe2c4"; x.fillRect(0, 0, W, H);
      x.strokeStyle = "rgba(150,120,70,.35)";
      for (let y = pad + 46; y < H - pad; y += 46) { x.beginPath(); x.moveTo(pad, y); x.lineTo(W - pad, y); x.stroke(); }
      x.fillStyle = "#2a2118"; x.font = "40px JacobMarker, serif";
      let y = pad + 40; const maxW = W - pad * 2;
      text.split("\n").forEach((line) => {
        let cur = "";
        line.split(" ").forEach((w) => {
          const t = cur ? cur + " " + w : w;
          if (x.measureText(t).width > maxW && cur) { x.fillText(cur, pad, y); y += 46; cur = w; } else cur = t;
        });
        x.fillText(cur, pad, y); y += 46;
      });
      const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = "letter.png"; a.click();
    };
    return (
      <div>
        <div className="dk-paper">{text || " "}</div>
        <textarea className="dk-ta" value={text} onChange={(e) => setText(e.target.value)} placeholder="write your letter…" />
        <div className="dk-row"><button className="dk-btn" onClick={download}>Download as PNG</button>
          <a className="dk-btn" href={`mailto:${DATA.email}?subject=${encodeURIComponent("A letter")}&body=${encodeURIComponent(text)}`}>Send it to Jacob</a></div>
      </div>);
  }

  /* ---- Font story: the pre-desktop panel, brought back as-was — the photo
     of Jacob's dad blurred behind white text, fixed while the copy scrolls
     over it. Uses the original .fc-* styles in playground.css. ---- */
  function FontApp() {
    const fs = PG.fontStory || {};
    const slots = window.useMediaSlots();
    const cover = window.MediaSlots.crop(slots, "font:cover");
    const scan = window.MediaSlots.crop(slots, "font:scan");
    const [typed, setTyped] = useState("");
    const [editing, setEditing] = useState(false);
    const inputRef = useRef(null);
    const cardRef = useRef(null);
    /* scroll-driven blur: the blurred layer's mask edge rises as you read.
       Top of story = mostly sharp (blur only near the bottom); end of story =
       blur reaches nearly the top, with the very top still a touch sharper.
       Tied 1:1 to scroll, so scrolling back up un-blurs. */
    const onStoryScroll = (e) => {
      const el = e.currentTarget, card = cardRef.current; if (!card) return;
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
      card.style.setProperty("--fc-mask-top", (0.55 * p).toFixed(3));
      card.style.setProperty("--fc-mask-edge", (90 - 75 * p).toFixed(1) + "%");
    };
    useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);
    return (
      <div className="fontcard dk-fontcard" data-text-style="soft" ref={cardRef}>
        <div className="fc-body">
          <div className="fc-bg">
            {cover ? <>
              <div className="fc-bg-sharp"><CroppedImg value={cover} /></div>
              <div className="fc-bg-blur"><CroppedImg value={cover} /></div>
            </> : <div className="fc-bg-fallback" />}
            <div className="fc-bg-scrim" />
          </div>
          <div className="fc-scroll" onScroll={onStoryScroll}>
            <div className="fc-title">{fs.title || "the font"}</div>
            <div className="fc-maker">handwriting by {fs.maker || "my dad"}</div>
            <p className="fc-story" style={{ fontFamily: "JacobMarker", fontSize: "19px" }}>{lk(fs.story)}</p>
            <div className="fc-sample">{fs.sample}</div>
            <div className="fc-preview">
              <div className="fc-label">try it</div>
              {editing
                ? <textarea ref={inputRef} className="fc-type" value={typed}
                    onChange={(e) => setTyped(e.target.value)} onBlur={() => typed.trim() === "" && setEditing(false)} />
                : <button className="fc-type fc-type-ghost" onClick={() => setEditing(true)} style={{ height: "50px", fontSize: "20px" }}>
                    {typed.trim() ? typed : fs.previewPlaceholder || "type here"}
                  </button>}
            </div>
            {scan &&
              <div className="fc-compare">
                <figure><div className="fc-scan"><CroppedImg value={scan} /></div><figcaption>original</figcaption></figure>
                <figure><div className="fc-digi">{fs.maker || "Lloyd Fogelhut"}</div><figcaption>digitized</figcaption></figure>
              </div>}
            <a className="fc-download" href={fs.fontFile || "fonts/jacob-custom.otf"} download={fs.downloadAs || "Lloyd Fogelhut.otf"}>↓ download the font</a>
          </div>
        </div>
      </div>);
  }

  /* ---- readme + recycle bin ---- */
  function ReadmeApp() { return <div style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{lk(PG.about)}</div>; }
  function TrashApp() {
    const lines = ["nice try.", "that idea stays buried.", "you didn't see anything.", "deleted for a reason.", "the cutting room floor."];
    const [msg, setMsg] = useState("");
    return (<div className="dk-trash">
      {(PG.trash || []).map((f, i) => <button key={f} onClick={() => setMsg(lines[i % lines.length])}><I.Note s={18} />{f}</button>)}
      <div className="dk-trash-msg">{msg}</div>
    </div>);
  }

  /* The radio has no window any more: its icon opens the corner player
     (desktop.jsx intercepts the "radio" id). The registry entry survives so
     the icon and the Start-menu row still have art and a title. */
  window.DeskApps = {
    folderItems,
    PhotoViewer: (p) => <DkViewer windowed items={p.items} start={p.start} onClose={p.onClose} onIndex={p.onIndex} />,
    photoViewApp: { title: "Photo", Icon: I.Photos, tint: "#6b4a70", bleed: true, body: () => null, size: { w: 560, h: 440 }, min: { w: 300, h: 240 } },
    registry: {
      design: { title: "Design", Icon: I.FolderDesign, tint: "#9b5e39", body: (ctx) => <FolderApp open={ctx.open} folder="design" />, size: { w: 460, h: 320 }, min: { w: 320, h: 240 } },
      web: { title: "Websites", Icon: I.FolderWeb, tint: "#41669a", body: (ctx) => <FolderApp open={ctx.open} folder="web" />, size: { w: 460, h: 320 }, min: { w: 320, h: 240 } },
      radio: { title: "Radio", Icon: I.Radio, tint: "#5b6b8c", mini: true },
      listening: { title: "What I'm listening to", Icon: I.Headphones, tint: "#5c3560", body: () => <ListeningApp />, size: { w: 720, h: 620 }, min: { w: 560, h: 420 } },
      photos: { title: "Photos", Icon: I.Photos, tint: "#6b4a70", body: () => <PhotosApp />, size: { w: 520, h: 380 }, min: { w: 400, h: 320 } },
      paint: { title: "Paint", Icon: I.Paint, tint: "#9b5e39", body: () => <PaintApp />, size: { w: 520, h: 400 }, min: { w: 420, h: 300 } },
      decks: { title: "Pitch Decks", Icon: I.FolderDecks, tint: "#3c6b68", body: () => <DecksApp />, size: { w: 460, h: 300 }, min: { w: 340, h: 220 } },
      guestbook: { title: "Guestbook", Icon: I.Book, tint: "#66743c", body: () => React.createElement(window.GuestbookApp || GuestbookApp), size: { w: 640, h: 560 }, min: { w: 380, h: 340 }, maxable: true, bleed: true },
      letter: { title: "Write me a letter", Icon: I.Letter, tint: "#8a6a2f", body: () => <LetterApp />, size: { w: 440, h: 400 }, min: { w: 360, h: 320 } },
      font: { title: "The font", Icon: I.Font, tint: "#7a4a5e", bleed: true, body: () => <FontApp />, size: { w: 660, h: 620 }, min: { w: 400, h: 400 } },
      trash: { title: "Recycle Bin", Icon: I.Bin, tint: "#555a61", body: () => <TrashApp />, size: { w: 400, h: 280 }, min: { w: 280, h: 200 } },
      readme: { title: "readme.txt", Icon: I.Note, tint: "#4c5b67", body: () => <ReadmeApp />, size: { w: 400, h: 260 }, min: { w: 300, h: 220 } }
    },
    webApp: (p) => ({ title: p.title + " — Internet", Icon: I.Web, tint: "#41669a", body: () => <WebApp project={p} />, size: { w: 640, h: 460 }, min: { w: 420, h: 320 } }),
    imageApp: (p) => ({ title: p.title, Icon: I.Img, tint: "#6b4a70", body: () => <ImageApp project={p} />, size: p.gallery || p.desc ? { w: 820, h: 560 } : { w: 460, h: 380 }, min: { w: 340, h: 380 }, maxable: true })
  };
})();
