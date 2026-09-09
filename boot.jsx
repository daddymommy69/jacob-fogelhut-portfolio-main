/* =========================================================================
   boot.jsx — first-visit loading gate + quiet media warming.

   Boot: black screen, marker-font name, % counter underneath. Preloads the
   intro frames so the photo-cycle plays with real photos instead of color
   blocks. Hard cap (default 4s) — after that the site opens with whatever
   arrived. Shown on the FIRST visit only; afterwards the intro plays as normal.

   window.MediaWarm: a small sequential queue that buffers the first ~1.2s of
   each hover video AFTER the intro is over, so hovering a project card starts
   moving immediately instead of stalling on a slow connection.
   ========================================================================= */
const { useState, useEffect, useRef, useCallback } = React;

/* ---------- quiet video warming ---------- */
window.MediaWarm = (function () {
  const seen = new Set();
  const queue = [];
  let started = false, running = 0;
  const conn = navigator.connection || {};
  const allowed = () => !conn.saveData && !/(^|-)2g$/.test(conn.effectiveType || "");

  function warm(url, done) {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    let over = false;
    const stop = () => {
      if (over) return; over = true;
      clearTimeout(cap);
      try { v.removeAttribute("src"); v.load(); } catch (e) {}
      done();
    };
    const cap = setTimeout(stop, 7000);
    v.addEventListener("progress", () => {
      try { if (v.buffered.length && v.buffered.end(0) >= 1.2) stop(); } catch (e) {}
    });
    v.addEventListener("error", stop);
    v.src = url;
  }

  function pump() {
    if (!started || !allowed()) return;
    while (running < 2 && queue.length) {
      running++;
      warm(queue.shift(), () => { running--; pump(); });
    }
  }

  return {
    add(url) { if (!url || seen.has(url)) return; seen.add(url); queue.push(url); pump(); },
    start() { if (started) return; started = true; setTimeout(pump, 700); }
  };
})();

/* ---------- first-visit boot screen ---------- */
const BOOT_KEY = "jf-booted-v1";
window.bootAlreadySeen = function () {
  try { return localStorage.getItem(BOOT_KEY) === "1"; } catch (e) { return false; }
};

function Boot({ frames = [], ready = false, name = "Jacob Fogelhut", maxWait = 4000, onDone }) {
  const [pct, setPct] = useState(0);
  const [out, setOut] = useState(false);
  const target = useRef(0);
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setPct(100); setOut(true);
    try { localStorage.setItem(BOOT_KEY, "1"); } catch (e) {}
    setTimeout(() => onDone && onDone(), 520);
  }, [onDone]);

  // hard cap — never hold anyone longer than this
  useEffect(() => { const id = setTimeout(finish, maxWait); return () => clearTimeout(id); }, []);

  // preload the intro frames once the slot data has resolved
  useEffect(() => {
    if (!ready) return undefined;
    const list = [...new Set((frames || []).filter(Boolean))].slice(0, 14);
    if (!list.length) { target.current = 1; const id = setTimeout(finish, 250); return () => clearTimeout(id); }
    let live = true, n = 0;
    const bump = () => {
      if (!live) return;
      n++; target.current = n / list.length;
      if (n >= list.length) finish();
    };
    list.forEach((src) => {
      const im = new Image();
      im.onload = bump; im.onerror = bump;
      im.src = src;
    });
    return () => { live = false; };
  }, [ready, frames]);

  // smooth climb toward whatever has actually finished
  useEffect(() => {
    const id = setInterval(() => setPct((p) => {
      if (done.current) return 100;
      const t = 5 + target.current * 94;
      return p < t ? Math.min(t, p + Math.max(0.7, (t - p) * 0.13)) : Math.min(99, p + 0.12);
    }), 40);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`boot ${out ? "out" : ""}`} aria-label="Loading">
      <div className="boot-inner">
        <h1 className="boot-name">{name}</h1>
        <div className="boot-pct">{Math.round(pct)}%</div>
      </div>
    </div>);
}

Object.assign(window, { Boot });
