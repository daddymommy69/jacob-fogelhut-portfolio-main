/* =========================================================================
   JACOB FOGELHUT — Motion library
   Shared animation primitives for the main site. Exported to window so app.jsx
   can use them. Everything respects prefers-reduced-motion AND the global
   motion-intensity level (window.__MOTION.level, 0..1).
   ========================================================================= */
const { useState, useEffect, useRef, useLayoutEffect } = React;

const EASE = "cubic-bezier(0.65, 0, 0.35, 1)"; // ease-in-out (the curve Jacob picked)

// global motion state — App keeps this in sync with the Tweak + media query
window.__MOTION = window.__MOTION || { level: 0.45, reduced: false };
const M = window.__MOTION;
const reduced = () =>
M.reduced || window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = () => window.matchMedia && window.matchMedia("(pointer: fine)").matches;

/* ---------------------------------------------------------------------
   Collapse — animates height 0 ⇄ auto the RIGHT way (measure, transition,
   settle to auto). No max-height guessing. `feel` drives the inner entrance.
   --------------------------------------------------------------------- */
function Collapse({ open, feel = "accordion", children }) {
  const outer = useRef(null);
  const inner = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const dur = reduced() ? 1 : 580;
    el.style.transition = `height ${dur}ms ${EASE}`;

    if (open) {
      const h = inner.current.scrollHeight;
      el.style.height = h + "px";
      const onEnd = (e) => {
        if (e.target === el && e.propertyName === "height") {
          el.style.height = "auto";
          el.removeEventListener("transitionend", onEnd);
        }
      };
      el.addEventListener("transitionend", onEnd);
    } else {
      if (first.current) {
        el.style.height = "0px";
      } else {
        el.style.height = el.scrollHeight + "px";
        el.offsetHeight; // reflow
        requestAnimationFrame(() => {el.style.height = "0px";});
      }
    }
    first.current = false;
  }, [open]);

  return (
    <div ref={outer} className="collapse" style={{ height: 0, overflow: "hidden" }}>
      <div ref={inner} className={`collapse-inner feel-${feel} ${open ? "open" : ""}`}>
        {children}
      </div>
    </div>);

}

/* ---------------------------------------------------------------------
   Reveal — fade + rise into view on scroll. Falls back to instant when
   motion is off / reduced.
   --------------------------------------------------------------------- */
function Reveal({ children, className = "", delay = 0, style }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (reduced() || M.level < 0.08) {setSeen(true);return;}
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => {if (e.isIntersecting) {setSeen(true);io.disconnect();}}),
      { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal-up ${seen ? "in" : ""} ${className}`}
    style={{ ...style, transitionDelay: seen ? `${delay}ms` : "0ms" }}>
      {children}
    </div>);

}

/* ---------------------------------------------------------------------
   useMagnetic — element leans toward the cursor, springs back on leave.
   --------------------------------------------------------------------- */
function useMagnetic(strength = 0.4) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced() || !fine()) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      const k = strength * (0.5 + M.level);
      el.style.transform = `translate(${mx * k}px, ${my * k}px)`;
    };
    const onLeave = () => {el.style.transform = "";};
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [strength]);
  return ref;
}

/* ---------------------------------------------------------------------
   blur-up Img — low-res-feel blur that resolves when the file loads.
   --------------------------------------------------------------------- */
function Img({ src, alt = "", className = "", zoom = false }) {
  const [loaded, setLoaded] = useState(false);
  if (!src) return null;
  return (
    <img src={src} alt={alt} loading="lazy"
    className={`blurup ${zoom ? "zoom" : ""} ${className} ${loaded ? "loaded" : ""}`}
    onLoad={() => setLoaded(true)} style={{ objectFit: "contain" }} />);

}

/* ---------------------------------------------------------------------
   flipFrom — animate `el` FROM a previously-captured rect to its current
   layout position (shared-element zoom). Used by the full-page open.
   --------------------------------------------------------------------- */
function flipFrom(el, fromRect, dur = 580) {
  if (!el || !fromRect || reduced()) return;
  const to = el.getBoundingClientRect();
  if (!to.width || !to.height) return;
  const dx = fromRect.left - to.left;
  const dy = fromRect.top - to.top;
  const sx = fromRect.width / to.width;
  const sy = fromRect.height / to.height;
  el.style.transformOrigin = "top left";
  el.style.transition = "none";
  el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  el.getBoundingClientRect(); // reflow
  requestAnimationFrame(() => {
    el.style.transition = `transform ${dur}ms ${EASE}`;
    el.style.transform = "";
    const clear = () => {el.style.transition = "";el.style.transformOrigin = "";el.removeEventListener("transitionend", clear);};
    el.addEventListener("transitionend", clear);
  });
}

/* ---------------------------------------------------------------------
   CursorThumb — a single floating thumbnail that trails the cursor with
   spring lag. Rows call window.__cursorThumb.show(item) / .hide().
   --------------------------------------------------------------------- */
function CursorThumb() {
  const ref = useRef(null);
  const [item, setItem] = useState(null);
  const st = useRef({ x: 0, y: 0, tx: 0, ty: 0, vis: false });

  useEffect(() => {
    if (reduced() || !fine()) return;
    st.current.x = st.current.tx = window.innerWidth / 2;
    st.current.y = st.current.ty = window.innerHeight / 2;
    const onMove = (e) => {st.current.tx = e.clientX;st.current.ty = e.clientY;};
    window.addEventListener("pointermove", onMove);
    let raf;
    const tick = () => {
      const s = st.current;
      s.x += (s.tx - s.x) * 0.16;
      s.y += (s.ty - s.y) * 0.16;
      if (ref.current)
      ref.current.style.transform =
      `translate(${s.x}px, ${s.y}px) translate(-50%, -50%) scale(${s.vis ? 1 : 0.5}) rotate(${s.vis ? -4 : 0}deg)`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    window.__cursorThumb = {
      show: (it) => {setItem(it);st.current.vis = true;ref.current && ref.current.classList.add("on");},
      hide: () => {st.current.vis = false;ref.current && ref.current.classList.remove("on");} };

    return () => {window.removeEventListener("pointermove", onMove);cancelAnimationFrame(raf);delete window.__cursorThumb;};
  }, []);

  return (
    <div ref={ref} className="cursor-thumb" aria-hidden="true">
      {item &&
      <div className="ct-inner">
          <div className="ct-img">
            {item.still ? <img src={item.still} alt="" /> : <span className="ct-block" />}
          </div>
          <div className="ct-name">{item.client || item.title}</div>
        </div>
      }
    </div>);

}

/* =====================================================================
   INTRO — 3 toggleable concepts. Plays, then calls onDone.
   concept ∈ photoCycle | markerDraw | heroSlam
   ===================================================================== */
const INTRO_PALETTE = ["#9c7a3c", "#a8623a", "#5d6b4e", "#4a5a6a", "#7a6f63", "#8a4f3a"];

function IntroFrame({ frame, i }) {
  if (frame) return <img className="if-img" src={frame} alt="" />;
  return <span className="if-block" style={{ background: INTRO_PALETTE[i % INTRO_PALETTE.length] }} />;
}

function Intro({ concept = "photoCycle", frames = [], name = "Jacob Fogelhut", seconds = 2, onDone }) {
  const [phase, setPhase] = useState("run"); // run -> out
  const [idx, setIdx] = useState(0);
  const list = frames.length ? frames : [null, null, null, null, null, null];

  useEffect(() => {
    if (reduced()) {const t = setTimeout(onDone, 220);return () => clearTimeout(t);}
    const total = Math.max(1.2, seconds) * 1000;
    const timers = [];

    if (concept === "photoCycle") {
      const step = Math.max(70, Math.round(total * 0.78 / Math.max(8, list.length * 2)));
      const id = setInterval(() => setIdx((i) => (i + 1) % list.length), step);
      timers.push(() => clearInterval(id));
      timers.push(setTimeout(() => setPhase("out"), total - 480));
    } else if (concept === "heroSlam") {
      timers.push(setTimeout(() => setPhase("out"), total - 460));
    } else {// markerDraw
      timers.push(setTimeout(() => setPhase("out"), total - 460));
    }
    timers.push(setTimeout(onDone, total));
    return () => timers.forEach((t) => typeof t === "function" ? t() : clearTimeout(t));
  }, []);

  const firstReal = list.find((f) => f) || null;

  return (
    <div className={`intro intro-${concept} ${phase === "out" ? "out" : ""}`}>
      {concept === "photoCycle" &&
      <div className="intro-stage">
          <div className="intro-frames">
            {list.map((f, i) =>
          <span key={i} className={`intro-frame ${i === idx ? "show" : ""}`}><IntroFrame frame={f} i={i} /></span>
          )}
          </div>
          <div className="intro-veil" />
          <h1 className="intro-name">{name}</h1>
        </div>
      }

      {concept === "heroSlam" &&
      <div className="intro-stage">
          <div className="intro-hero"><IntroFrame frame={firstReal} i={0} /></div>
          <div className="intro-veil" />
          <h1 className="intro-name slam">{name}</h1>
        </div>
      }

      {concept === "markerDraw" &&
      <div className="intro-stage plain">
          <h1 className="intro-name draw">{name}</h1>
        </div>
      }
    </div>);

}

Object.assign(window, {
  EASE_MOTION: EASE,
  motionReduced: reduced,
  Collapse, Reveal, useMagnetic, Img, flipFrom, CursorThumb, Intro });