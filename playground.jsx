/* =========================================================================
   PLAYGROUND — Jacob's desk. Draggable objects you can also click.
   - Radio  → bottom player bar; click radio again = next of 4 playlists
   - Notebook → write in marker font (saved on device)
   - Guestbook → sticky-note wall (shared if a backend is wired; else local)
   - Photos → flip through a polaroid pile
   - Monitor → opens the Windows-XP desktop (see xp-desktop.jsx)
   - Stickers → just doodles, drag 'em around
   Art style switches via Tweaks (lineart / marker / color).
   ========================================================================= */
const { useState, useEffect, useRef, useCallback, useMemo } = React;
const DATA = window.PORTFOLIO_DATA;
const PG = DATA.playground;

/* ----------------------------------------------------------------------
   GUESTBOOK BACKEND (optional, makes the wall truly shared)
   Leave url+key blank → notes save to the visitor's own device.
   To go shared: create a free jsonbin.io bin holding {"notes":[]}, then
   paste its id + an X-Access-Key below. (Step-by-step in chat.)
   ---------------------------------------------------------------------- */
const GUESTBOOK = { binId: "", key: "" };
const gbShared = !!(GUESTBOOK.binId && GUESTBOOK.key);
async function gbLoad() {
  if (gbShared) {
    try {
      const r = await fetch(`https://api.jsonbin.io/v3/b/${GUESTBOOK.binId}/latest`, { headers: { "X-Access-Key": GUESTBOOK.key } });
      const j = await r.json();return j.record && j.record.notes || [];
    } catch (e) {/* fall through to local */}
  }
  try {return JSON.parse(localStorage.getItem("jf-guestbook") || "[]");} catch (e) {return [];}
}
async function gbSave(notes) {
  localStorage.setItem("jf-guestbook", JSON.stringify(notes));
  if (gbShared) {
    try {await fetch(`https://api.jsonbin.io/v3/b/${GUESTBOOK.binId}`, { method: "PUT", headers: { "Content-Type": "application/json", "X-Access-Key": GUESTBOOK.key }, body: JSON.stringify({ notes }) });} catch (e) {}
  }
}

/* ----------------------------------------------------------------------
   Marker "rough" SVG filter (used by the marker art style)
   ---------------------------------------------------------------------- */
function MarkerFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <filter id="marker-rough">
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.4" />
      </filter>
    </svg>);

}

/* ----------------------------------------------------------------------
   Object art (line-art SVGs; CSS recolors per art style)
   ---------------------------------------------------------------------- */
const Art = {
  radio:
  <svg viewBox="0 0 140 96" className="no-theme" style={{ filter: "none" }}>
      {/* independent Winamp-style icon — deliberately NOT themed by the desk art style */}
      <rect x="4" y="4" width="132" height="88" rx="3" style={{ fill: "#aab3c2", stroke: "#3a3f4d", strokeWidth: 2 }} />
      <rect x="4" y="4" width="132" height="10" rx="3" style={{ fill: "#5b6b8c", stroke: "#3a3f4d", strokeWidth: 2 }} />
      <circle cx="11" cy="9" r="1.6" style={{ fill: "#e2e6ee" }} /><circle cx="17" cy="9" r="1.6" style={{ fill: "#e2e6ee" }} />
      <rect x="118" y="5.5" width="7" height="7" rx="1" style={{ fill: "#e2e6ee", stroke: "#3a3f4d", strokeWidth: 1.2 }} />
      <rect x="127" y="5.5" width="7" height="7" rx="1" style={{ fill: "#e2e6ee", stroke: "#3a3f4d", strokeWidth: 1.2 }} />
      <rect x="10" y="18" width="120" height="32" rx="1" style={{ fill: "#0c1f13", stroke: "#08130c", strokeWidth: 1.5 }} />
      <g style={{ fill: "#39d353" }}>
        <rect x="15" y="38" width="3.4" height="8" /><rect x="20" y="28" width="3.4" height="18" />
        <rect x="25" y="33" width="3.4" height="13" /><rect x="30" y="22" width="3.4" height="24" />
        <rect x="35" y="30" width="3.4" height="16" /><rect x="40" y="40" width="3.4" height="6" />
        <rect x="45" y="25" width="3.4" height="21" /><rect x="50" y="35" width="3.4" height="11" />
        <rect x="55" y="20" width="3.4" height="26" /><rect x="60" y="32" width="3.4" height="14" />
        <rect x="65" y="38" width="3.4" height="8" /><rect x="70" y="24" width="3.4" height="22" />
        <rect x="75" y="30" width="3.4" height="16" /><rect x="80" y="42" width="3.4" height="4" />
        <rect x="85" y="27" width="3.4" height="19" /><rect x="90" y="36" width="3.4" height="10" />
        <rect x="95" y="22" width="3.4" height="24" /><rect x="100" y="33" width="3.4" height="13" />
        <rect x="105" y="40" width="3.4" height="6" /><rect x="110" y="28" width="3.4" height="18" />
        <rect x="115" y="35" width="3.4" height="11" /><rect x="120" y="24" width="3.4" height="22" />
      </g>
      <rect x="10" y="52" width="120" height="3" rx="1.5" style={{ fill: "#3a3f4d" }} />
      <circle cx="46" cy="53.5" r="4" style={{ fill: "#e2e6ee", stroke: "#3a3f4d", strokeWidth: 1.5 }} />
      <g style={{ stroke: "#3a3f4d", strokeWidth: 2, fill: "none" }}>
        <circle cx="26" cy="66" r="8" /><circle cx="48" cy="66" r="8" /><circle cx="70" cy="66" r="8" /><circle cx="92" cy="66" r="8" /><circle cx="114" cy="66" r="8" />
      </g>
      <g style={{ fill: "#3a3f4d" }}>
        <path d="M22 62 L31 66 L22 70 Z" /><rect x="45" y="62" width="2.6" height="8" /><rect x="50.4" y="62" width="2.6" height="8" />
        <path d="M74 62 L65 66 L74 70 Z" /><rect x="90" y="62" width="8" height="8" />
        <path d="M110 62 L119 66 L110 70 Z" />
      </g>
      <rect x="10" y="80" width="46" height="4" rx="2" style={{ fill: "#3a3f4d" }} />
      <circle cx="30" cy="82" r="3.4" style={{ fill: "#e2e6ee", stroke: "#3a3f4d", strokeWidth: 1.5 }} />
      <rect x="64" y="80" width="30" height="4" rx="2" style={{ fill: "#3a3f4d" }} />
      <circle cx="78" cy="82" r="3.4" style={{ fill: "#e2e6ee", stroke: "#3a3f4d", strokeWidth: 1.5 }} />
    </svg>,

  headphones:
  <svg viewBox="0 0 140 120" fill="none" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
      {/* Koss Porta Pro: thin sprung headband + temple pads + round earcups */}
      <path d="M22 64 V44 a48 38 0 0 1 96 0 V64" />
      <path d="M30 60 V46 a40 30 0 0 1 80 0 V60" data-accent />
      <rect x="14" y="58" width="20" height="12" rx="6" data-skin />
      <rect x="106" y="58" width="20" height="12" rx="6" data-skin />
      <circle cx="34" cy="86" r="20" data-fill="radio" /><circle cx="34" cy="86" r="11" data-skin />
      <circle cx="106" cy="86" r="20" data-fill="radio" /><circle cx="106" cy="86" r="11" data-skin />
    </svg>,

  monitor:
  <svg viewBox="0 0 152 134" fill="none" strokeWidth="2.4" strokeLinejoin="round">
      <rect x="6" y="6" width="140" height="104" rx="8" data-fill="monitor" />
      <rect x="20" y="18" width="112" height="74" rx="3" data-skin />
      <path d="M30 84 L46 50 L60 70 L74 40 L92 84" stroke="#9fd0ff" />
      <circle cx="110" cy="42" r="7" stroke="#ffe27a" />
      <circle cx="124" cy="100" r="2.6" data-accent />
      <path d="M58 110 H94 L100 126 H52 Z" data-fill="monitor" />
    </svg>,

  mycomputer:
  <svg viewBox="0 0 132 120" className="no-theme" style={{ filter: "none" }}>
      {/* independent Win2000/XP "My Computer" icon — NOT themed by the desk art style */}
      <rect x="8" y="10" width="72" height="52" rx="3" style={{ fill: "#dcd6c6", stroke: "#8a8470", strokeWidth: 2 }} />
      <rect x="14" y="16" width="60" height="38" rx="1" style={{ fill: "#c8c2b2", stroke: "#8a8470", strokeWidth: 1.5 }} />
      <rect x="18" y="20" width="52" height="30" rx="1" style={{ fill: "#1a2f5c", stroke: "#0d1a33", strokeWidth: 1.5 }} />
      <path d="M26 42 L36 26 L46 36 L56 24" style={{ stroke: "#9fd0ff", strokeWidth: 2, fill: "none" }} />
      <rect x="32" y="62" width="16" height="7" style={{ fill: "#dcd6c6", stroke: "#8a8470", strokeWidth: 1.5 }} />
      <rect x="14" y="69" width="52" height="6" rx="2" style={{ fill: "#c8c2b2", stroke: "#8a8470", strokeWidth: 1.5 }} />
      <rect x="86" y="34" width="38" height="78" rx="3" style={{ fill: "#dcd6c6", stroke: "#8a8470", strokeWidth: 2 }} />
      <rect x="92" y="42" width="26" height="8" rx="1" style={{ fill: "#0d1a33" }} />
      <circle cx="105" cy="60" r="4.4" style={{ fill: "#3a6ea5", stroke: "#0d1a33", strokeWidth: 1.2 }} />
      <circle cx="105" cy="72" r="4.4" style={{ fill: "#c8c2b2", stroke: "#8a8470", strokeWidth: 1.2 }} />
      <rect x="92" y="88" width="26" height="18" rx="1" style={{ fill: "#c8c2b2", stroke: "#8a8470", strokeWidth: 1.5 }} />
      <rect x="96" y="92" width="18" height="2.4" style={{ fill: "#8a8470" }} />
      <rect x="96" y="97" width="18" height="2.4" style={{ fill: "#8a8470" }} />
      <rect x="96" y="102" width="12" height="2.4" style={{ fill: "#8a8470" }} />
    </svg>,

  notebook:
  <svg viewBox="0 0 112 132" fill="none" strokeWidth="2.4" strokeLinejoin="round">
      <rect x="20" y="8" width="84" height="116" rx="4" data-fill="book" />
      <line x1="40" y1="30" x2="88" y2="30" /><line x1="40" y1="48" x2="88" y2="48" />
      <line x1="40" y1="66" x2="88" y2="66" /><line x1="40" y1="84" x2="76" y2="84" />
      <line x1="20" y1="8" x2="20" y2="124" />
      <g strokeWidth="2.2">
        <circle cx="14" cy="20" r="5" data-skin /><circle cx="14" cy="40" r="5" data-skin />
        <circle cx="14" cy="60" r="5" data-skin /><circle cx="14" cy="80" r="5" data-skin /><circle cx="14" cy="100" r="5" data-skin />
      </g>
    </svg>,

  guestbook:
  <svg viewBox="0 0 132 116" fill="none" strokeWidth="2.4" strokeLinejoin="round">
      <rect x="6" y="6" width="120" height="104" rx="5" data-fill="board" />
      <rect x="20" y="20" width="40" height="40" rx="2" data-skin transform="rotate(-5 40 40)" />
      <rect x="74" y="26" width="38" height="38" rx="2" data-skin transform="rotate(4 93 45)" />
      <rect x="40" y="66" width="40" height="36" rx="2" data-skin transform="rotate(-2 60 84)" />
      <circle cx="40" cy="22" r="2.4" data-accent /><circle cx="92" cy="28" r="2.4" data-accent /><circle cx="60" cy="68" r="2.4" data-accent />
    </svg>,

  photos:
  <svg viewBox="0 0 132 120" fill="none" strokeWidth="2.4" strokeLinejoin="round">
      <rect x="14" y="20" width="92" height="92" rx="2" data-fill="photo" transform="rotate(-8 60 66)" />
      <rect x="26" y="10" width="92" height="92" rx="2" data-fill="photo" transform="rotate(6 72 56)" />
      <rect x="36" y="18" width="72" height="56" data-skin transform="rotate(6 72 46)" />
      <circle cx="58" cy="36" r="6" stroke="#ffe27a" transform="rotate(6 72 46)" />
    </svg>,

  star:
  <svg viewBox="0 0 64 64" fill="none" strokeWidth="2.6" strokeLinejoin="round">
      <path d="M32 6 L40 24 L60 26 L45 40 L49 60 L32 49 L15 60 L19 40 L4 26 L24 24 Z" data-accent />
    </svg>,

  smiley:
  <svg viewBox="0 0 64 64" fill="none" strokeWidth="2.6" strokeLinejoin="round">
      <circle cx="32" cy="32" r="26" data-accent />
      <circle cx="23" cy="27" r="2.6" fill="#1b1a16" stroke="none" /><circle cx="41" cy="27" r="2.6" fill="#1b1a16" stroke="none" />
      <path d="M21 38 Q32 50 43 38" />
    </svg>,

  squiggle:
  <svg viewBox="0 0 80 40" fill="none" strokeWidth="2.8" strokeLinecap="round">
      <path d="M6 28 Q18 6 30 22 T54 22 T78 18" data-accent />
    </svg>

};

/* ----------------------------------------------------------------------
   Headphones art — switchable look (Tweak "hpArt"):
     drawing  → the clean Koss Porta Pro line drawing (honors desk art style)
     marker   → mixed-media collage leaning on hand-drawn marker scribbles
     paper    → mixed-media collage on a torn-paper scrap with washi tape
   The collages drop a real headphones photo in when one is uploaded
   (cutout:headphones), else they compose around the line drawing.
   ---------------------------------------------------------------------- */
function HeadphonesArt({ style, photo, size = 124 }) {
  if (style === "drawing" || !style) {
    return <span className="art" style={{ width: size, height: "auto" }}>{Art.headphones}</span>;
  }
  const media = photo ?
  <img className="hpc-photo" src={photo.u} alt="headphones" draggable={false} /> :
  <span className="hpc-draw">{Art.headphones}</span>;
  return (
    <div className={`hpc hpc-${style}`} style={{ width: size }}>
      <span className="hpc-paper" />
      <span className="hpc-tape hpc-tape-l" />
      <span className="hpc-tape hpc-tape-r" />
      <div className="hpc-media">{media}</div>
      {style === "marker" &&
      <svg className="hpc-scribble" viewBox="0 0 150 140" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 118 q42 20 96 7" />
          <path d="M120 30 q16 -12 22 4 m-22 -4 q-4 12 6 16" />
          <path d="M18 26 l5 -11 m-2 5 l11 1" />
          <path d="M132 96 l9 4 m-6 -6 l3 9" />
        </svg>}
      <span className="hpc-word" style={{ fontFamily: "JacobMarker" }}>playlists</span>
    </div>);

}

/* ----------------------------------------------------------------------
   Desk position memory + bring-to-front.
   - POS: per-session saved {x,y} for every draggable, keyed by a stable
     `pkey`. So a panel and its minimized icon share a spot, and nothing
     snaps back to a default once you've moved it. Session-only (clears on a
     full reload) per Jacob's call.
   - bumpZ(): classic window behavior — whatever you touch comes to the very
     front. Fixes the font/guestbook panels hiding under dragged icons.
   ---------------------------------------------------------------------- */
const POSKEY = "jf-pg-pos";
let POS_CACHE = null;
function posAll() {
  if (POS_CACHE) return POS_CACHE;
  try {POS_CACHE = JSON.parse(sessionStorage.getItem(POSKEY) || "{}");} catch (e) {POS_CACHE = {};}
  return POS_CACHE;
}
function getPos(pkey, fallback) {
  const p = pkey && posAll()[pkey];
  return p && typeof p.x === "number" ? p : fallback;
}
function savePos(pkey, x, y) {
  if (!pkey) return;
  const c = posAll();c[pkey] = { x, y };
  try {sessionStorage.setItem(POSKEY, JSON.stringify(c));} catch (e) {}
}

/* ----------------------------------------------------------------------
   Panel resizing (browser-window feel): 8 handles, size persists per pkey
   in localStorage (survives refresh AND closing the browser — Jacob asked
   for this to stick permanently, unlike desk positions above).

   Reset is a DEDICATED small ↺ button (not double-click-the-corner). QA
   note: double-click-to-reset used to live on the corner handles — but
   resizing the SAME corner twice in a row (drag, release, grab it again)
   reads to the browser as a double-click at that spot, so a second resize
   attempt silently snapped back to the default. Moving reset to its own
   control fixes that without losing the feature.
   ---------------------------------------------------------------------- */
const SIZEKEY = "jf-pg-size";
let SIZE_CACHE = null;
function sizeAll() {
  if (SIZE_CACHE) return SIZE_CACHE;
  try {SIZE_CACHE = JSON.parse(localStorage.getItem(SIZEKEY) || "{}");} catch (e) {SIZE_CACHE = {};}
  return SIZE_CACHE;
}
function getSize(pkey) {
  const s = pkey && sizeAll()[pkey];
  return s && typeof s.w === "number" ? s : null;
}
function saveSize(pkey, w, h) {
  if (!pkey) return;
  const c = sizeAll();c[pkey] = { w, h };
  try {localStorage.setItem(SIZEKEY, JSON.stringify(c));} catch (e) {}
}
function clearSize(pkey) {
  if (!pkey) return;
  const c = sizeAll();delete c[pkey];
  try {localStorage.setItem(SIZEKEY, JSON.stringify(c));} catch (e) {}
}
// scale-mode panels persist a single factor k instead of w/h.
function saveSizeK(pkey, k) {
  if (!pkey) return;
  const c = sizeAll();c[pkey] = { k };
  try {localStorage.setItem(SIZEKEY, JSON.stringify(c));} catch (e) {}
}

// Eight handles (4 corners + 4 edges) on a DESK object, matching the open
// panels' look but driving PROPORTIONAL scaling (the object zooms as one unit
// via --obj-scale). Handles fade in on hover; double-clicking a corner resets.
// Click/drag elsewhere on the object is untouched. Persists per pkey.
function ScaleGrip({ pkey, min = 0.6, max = 2.5 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current && ref.current.parentElement;
    if (!el) return;
    const sv = getSize(pkey);
    if (sv && typeof sv.k === "number") el.style.setProperty("--obj-scale", sv.k);
    // eslint-disable-next-line
  }, []);
  const start = (dir) => (e) => {
    e.preventDefault(); e.stopPropagation();
    const el = ref.current.parentElement;
    const natW = el.offsetWidth || 1; // offsetWidth ignores the scale transform
    const cur = getSize(pkey);
    const k0 = cur && typeof cur.k === "number" ? cur.k : 1;
    const sx = e.clientX, sy = e.clientY;
    const sgnX = dir.includes("w") ? -1 : 1, sgnY = dir.includes("n") ? -1 : 1;
    const move = (ev) => {
      const dx = (ev.clientX - sx) * sgnX, dy = (ev.clientY - sy) * sgnY;
      // edges drive on their own axis; corners take the larger push outward.
      // Screen-space drag distance already reflects the CURRENT visual scale
      // (k0), so divide by natW*k0 (not just natW) — otherwise re-resizing an
      // already-scaled object is over-sensitive and can snap unevenly.
      const drive = dir === "n" || dir === "s" ? dy : dir === "e" || dir === "w" ? dx : Math.max(dx, dy);
      let k = k0 + drive / (natW * k0);
      k = Math.max(min, Math.min(max, k));
      el.style.setProperty("--obj-scale", k);
    };
    const up = () => {
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
      const k = parseFloat(getComputedStyle(el).getPropertyValue("--obj-scale")) || 1;
      saveSizeK(pkey, k);
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  const reset = (e) => {
    e.stopPropagation();
    const el = ref.current.parentElement;
    clearSize(pkey);
    el.style.setProperty("--obj-scale", 1);
  };
  const dirs = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
  return (
    <div className="objrz" ref={ref}>
      {dirs.map((d) =>
      <span key={d} className={`objrzh objrzh-${d}`} onPointerDown={start(d)}
        onDoubleClick={d.length === 2 ? reset : undefined}
        title={d.length === 2 ? "Drag to resize \u00b7 double-click to reset" : "Drag to resize"} />)}
    </div>);
}

// Drop <ResizeHandles> as a direct child of a positioned panel element. It
// resizes that parent from any of 8 edges/corners, clamps to `min`, optionally
// locks aspect ratio, persists to sessionStorage per `pkey`, and resets to
// `def` on double-clicking a corner. When the parent is absolutely positioned
// (desk cards), N/W drags also move left/top so the opposite edge stays put.
function ResizeHandles({ pkey, min = { w: 300, h: 220 }, aspect = false, def, scale = false, minK = 0.6, maxK = 2.2, hideReset = false }) {
  const [, forceTick] = useState(0);
  const rootRef = useRef(null);
  useEffect(() => {
    const panel = rootRef.current && rootRef.current.parentElement;
    if (!panel) return;
    // SCALE mode: the panel keeps its natural layout size and is zoomed as one
    // rigid unit via CSS transform (content does NOT reflow). Size store holds
    // the scale factor k.
    if (scale) {
      panel.style.transformOrigin = "center center";
      const sv = getSize(pkey);
      if (sv && typeof sv.k === "number") panel.style.transform = `scale(${sv.k})`;
      return;
    }
    const s = getSize(pkey);
    if (s) { panel.style.width = s.w + "px"; if (!aspect && s.h) panel.style.height = s.h + "px"; }
    else if (def) { panel.style.width = def.w + "px"; if (!aspect && def.h) panel.style.height = def.h + "px"; }
    // eslint-disable-next-line
  }, []);
  const start = (dir) => (e) => {
    e.preventDefault(); e.stopPropagation();
    const panel = rootRef.current.parentElement;
    if (scale) {
      // proportional zoom of the whole panel; drag distance along the handle's
      // outward diagonal maps to a scale delta relative to the natural width.
      const natW = panel.offsetWidth || 1; // offsetWidth ignores transform
      const cur = getSize(pkey);
      const k0 = cur && typeof cur.k === "number" ? cur.k : 1;
      const sx = e.clientX, sy = e.clientY;
      const sgnX = dir.includes("w") ? -1 : 1, sgnY = dir.includes("n") ? -1 : 1;
      const move = (ev) => {
        const dx = (ev.clientX - sx) * sgnX, dy = (ev.clientY - sy) * sgnY;
        const drive = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
        let k = k0 + drive / natW;
        k = Math.max(minK, Math.min(maxK, k));
        panel.style.transform = `scale(${k})`;
      };
      const up = () => {
        window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
        const m = /scale\(([\d.]+)\)/.exec(panel.style.transform || "");
        saveSizeK(pkey, m ? parseFloat(m[1]) : 1);
      };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
      return;
    }
    const positioned = /(absolute|fixed)/.test(getComputedStyle(panel).position);
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY, w0 = r.width, h0 = r.height;
    const l0 = panel.offsetLeft, t0 = panel.offsetTop, ar = w0 / h0;
    const move = (ev) => {
      let w = w0, h = h0, dl = 0, dt = 0;
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (dir.includes("e")) w = w0 + dx;
      if (dir.includes("w")) { w = w0 - dx; dl = dx; }
      if (dir.includes("s")) h = h0 + dy;
      if (dir.includes("n")) { h = h0 - dy; dt = dy; }
      w = Math.max(min.w, w); h = Math.max(min.h, h);
      panel.style.width = w + "px";
      // aspect-locked panels (image-heavy) resize by WIDTH only — height
      // follows the content's own aspect ratio, so nothing clips or stretches.
      if (!aspect) panel.style.height = h + "px";
      if (positioned) {
        if (dir.includes("w")) panel.style.left = (l0 + Math.min(dl, w0 - min.w)) + "px";
        if (!aspect && dir.includes("n")) panel.style.top = (t0 + Math.min(dt, h0 - min.h)) + "px";
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
      saveSize(pkey, Math.round(parseFloat(panel.style.width)), aspect ? 0 : Math.round(parseFloat(panel.style.height)));
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  const reset = (e) => {
    e.stopPropagation();
    const panel = rootRef.current.parentElement;
    clearSize(pkey);
    if (scale) { panel.style.transform = ""; forceTick((x) => x + 1); return; }
    panel.style.width = def ? def.w + "px" : ""; panel.style.height = (def && def.h) ? def.h + "px" : "";
    forceTick((x) => x + 1);
  };
  const dirs = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
  return (
    <div className="rzf" ref={rootRef}>
      {dirs.map((d) =>
      <span key={d} className={`rzh rzh-${d}`} onPointerDown={start(d)} title="Drag to resize" />)}
      {!hideReset &&
      <button type="button" className="rz-reset" onPointerDown={(e) => e.stopPropagation()}
        onClick={reset} title="Reset size">↺ reset size</button>}
    </div>);
}
let TOPZ = 30;
function bumpZ(el) {el.style.zIndex = ++TOPZ;}

/* ----------------------------------------------------------------------
   Draggable object (distinguishes click from drag)
   ---------------------------------------------------------------------- */
function Obj({ kind, label, hint, size, init, onClick, z, cutout, render, pkey, plainTag }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const p = getPos(pkey, init);
    const x = Math.max(0, Math.min(window.innerWidth - size, p.x));
    const y = Math.max(54, Math.min(window.innerHeight - size - 40, p.y));
    el.style.left = x + "px";el.style.top = y + "px";
  }, []);
  const onDown = (e) => {
    e.preventDefault();
    const el = ref.current;el.classList.add("grab");bumpZ(el);
    const r = el.getBoundingClientRect();
    const sx = e.clientX,sy = e.clientY,ox = r.left,oy = r.top;let moved = 0;
    const move = (ev) => {
      moved += Math.abs(ev.movementX) + Math.abs(ev.movementY);
      el.style.left = Math.max(0, Math.min(window.innerWidth - 60, ox + ev.clientX - sx)) + "px";
      el.style.top = Math.max(64, Math.min(window.innerHeight - 60, oy + ev.clientY - sy)) + "px";
    };
    const up = () => {
      el.classList.remove("grab");
      window.removeEventListener("pointermove", move);window.removeEventListener("pointerup", up);
      savePos(pkey, parseInt(el.style.left, 10) || 0, parseInt(el.style.top, 10) || 0);
      if (moved < 6) onClick();
    };
    window.addEventListener("pointermove", move);window.addEventListener("pointerup", up);
  };
  return (
    <div className={`obj ${cutout ? "has-cutout" : ""}`} ref={ref} style={{ width: size, zIndex: z }} onPointerDown={onDown}>
      {hint && <span className="hint">{hint}</span>}
      {render ? render :
      cutout ?
      <span className="art is-cutout" style={{ width: size }}><img src={cutout.u} alt={label || kind} draggable={false} /></span> :
      <span className="art" style={{ width: size, height: "auto" }}>{Art[kind]}</span>}
      {label && <span className={`tag ${plainTag ? "tag-plain" : ""}`}>{label}</span>}
      {pkey && <ScaleGrip pkey={"objscale:" + pkey} />}
    </div>);

}

/* ----------------------------------------------------------------------
   Radio player bar
   ---------------------------------------------------------------------- */
function RadioBar({ list, idx, onCycle, onShuffle, onClose }) {
  const pl = list[idx];
  return (
    <div className="radio-bar winamp-skin">
      <div className="rb-head">
        <span className="rb-dots"><i></i><i></i></span>
        <span className="rb-eq"><i></i><i></i><i></i><i></i></span>
        <span className="rb-name">{pl.name}</span>
        <span className="rb-count">{idx + 1}/{list.length}{pl.placeholder ? " · demo" : ""}</span>
        <span className="rb-btns">
          <button className="rb-btn" onClick={() => onCycle(-1)} title="Previous playlist">‹</button>
          <button className="rb-btn" onClick={onShuffle} title="Shuffle playlist">⤬</button>
          <button className="rb-btn" onClick={() => onCycle(1)} title="Next playlist">›</button>
          <button className="rb-btn x" onClick={onClose} title="Close">✕</button>
        </span>
      </div>
      <div className="rb-seek"><i></i></div>
      <div className="rb-embed">
        <iframe key={pl.embed + idx} src={pl.embed} height={pl.kind === "apple" ? 175 : 152}
        allow="autoplay *; encrypted-media *;" loading="lazy" title={pl.name}></iframe>
      </div>
      <div className="rb-note">click the radio again to flip playlists · web embeds preview ~30s unless you're signed in</div>
    </div>);

}

/* ----------------------------------------------------------------------
   Notebook
   ---------------------------------------------------------------------- */
function Notebook({ marker, onClose }) {
  const [text, setText] = useState(() => localStorage.getItem("jf-notebook") || "");
  useEffect(() => {localStorage.setItem("jf-notebook", text);}, [text]);
  return (
    <div className="scrim" onPointerDown={(e) => e.target.classList.contains("scrim") && onClose()}>
      <div className="panel notebook">
        <ResizeHandles pkey="sz-notebook" min={{ w: 320, h: 300 }} />
        <button className="p-x" onClick={onClose}>✕</button>
        <div className="nb-head"><b>notebook</b></div>
        <textarea className={marker ? "" : "plain"} value={text} placeholder="write something…" autoFocus
        onChange={(e) => setText(e.target.value)} />
        <div className="nb-foot">saves to your device</div>
      </div>
    </div>);

}

/* ----------------------------------------------------------------------
   Guestbook (sticky-note wall)
   ---------------------------------------------------------------------- */
function Guestbook({ onClose }) {
  const [notes, setNotes] = useState([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {gbLoad().then((n) => {setNotes(n);setBusy(false);});}, []);
  const add = async () => {
    if (!msg.trim()) return;
    const next = [{ msg: msg.trim(), by: name.trim() || "a visitor", at: Date.now() }, ...notes].slice(0, 80);
    setNotes(next);setMsg("");setName("");
    await gbSave(next);
  };
  return (
    <div className="scrim" onPointerDown={(e) => e.target.classList.contains("scrim") && onClose()}>
      <div className="panel gboard">
        <ResizeHandles pkey="sz-guestbook" min={{ w: 340, h: 320 }} />
        <button className="p-x" onClick={onClose}>✕</button>
        <div className="gb-head"><b>guestbook</b><span className="gb-status">{gbShared ? "● shared wall" : "● this device"}</span></div>
        <div className="gb-form">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="name" style={{ maxWidth: 110 }} />
          <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="leave a note…"
          onKeyDown={(e) => e.key === "Enter" && add()} />
          <button onClick={add}>pin</button>
        </div>
        <div className="gb-wall">
          {busy && <div className="gb-empty">loading…</div>}
          {!busy && notes.length === 0 && <div className="gb-empty">be the first to sign ✶</div>}
          {notes.map((n, i) =>
          <div className="gnote" key={n.at + "-" + i}><span className="pin"></span>{n.msg}<span className="by">— {n.by || "a visitor"}</span></div>
          )}
        </div>
      </div>
    </div>);

}

/* ----------------------------------------------------------------------
   Live desk panels (#9) — notebook + guestbook sit OPEN on the desk,
   draggable by their title bar, with an ✕ to minimize back to an object.
   ---------------------------------------------------------------------- */
function DeskCard({ className, init, z, title, status, onMin, children, pkey, resize }) {
  const ref = useRef(null);
  useEffect(() => {const el = ref.current;const p = getPos(pkey, init);el.style.left = p.x + "px";el.style.top = p.y + "px";bumpZ(el);}, []);
  const onDown = (e) => {
    e.preventDefault();
    const el = ref.current;el.classList.add("grab");bumpZ(el);
    const r = el.getBoundingClientRect();
    const sx = e.clientX,sy = e.clientY,ox = r.left,oy = r.top;
    const move = (ev) => {
      el.style.left = Math.max(0, Math.min(window.innerWidth - 90, ox + ev.clientX - sx)) + "px";
      el.style.top = Math.max(54, Math.min(window.innerHeight - 80, oy + ev.clientY - sy)) + "px";
    };
    const up = () => {
      el.classList.remove("grab");window.removeEventListener("pointermove", move);window.removeEventListener("pointerup", up);
      savePos(pkey, parseInt(el.style.left, 10) || 0, parseInt(el.style.top, 10) || 0);
    };
    window.addEventListener("pointermove", move);window.addEventListener("pointerup", up);
  };
  return (
    <div className={`desk-card ${className}`} ref={ref} style={{ zIndex: z }}>
      <div className="dc-bar" onPointerDown={onDown}>
        <b>{title}</b>
        {status && <span className="dc-status">{status}</span>}
        <button className="dc-min" onPointerDown={(e) => e.stopPropagation()} onClick={onMin} title="Minimize">✕</button>
      </div>
      <div className="dc-body">{children}</div>
      {resize && <ResizeHandles {...resize} />}
    </div>);

}

function LiveNote({ marker, init, z, onMin }) {
  const [text, setText] = useState(() => localStorage.getItem("jf-notebook") || "");
  useEffect(() => {localStorage.setItem("jf-notebook", text);}, [text]);
  return (
    <DeskCard className="dc-notebook" init={init} z={z} pkey="font" title="notebook" status="saves to your device" onMin={onMin}>
      <textarea className={marker ? "" : "plain"} value={text} placeholder="write something…"
      onPointerDown={(e) => e.stopPropagation()} onChange={(e) => setText(e.target.value)} />
    </DeskCard>);

}

function LiveGuest({ init, z, onMin, pkey }) {
  const [notes, setNotes] = useState([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {gbLoad().then((n) => {setNotes(n);setBusy(false);});}, []);
  const add = async () => {
    if (!msg.trim()) return;
    const next = [{ msg: msg.trim(), by: name.trim() || "a visitor", at: Date.now() }, ...notes].slice(0, 80);
    setNotes(next);setMsg("");setName("");
    await gbSave(next);
  };
  return (
    <DeskCard className="dc-guestbook" init={init} z={z} pkey="guest" title="guestbook" status={gbShared ? "● shared wall" : "● this device"} onMin={onMin}>
      <div className="gb-form">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="name" style={{ maxWidth: 92 }} onPointerDown={(e) => e.stopPropagation()} />
        <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="leave a note…"
        onKeyDown={(e) => e.key === "Enter" && add()} onPointerDown={(e) => e.stopPropagation()} />
        <button onClick={add}>pin</button>
      </div>
      <div className="gb-wall">
        {busy && <div className="gb-empty">loading…</div>}
        {!busy && notes.length === 0 && <div className="gb-empty">be the first to sign ✶</div>}
        {notes.map((n, i) =>
        <div className="gnote" key={n.at + "-" + i}><span className="pin"></span>{n.msg}<span className="by">— {n.by || "a visitor"}</span></div>
        )}
      </div>
    </DeskCard>);

}

/* ----------------------------------------------------------------------
   THE FONT STORY (#4) — replaces the old notebook. A draggable desk panel
   styled like a mini project page: the uploaded photo of Jacob's dad (with
   the font over it) sits blurred behind white content — the story, a big
   alphabet sample, a click-to-type live preview, the original handwriting
   scan beside the digitized font, and a download button (Lloyd Fogelhut.otf).
   Minimizes to a photo object on the desk.
   ---------------------------------------------------------------------- */
function FontBgEditor({ t, setTweak, onClose }) {
  const stop = (e) => e.stopPropagation();
  return (
    <div className="fc-bgeditor" onPointerDown={stop}>
      <div className="fc-bgeditor-head">
        <b>background look</b>
        <button className="dc-min" onClick={onClose} title="Close">✕</button>
      </div>
      <window.TweakSlider label="Blur near top" value={t.fcBlurTop} min={0} max={10} step={1} unit="px"
        onChange={(v) => setTweak("fcBlurTop", v)} />
      <window.TweakSlider label="Blur near bottom" value={t.fcBlurBottom} min={0} max={30} step={1} unit="px"
        onChange={(v) => setTweak("fcBlurBottom", v)} />
      <window.TweakSlider label="Blur starts at" value={t.fcGradStart} min={0} max={90} step={5} unit="%"
        onChange={(v) => setTweak("fcGradStart", v)} />
      <window.TweakSlider label="Dim overlay" value={t.fcDim} min={0} max={85} step={5} unit="%"
        onChange={(v) => setTweak("fcDim", v)} />
      <window.TweakRadio label="Text style" value={t.fcTextStyle}
        options={[{ value: "soft", label: "Soft fade" }, { value: "glow", label: "Pure glow" }]}
        onChange={(v) => setTweak("fcTextStyle", v)} />
    </div>);
}

function FontStory({ cover, scan, init, z, onMin, pkey, t, setTweak }) {
  const fs = PG.fontStory || {};
  const ref = useRef(null);
  const [typed, setTyped] = useState("");
  const [editing, setEditing] = useState(false);
  const [bgEditor, setBgEditor] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {const el = ref.current;const p = getPos(pkey, init);el.style.left = p.x + "px";el.style.top = p.y + "px";bumpZ(el);}, []);
  useEffect(() => {if (editing && inputRef.current) inputRef.current.focus();}, [editing]);
  const onDown = (e) => {
    e.preventDefault();
    const el = ref.current;el.classList.add("grab");bumpZ(el);
    const r = el.getBoundingClientRect();
    const sx = e.clientX,sy = e.clientY,ox = r.left,oy = r.top;
    const move = (ev) => {
      el.style.left = Math.max(0, Math.min(window.innerWidth - 120, ox + ev.clientX - sx)) + "px";
      el.style.top = Math.max(54, Math.min(window.innerHeight - 90, oy + ev.clientY - sy)) + "px";
    };
    const up = () => {
      el.classList.remove("grab");window.removeEventListener("pointermove", move);window.removeEventListener("pointerup", up);
      savePos(pkey, parseInt(el.style.left, 10) || 0, parseInt(el.style.top, 10) || 0);
    };
    window.addEventListener("pointermove", move);window.addEventListener("pointerup", up);
  };
  const noStop = (e) => e.stopPropagation();
  const bgVars = {
    "--fc-blur-top": (t.fcBlurTop ?? 2) + "px",
    "--fc-blur-bottom": (t.fcBlurBottom ?? 13) + "px",
    "--fc-grad-start": (t.fcGradStart ?? 35) + "%",
    "--fc-dim": (t.fcDim ?? 45) / 100
  };
  return (
    <div className="desk-card fontcard" ref={ref} style={{ zIndex: z }} data-text-style={t.fcTextStyle || "soft"}>
      <ResizeHandles pkey={"sz-" + (pkey || "font")} min={{ w: 320, h: 380 }} def={{ w: 660, h: 620 }} hideReset />
      <div className="fc-bar" onPointerDown={onDown}>
        <b>the font</b>
        <button className="dc-min" onPointerDown={noStop} onClick={() => setBgEditor((v) => !v)} title="Background look">⚙</button>
        <button className="dc-min" onPointerDown={noStop} onClick={onMin} title="Minimize">✕</button>
      </div>
      {bgEditor && <FontBgEditor t={t} setTweak={setTweak} onClose={() => setBgEditor(false)} />}
      <div className="fc-body">
        <div className="fc-bg" style={bgVars}>
          {cover ? <>
            <div className="fc-bg-sharp"><CroppedImg value={cover} /></div>
            <div className="fc-bg-blur"><CroppedImg value={cover} /></div>
          </> : <div className="fc-bg-fallback" />}
          <div className="fc-bg-scrim" />
        </div>
        <button type="button" className="fc-reset" onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); clearSize("sz-" + (pkey || "font")); const el = ref.current; if (el) { el.style.width = "660px"; el.style.height = "620px"; } }}
          title="Reset size">↺</button>
        <div className="fc-scroll" onPointerDown={noStop}>
          <div className="fc-title">{fs.title || "the font"}</div>
          <div className="fc-maker">handwriting by {fs.maker || "my dad"}</div>
          <p className="fc-story" style={{ fontFamily: "JacobMarker", fontSize: "19px" }}>{fs.story}</p>

          <div className="fc-sample">{fs.sample}</div>

          <div className="fc-preview">
            <div className="fc-label">try it</div>
            {editing ?
            <textarea ref={inputRef} className="fc-type" value={typed} placeholder=""
            onChange={(e) => setTyped(e.target.value)} onBlur={() => typed.trim() === "" && setEditing(false)} /> :
            <button className="fc-type fc-type-ghost" onClick={() => setEditing(true)} style={{ height: "50px", fontSize: "20px" }}>
                {typed.trim() ? typed : fs.previewPlaceholder || "type here"}
              </button>}
          </div>

          {scan &&
          <div className="fc-compare">
              <figure><div className="fc-scan"><CroppedImg value={scan} /></div><figcaption>original</figcaption></figure>
              <figure><div className="fc-digi">{fs.maker || "Lloyd Fogelhut"}</div><figcaption>digitized</figcaption></figure>
            </div>}

          <a className="fc-download" href={fs.fontFile || "fonts/jacob-custom.otf"} download={fs.downloadAs || "Lloyd Fogelhut.otf"}>
            ↓ download the font
          </a>
        </div>
      </div>
    </div>);

}

/* ----------------------------------------------------------------------
   Photo pile viewer
   ---------------------------------------------------------------------- */
function Photos({ onClose, gallery = [] }) {
  const total = gallery.length || PG.galleryCount || 6;
  const [i, setI] = useState(0);
  const url = gallery[i] || null;
  return (
    <div className="scrim" onPointerDown={(e) => e.target.classList.contains("scrim") && onClose()}>
      <div className="panel photos">
        <div className="photo-card">
          <div className="pc-img" style={url ? { backgroundImage: `url(${url})`, backgroundSize: "cover", backgroundPosition: "center", color: "transparent" } : null}>
            {url ? "" : `PHOTO ${i + 1} — COMING SOON`}
          </div>
          <div className="pc-cap">moments</div>
        </div>
        <div className="photo-nav">
          <button onClick={() => setI((i - 1 + total) % total)}>‹</button>
          <span className="pn-count">{i + 1} / {total}</span>
          <button onClick={() => setI((i + 1) % total)}>›</button>
        </div>
      </div>
    </div>);

}

/* ----------------------------------------------------------------------
   Album cover — a draggable polaroid on the desk. Click opens its viewer.
   (Drag vs click distinguished like Obj.)
   ---------------------------------------------------------------------- */
/* ----------------------------------------------------------------------
   PhotoFrame — the single merged desk object (replaces the 4 album
   polaroids). Shuffle-cycles through every uploaded photo across every
   album/category, cross-fading every 4s. Hover shows the CURRENT photo's
   category as a small marker-font caption. Click opens the GalleryViewer.
   ---------------------------------------------------------------------- */
function PhotoFrame({ categories, init, z, onOpen, pkey }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const p = getPos(pkey, init);
    // re-clamp the resolved (possibly stale-cached, from before the frame's
    // real ~460px-tall footprint was accounted for) position against the
    // CURRENT viewport every mount — a cached position from an older/buggier
    // layout must never be trusted blindly.
    const x = Math.max(0, Math.min(window.innerWidth - 360, p.x));
    const y = Math.max(54, Math.min(window.innerHeight - 470, p.y));
    el.style.left = x + "px";el.style.top = y + "px";
  }, []);
  const flat = useMemo(() => {
    const list = [];
    categories.forEach((c, ci) => c.photos.forEach((p) => list.push({ src: p, cat: ci })));
    for (let i = list.length - 1; i > 0; i--) {const j = Math.floor(Math.random() * (i + 1));[list[i], list[j]] = [list[j], list[i]];}
    return list;
  }, [categories]);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (flat.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % flat.length), 4000);
    return () => clearInterval(id);
  }, [flat.length]);
  const onDown = (e) => {
    e.preventDefault();
    const el = ref.current;el.classList.add("grab");bumpZ(el);
    const r = el.getBoundingClientRect();
    const sx = e.clientX,sy = e.clientY,ox = r.left,oy = r.top;let moved = 0;
    const move = (ev) => {
      moved += Math.abs(ev.movementX) + Math.abs(ev.movementY);
      el.style.left = Math.max(0, Math.min(window.innerWidth - 100, ox + ev.clientX - sx)) + "px";
      el.style.top = Math.max(64, Math.min(window.innerHeight - 120, oy + ev.clientY - sy)) + "px";
    };
    const up = () => {
      el.classList.remove("grab");
      window.removeEventListener("pointermove", move);window.removeEventListener("pointerup", up);
      savePos(pkey, parseInt(el.style.left, 10) || 0, parseInt(el.style.top, 10) || 0);
      if (moved < 6) onOpen({ rect: el.getBoundingClientRect(), photo: cur ? { src: cur.src, cat: cur.cat } : null });
    };
    window.addEventListener("pointermove", move);window.addEventListener("pointerup", up);
  };
  const cur = flat[idx];
  const catName = cur ? categories[cur.cat].name : null;
  return (
    <div className="obj photoframe-obj" ref={ref} style={{ width: 340, zIndex: z, "--rot": (init.rot || -3) + "deg" }} onPointerDown={onDown}>
      <span className="hint">click to open</span>
      <div className="pf-frame">
        <div className="pf-mat">
          <div className="pf-photo">
            {cur ? <CroppedImg key={idx} value={cur.src} /> : <div className="pf-empty">drop photos in the Media Manager</div>}
          </div>
        </div>
      </div>
      {catName && <div className="pf-cap-hover">{catName}</div>}
      <ScaleGrip pkey={"objscale:" + pkey} />
    </div>);

}

/* ----------------------------------------------------------------------
   GalleryViewer — a scrollable visual directory/index, dark + editorial:
   - a "main player" (like the project-page pattern) up top, holds whatever
     photo was showing on the desk frame at click-time
   - a sticky category rail under it (scroll-linked active highlight)
   - every category stacked below as a card banner (cover photo) + a
     horizontal-scrolling thumbnail row
   - clicking a thumbnail/banner opens the shared fullscreen enlarge view
     (shrinks back to its origin spot on close) and also updates the main
     player; clicking a category starts a 30s auto-shuffle within it;
     3 minutes fully idle resumes shuffling across every photo
   ---------------------------------------------------------------------- */
function ThumbRow({ photos, onPick }) {
  const trackRef = useRef(null);
  const scrollBy = (d) => {const el = trackRef.current;if (el) el.scrollBy({ left: d * 220, behavior: "smooth" });};
  return (
    <div className="gv-row">
      <button className="gv-row-arrow left" onClick={() => scrollBy(-1)} aria-label="Scroll left">‹</button>
      <div className="gv-row-track" ref={trackRef}>
        {photos.map((p, i) =>
        <button key={i} className="gv-thumb" onClick={(e) => onPick(p, i, e.currentTarget)}>
            <CroppedImg value={p} />
          </button>
        )}
      </div>
      <button className="gv-row-arrow right" onClick={() => scrollBy(1)} aria-label="Scroll right">›</button>
    </div>);

}

function GalleryViewer({ categories, fromPhoto, fromRect, onClose }) {
  const [closing, setClosing] = useState(false);
  const [cat, setCat] = useState(fromPhoto ? fromPhoto.cat : Math.max(0, categories.findIndex((c) => c.photos.length)));
  const [main, setMain] = useState(fromPhoto || { src: null, cat: 0 });
  const [mode, setMode] = useState("hold"); // hold | shuffle-cat | shuffle-all
  const [mainAspect, setMainAspect] = useState(1);
  const [enlarge, setEnlarge] = useState(null); // {idx, originRect} or null — always over the FULL flat photo list
  const [enlargeClosing, setEnlargeClosing] = useState(false);
  const lastInteract = useRef(Date.now());
  const mainRef = useRef(null);

  const flat = useMemo(() => {
    const list = [];
    categories.forEach((c, ci) => c.photos.forEach((p) => list.push({ src: p, cat: ci })));
    return list;
  }, [categories]);

  useEffect(() => {
    if (!main.src) return;
    const url = typeof main.src === "string" ? main.src : main.src.u;
    if (!url) return;
    const img = new Image();
    img.onload = () => {if (img.naturalWidth && img.naturalHeight) setMainAspect(img.naturalWidth / img.naturalHeight);};
    img.src = url;
  }, [main.src]);

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - lastInteract.current > 180000 && mode !== "shuffle-all") setMode("shuffle-all");
    }, 10000);
    return () => clearInterval(id);
  }, [mode]);

  useEffect(() => {
    if (mode !== "shuffle-all" || !flat.length) return;
    const id = setInterval(() => setMain(flat[Math.floor(Math.random() * flat.length)]), 4000);
    return () => clearInterval(id);
  }, [mode, flat]);

  useEffect(() => {
    if (mode !== "shuffle-cat") return;
    const photos = categories[cat].photos;
    if (!photos.length) return;
    const id = setInterval(() => setMain({ src: photos[Math.floor(Math.random() * photos.length)], cat }), 30000);
    return () => clearInterval(id);
  }, [mode, cat, categories]);

  const touch = () => {lastInteract.current = Date.now();};
  const pickThumb = (src, ci) => {touch();setMode("hold");setMain({ src, cat: ci });};
  const pickCategory = (ci) => {
    touch();setCat(ci);setMode("shuffle-cat");
    setMain({ src: categories[ci].photos[0] || null, cat: ci });
  };

  const openEnlarge = (photo, originEl) => {
    touch();
    const idx = flat.findIndex((f) => f.src === photo);
    if (idx < 0) return;
    setEnlarge({ idx, originRect: originEl ? originEl.getBoundingClientRect() : null });
  };
  const closeEnlarge = () => {
    setEnlargeClosing(true);
    setTimeout(() => {setEnlarge(null);setEnlargeClosing(false);}, 240);
  };
  const navEnlarge = (d) => setEnlarge((p) => p && { idx: (p.idx + d + flat.length) % flat.length, originRect: null });
  const jumpEnlarge = (idx) => setEnlarge((p) => p && { idx, originRect: null });
  const requestClose = () => {setClosing(true);setTimeout(onClose, 280);};

  // keyboard nav — only while the fullscreen enlarge view is open
  useEffect(() => {
    if (!enlarge) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") navEnlarge(-1);
      else if (e.key === "ArrowRight") navEnlarge(1);
      else if (e.key === "Escape" || e.key === "f" || e.key === "F") closeEnlarge();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enlarge, flat.length]);

  const panelStyle = fromRect ? {
    "--fx": fromRect.left + fromRect.width / 2 - window.innerWidth / 2 + "px",
    "--fy": fromRect.top + fromRect.height / 2 - window.innerHeight / 2 + "px",
    "--fs": Math.max(fromRect.width / Math.min(760, window.innerWidth * 0.92), 0.15)
  } : {};
  const enlargeStyle = (() => {
    const r = enlarge && enlarge.originRect;
    if (!r) return {};
    const bigW = Math.min(900, window.innerWidth * 0.88), bigH = Math.min(720, window.innerHeight * 0.78);
    return {
      "--ox": r.left + r.width / 2 - window.innerWidth / 2 + "px",
      "--oy": r.top + r.height / 2 - window.innerHeight / 2 + "px",
      "--os": Math.max(r.width / bigW, r.height / bigH, 0.12)
    };
  })();
  const curPhotos = categories[cat].photos;
  const curEnlarged = enlarge ? flat[enlarge.idx] : null;

  return (
    <div className={`gv-scrim ${closing ? "closing" : ""}`} onPointerDown={(e) => e.target.classList.contains("gv-scrim") && requestClose()}>
      <div className={`gv-panel ${closing ? "closing" : ""}`} style={panelStyle}>
        <button className="gv-x" onClick={requestClose} aria-label="Close">✕</button>

        <button className="gv-main" ref={mainRef} style={{ "--asp": mainAspect }}
        onClick={(e) => main.src && openEnlarge(main.src, e.currentTarget)}>
          {main.src ? <CroppedImg key={typeof main.src === "string" ? main.src : main.src.u} value={main.src} /> : <div className="gv-main-empty">no photos yet — add them in the Media Manager</div>}
        </button>

        <div className="gv-cats-grid">
          {categories.map((c, i) =>
          <div className="gv-section" key={i}>
              <button className={`gv-banner-sm ${cat === i ? "on" : ""}`} onClick={() => pickCategory(i)}>
                <div className="gv-banner-sm-pic">
                  {c.photos[0] ? <CroppedImg value={c.photos[0]} /> : <div className="gv-banner-sm-empty" />}
                </div>
                <span className="gv-banner-sm-name">{c.name}</span>
              </button>
              {c.photos.length ?
            <div className="gv-row gv-row-fade">
                  <ThumbRow photos={c.photos} onPick={(src) => pickThumb(src, i)} />
                </div> :

            <div className="gv-section-empty">no photos yet</div>}
            </div>
          )}
        </div>
      </div>
      {enlarge && curEnlarged &&
      <div className={`gv-enlarge ${enlargeClosing ? "closing" : ""}`} onPointerDown={(e) => e.target.classList.contains("gv-enlarge") && closeEnlarge()}>
          <button className="gv-nav gv-prev" onClick={() => navEnlarge(-1)} aria-label="Previous">‹</button>
          <div className="gv-big" style={enlargeStyle} key={enlarge.idx}><CroppedImg value={curEnlarged.src} /></div>
          <button className="gv-nav gv-next" onClick={() => navEnlarge(1)} aria-label="Next">›</button>
          <button className="gv-x gv-x2" onClick={closeEnlarge} aria-label="Close enlarged view (Esc / F)">✕</button>
          <div className="gv-fs-strip">
            {flat.map((f, i) =>
          <button key={i} className={`gv-fs-thumb ${i === enlarge.idx ? "on" : ""}`} onClick={() => jumpEnlarge(i)} aria-label={`Photo ${i + 1}`}>
                <CroppedImg value={f.src} />
              </button>
          )}
          </div>
        </div>}
    </div>);

}

/* ----------------------------------------------------------------------
   Scene layout — positions computed once on mount (reset on reload)
   ---------------------------------------------------------------------- */
function layout() {
  const W = window.innerWidth,H = window.innerHeight;
  const clampX = (x) => Math.max(20, Math.min(W - 180, x));
  const clampY = (y) => Math.max(96, Math.min(H - 210, y));
  // taller 4:5 portrait frame (~460px incl. border/mat/caption) needs a bigger budget than the old square album footprint
  const clampAX = (x) => Math.max(20, Math.min(W - 360, x));
  const clampAY = (y) => Math.max(96, Math.min(H - 470, y));
  return {
    monitor: { x: clampX(W * 0.5 - 75), y: clampY(H * 0.30) },
    radio: { x: clampX(W * 0.16), y: clampY(H * 0.58) },
    notebook: { x: clampX(W * 0.74), y: clampY(H * 0.30) },
    guestbook: { x: clampX(W * 0.78), y: clampY(H * 0.62) },
    star: { x: clampX(W * 0.40), y: clampY(H * 0.20) },
    smiley: { x: clampX(W * 0.64), y: clampY(H * 0.72) },
    squiggle: { x: clampX(W * 0.24), y: clampY(H * 0.28) },
    liveNote: { x: Math.max(16, W * 0.04), y: 88 },
    liveGuest: { x: Math.max(16, Math.min(W - 360, W * 0.63)), y: 88 },
    frame: { x: clampAX(W * 0.40), y: clampAY(H * 0.34), rot: -3 }
  };
}

const PG_DEFAULTS = /*EDITMODE-BEGIN*/{
  "desk": "marker",
  "wallpaper": "cycle",
  "markerNotes": true,
  "hpArt": "paper",
  "fcBlurTop": 2,
  "fcBlurBottom": 13,
  "fcGradStart": 35,
  "fcDim": 45,
  "fcTextStyle": "soft"
} /*EDITMODE-END*/;

/* ----------------------------------------------------------------------
   RADIO (mixes) PANEL + PLAYLISTS PANEL — draggable desk cards driven by the
   shared player (window.usePlayer). The bottom bar is the single home base;
   these panels are the on-desk expanded views.
   ---------------------------------------------------------------------- */
const fmtT = (s) => { if (!isFinite(s) || s < 0) s = 0; const m = Math.floor(s / 60), ss = Math.floor(s % 60); return m + ":" + String(ss).padStart(2, "0"); };

function MixPanel() {
  const p = window.usePlayer();
  const vizStyle = window.usePlayerTweak("vizStyle", "radial");
  if (!p || !p.mixPanel) return null;
  const stop = (e) => e.stopPropagation();
  return (
    <DeskCard className="dc-mix" init={{ x: 90, y: 96 }} z={32} pkey="mixpanel" title="radio" status="my mixes" onMin={() => p.setMixPanel(false)}>
      <div className="mp-now mono">{p.playing && p.isMix ? "● now playing" : "paused"}</div>
      <div className="mp-viz"><window.Visualizer style={vizStyle} real={p.isMix && p.playing} analyser={p.analyser} color={p.accent} /></div>
      <div className="mp-title">{p.mix ? p.mix.title : "—"}</div>
      <div className="mp-time mono">{fmtT(p.time)} / {fmtT(p.dur)}</div>
      <input className="mp-seek" type="range" min={0} max={p.dur || 0} step={0.1} value={Math.min(p.time, p.dur || 0)}
        onPointerDown={stop} onChange={(e) => p.seek(+e.target.value)} style={{ "--pct": (p.dur ? p.time / p.dur * 100 : 0) + "%" }} />
      <div className="mp-ctrls" onPointerDown={stop}>
        <button className="pb-ic" title="Previous mix" onClick={() => { p.toMix(true); p.prev(); }}>‹</button>
        <button className="pb-play" title={p.playing ? "Pause" : "Play"} onClick={() => { p.toMix(false); p.togglePlay(); }}>{p.playing && p.isMix ? "❚❚" : "►"}</button>
        <button className="pb-ic" title="Next mix" onClick={() => { p.toMix(true); p.next(); }}>›</button>
        <button className="pb-ic" title="Shuffle mixes" onClick={() => { p.toMix(false); p.shuffle(); }}>⚄</button>
        <input className="pbar-vol" type="range" min={0} max={1} step={0.02} value={p.volume} onChange={(e) => p.changeVolume(+e.target.value)} title="Volume" />
      </div>
    </DeskCard>);
}

function PlaylistPanel() {
  const p = window.usePlayer();
  if (!p || !p.plPanel) return null;
  const stop = (e) => e.stopPropagation();
  const pl = p.playlist;
  const active = p.srcType === "playlist";
  return (
    <DeskCard className="dc-playlists" init={{ x: 360, y: 96 }} z={32} pkey="plpanel" title="playlists" status={pl ? `${p.plIdx + 1}/${p.playlists.length}` : ""} onMin={() => p.setPlPanel(false)} resize={{ pkey: "sz-plpanel", min: { w: 300, h: 220 }, def: { w: 380 } }}>
      <div className="plp-name">{pl ? pl.name : "—"}</div>
      <div className="plp-embed" onPointerDown={stop}>
        {active && pl
          ? <iframe key={pl.embed} src={pl.embed} height={pl.kind === "apple" ? 175 : 152} allow="autoplay *; encrypted-media *;" loading="lazy" title={pl.name}></iframe>
          : <button className="plp-resume" onClick={() => p.toPlaylist(p.plIdx)}>▶ play this playlist</button>}
      </div>
      <div className="plp-row" onPointerDown={stop}>
        <button className="pb-ic" title="Previous playlist" onClick={() => p.toPlaylist(p.plIdx - 1)}>‹</button>
        <button className="pb-ic" title="Shuffle playlists" onClick={() => { let n = p.plIdx; if (p.playlists.length > 1) { do { n = Math.floor(Math.random() * p.playlists.length); } while (n === p.plIdx); } p.toPlaylist(n); }}>⚄</button>
        <button className="pb-ic" title="Next playlist" onClick={() => p.toPlaylist(p.plIdx + 1)}>›</button>
        {pl && pl.page && <a className="plp-open" href={pl.page} target="_blank" rel="noreferrer">open in app ↗</a>}
      </div>
      <div className="plp-note mono">press play in the embed · ~30s previews unless you're signed in</div>
    </DeskCard>);
}


/* ----------------------------------------------------------------------
   COMPUTER WINDOW — wraps XPDesktop. Opens ~half-screen, centered,
   draggable + resizable like the other desk panels, with a maximize
   button to go fullscreen. The rest of the desk stays interactive around
   it either way (it's just another positioned card, not a page overlay,
   unless maximized). Position/size persist in localStorage (survives
   closing the browser, not just a refresh) since it's meant to always be
   there rather than a one-off session thing.
   ---------------------------------------------------------------------- */
const COMPPOSKEY = "jf-pg-computer-pos";
function getCompPos(fallback) {
  try { const p = JSON.parse(localStorage.getItem(COMPPOSKEY) || "null"); if (p && typeof p.x === "number") return p; } catch (e) {}
  return fallback;
}
function saveCompPos(x, y) {
  try { localStorage.setItem(COMPPOSKEY, JSON.stringify({ x, y })); } catch (e) {}
}
function ComputerWindow({ onExit, marker, wallpaper, wallpaperCrop }) {
  const [max, setMax] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (max) return;
    const el = ref.current; if (!el) return;
    bumpZ(el);
    const dw = Math.round(window.innerWidth * 0.5), dh = Math.round(window.innerHeight * 0.5);
    const s = getSize("sz-computer");
    const w = (s && s.w) || dw, h = (s && s.h) || dh;
    el.style.width = w + "px"; el.style.height = h + "px";
    const p = getCompPos({ x: Math.round((window.innerWidth - w) / 2), y: Math.round((window.innerHeight - h) / 2) });
    el.style.left = p.x + "px"; el.style.top = p.y + "px";
    // eslint-disable-next-line
  }, [max]);
  const onDown = (e) => {
    e.preventDefault();
    const el = ref.current;el.classList.add("grab");bumpZ(el);
    const r = el.getBoundingClientRect();
    const sx = e.clientX,sy = e.clientY,ox = r.left,oy = r.top;
    const move = (ev) => {
      el.style.left = Math.max(0, Math.min(window.innerWidth - 120, ox + ev.clientX - sx)) + "px";
      el.style.top = Math.max(54, Math.min(window.innerHeight - 90, oy + ev.clientY - sy)) + "px";
    };
    const up = () => {
      el.classList.remove("grab");window.removeEventListener("pointermove", move);window.removeEventListener("pointerup", up);
      saveCompPos(parseInt(el.style.left, 10) || 0, parseInt(el.style.top, 10) || 0);
    };
    window.addEventListener("pointermove", move);window.addEventListener("pointerup", up);
  };
  if (max) {
    return <XPDesktop onExit={onExit} onRestore={() => setMax(false)} marker={marker} wallpaper={wallpaper} wallpaperCrop={wallpaperCrop} />;
  }
  return (
    <div className="comp-win" ref={ref} style={{ zIndex: 95 }}>
      <div className="comp-bar" onPointerDown={onDown}>
        <div className="comp-btns">
          <button onClick={() => setMax(true)} title="Maximize">▢</button>
          <button onClick={onExit} title="Close">✕</button>
        </div>
      </div>
      <div className="comp-body">
        <XPDesktop onExit={onExit} marker={marker} wallpaper={wallpaper} wallpaperCrop={wallpaperCrop} windowed />
      </div>
      <ResizeHandles pkey="sz-computer" min={{ w: 480, h: 360 }} />
    </div>);
}

function Playground() {
  const [t, setTweak] = useTweaks(PG_DEFAULTS, "jf-tweaks-pg");
  const [pos] = useState(layout); // computed once
  const [overlay, setOverlay] = useState(null); // (unused legacy modals)
  const [galleryOpen, setGalleryOpen] = useState(null); // fromRect (or true) or null
  const [fontOpen, setFontOpen] = useState(true); // font story panel open (#4)
  const [liveGuest, setLiveGuest] = useState(true); // guestbook open on the desk (#9)
  const [xp, setXp] = useState(true); // computer window is always open by default now
  const player = window.usePlayer();
  const slots = useMediaSlots();
  const categories = useMemo(() => {
    const names = PG.galleryCategoryNames || PG.albumNames || [];
    const out = [];
    for (let a = 0; a < 4; a++) {
      const photos = window.MediaSlots.collectCrops(slots, "alb:" + a + ":", 5);
      out.push({ a, name: names[a] || ("category " + (a + 1)), photos });
    }
    return out;
  }, [slots]);
  const walls = useMemo(() => window.MediaSlots.collectCrops(slots, "wall:", 12), [slots]);
  const cutRadio = useMemo(() => window.MediaSlots.crop(slots, "cutout:radio"), [slots]);
  const cutHeadphones = useMemo(() => window.MediaSlots.crop(slots, "cutout:headphones"), [slots]);
  const fontCover = useMemo(() => window.MediaSlots.crop(slots, "font:cover"), [slots]);
  const fontScan = useMemo(() => window.MediaSlots.crop(slots, "font:scan"), [slots]);
  const [wallPick, setWallPick] = useState(null);
  // pick a fresh wallpaper on load + whenever the computer is opened
  const rollWall = () => walls.length ? walls[Math.floor(Math.random() * walls.length)] : null;
  useEffect(() => {setWallPick((w) => w || rollWall());}, [walls]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.body.className = "pg-body";
    document.body.setAttribute("data-desk", t.desk);
    document.body.setAttribute("data-wall", t.wallpaper);
  }, [t.desk, t.wallpaper]);

  const clickRadio = () => player.openMixes();
  const clickHeadphones = () => player.openPlaylists();

  return (
    <>
      <MarkerFilter />
      <div className="desk">
        <Obj kind="squiggle" label="" size={80} init={pos.squiggle} z={3} pkey="squiggle" onClick={() => {}} />
        <Obj kind="star" label="" size={62} init={pos.star} z={3} pkey="star" onClick={() => {}} />
        <Obj kind="smiley" label="" size={60} init={pos.smiley} z={3} pkey="smiley" onClick={() => {}} />

        {!xp && <Obj kind="mycomputer" label="computer" hint="open" size={96} init={pos.monitor} z={8} pkey="monitor" onClick={() => setXp(true)} plainTag />}
        {/* computer window is a floating panel (see ComputerWindow) rather than an overlay, so it can stay open alongside this icon */}
        <Obj kind="radio" label="radio" hint="my mixes" size={168} init={pos.radio} z={8} pkey="radio" onClick={clickRadio} cutout={cutRadio} plainTag />
        <Obj kind="headphones" label="headphones" hint="playlists" size={118} init={{ x: Math.max(20, (pos.radio.x || 120) + 168), y: (pos.radio.y || 320) + 8 }} z={8} pkey="headphones" onClick={clickHeadphones} render={<HeadphonesArt style={t.hpArt} photo={cutHeadphones} size={118} />} />
        <MixPanel />
        <PlaylistPanel />
        {fontOpen ?
        <FontStory cover={fontCover} scan={fontScan} init={pos.liveNote} z={11} pkey="font" onMin={() => setFontOpen(false)} t={t} setTweak={setTweak} /> :
        <Obj kind="notebook" label="the font" hint="open" size={104} init={pos.liveNote} z={8} pkey="font" onClick={() => setFontOpen(true)} cutout={fontCover} plainTag />}
        {liveGuest ?
        <LiveGuest init={pos.liveGuest} z={11} pkey="guest" onMin={() => setLiveGuest(false)} /> :
        <Obj kind="guestbook" label="guestbook" hint="open" size={128} init={pos.liveGuest} z={8} pkey="guest" onClick={() => setLiveGuest(true)} plainTag />}
        <PhotoFrame categories={categories} init={pos.frame} z={9} pkey="frame" onOpen={(r) => setGalleryOpen(r || true)} />
      </div>

      <div className="pg-top">
        <a className="pg-back" href="#home">← back to work</a>
        <div>
          <div className="pg-title">the playground</div>
          <div className="pg-sub">drag stuff · click to play</div>
        </div>
      </div>

      {overlay === "notebook" && <Notebook marker={t.markerNotes} onClose={() => setOverlay(null)} />}
      {overlay === "guestbook" && <Guestbook onClose={() => setOverlay(null)} />}
      {galleryOpen && <GalleryViewer categories={categories} fromPhoto={galleryOpen && galleryOpen.photo} fromRect={galleryOpen && galleryOpen.rect} onClose={() => setGalleryOpen(null)} />}
      {xp && <ComputerWindow onExit={() => setXp(false)} marker={t.markerNotes} wallpaper={t.wallpaper} wallpaperCrop={wallPick} />}

      <TweaksPanel>
        <TweakSection label="Desk" />
        <TweakRadio label="Art style" value={t.desk}
        options={[{ value: "lineart", label: "Line-art" }, { value: "marker", label: "Marker" }, { value: "color", label: "Color" }]}
        onChange={(v) => setTweak("desk", v)} />
        <TweakRadio label="Headphones art" value={t.hpArt}
        options={[{ value: "drawing", label: "Drawing" }, { value: "marker", label: "Collage · marker" }, { value: "paper", label: "Collage · paper" }]}
        onChange={(v) => setTweak("hpArt", v)} />
        <TweakSection label="Computer" />
        <TweakRadio label="Wallpaper" value={t.wallpaper}
        options={[{ value: "bliss", label: "Bliss (XP)" }, { value: "cycle", label: "Cycle pics" }]}
        onChange={(v) => setTweak("wallpaper", v)} />
        <TweakToggle label="Marker font in notes" value={t.markerNotes} onChange={(v) => setTweak("markerNotes", v)} />
        <TweakSection label="Font panel background" />
        <TweakSlider label="Blur near top" value={t.fcBlurTop} min={0} max={10} step={1} unit="px" onChange={(v) => setTweak("fcBlurTop", v)} />
        <TweakSlider label="Blur near bottom" value={t.fcBlurBottom} min={0} max={30} step={1} unit="px" onChange={(v) => setTweak("fcBlurBottom", v)} />
        <TweakSlider label="Blur starts at" value={t.fcGradStart} min={0} max={90} step={5} unit="%" onChange={(v) => setTweak("fcGradStart", v)} />
        <TweakSlider label="Dim overlay" value={t.fcDim} min={0} max={85} step={5} unit="%" onChange={(v) => setTweak("fcDim", v)} />
        <TweakRadio label="Text style" value={t.fcTextStyle}
        options={[{ value: "soft", label: "Soft fade" }, { value: "glow", label: "Pure glow" }]}
        onChange={(v) => setTweak("fcTextStyle", v)} />
        <TweakSection label="Media" />
        <TweakButton label="Open Media Manager →" onClick={() => {window.location.href = "media.html";}} />
      </TweaksPanel>
    </>);

}

ReactDOM.createRoot;
window.PlaygroundApp = Playground;
