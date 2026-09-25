/* =========================================================================
   krinky.jsx — Krinky, the playground assistant.

   Hover makes him look over; clicking an item has him read it: he reads Jacob's blurbs (data.js →
   blurbs) verbatim, then pops a second bubble with a reaction of his own
   (data.js → krinky.*). One requestAnimationFrame loop, sampled down to
   12fps, drives every pose — walks, blinks and spins are stepped rather than
   smooth, on purpose.

   Two hard rules learned the hard way, both load-bearing:
   · the loop body is wrapped in try/catch and the frame is always re-queued,
     so one bad tick can never freeze him;
   · bubble staging is plain JS state (stage 0-3), never a delayed CSS
     animation — at 12fps a re-render would restart the delay forever and the
     speech would compute to opacity 0 for its whole life.

   Bits: wanders, walks to what he's talking about, gets stuck on window
   edges, falls asleep, gets squashed by an opening window, chases a wiggling
   cursor, gets shoved by a dragged window, ducks behind windows, trips,
   sunbathes on the taskbar, spins on the music.
   ========================================================================= */
(function () {
  const { useState, useEffect, useRef } = React;
  const DATA = window.PORTFOLIO_DATA || {};
  const FPS = 12, MS = 1000 / FPS;
  const SIZE = 72;
  const POS_KEY = "jf-krinky-pos";
  const MET_KEY = "jf-krinky-met";
  const IDLE_TICKS = 20 * FPS;      /* unprompted line after 20s */
  const SLEEP_TICKS = 60 * FPS;
  const SAY_MS = 6400;              /* both bubbles clear together */
  const BEAT_MS = 1100;             /* the reaction lands a beat later */
  const STAGE_MS = 90;              /* dot, bigger dot, balloon */

  const pool = (n) => ((DATA.krinky || {})[n] || []);
  const pick = (n) => { const a = pool(n); return a.length ? a[Math.floor(Math.random() * a.length)] : ""; };
  const blurb = (k) => ((DATA.blurbs || {})[k] || "");
  /* "watch" line with a random link from the videos pool. [brackets] mark the
     linked words; no brackets links the whole line. */
  const videoLine = () => {
    let url = pick("videos").trim(); if (!url) return "";
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    const line = pick("watch") || "you should watch [this video]";
    return /\[[^\]]+\](?!\()/.test(line) ? line.replace(/\[([^\]]+)\](?!\()/, (m, t) => "[" + t + "](" + url + ")") : "[" + line + "](" + url + ")";
  };

  function Krinky({ kind = "cursor", off, player }) {
    const [, setTick] = useState(0);
    const [bubbles, setBubbles] = useState([]);
    const hostRef = useRef(null);
    const playerRef = useRef(player);
    playerRef.current = player;
    const timers = useRef([]);
    const rects = useRef([]);
    const m = useRef({
      x: 0, y: 0, facing: 1, state: "idle", st: 0, t: 0, placed: false,
      target: null, brisk: false, pinned: false, behind: false, sun: false,
      idle: 0, blocked: 0, quietUntil: 0, sayAt: 0, talking: false,
      greeted: false, disc: null, drag: false, lastKey: ""
    });

    /* ---- say ---- */
    const stage = (id, s) => setBubbles((b) => b.map((x) => (x.id === id ? { ...x, stage: s } : x)));
    const say = (text, withReaction) => {
      if (!text) return;
      const mm = m.current;
      mm.idle = 0; mm.quietUntil = Date.now() + 1200; mm.sayAt = Date.now(); mm.talking = true; mm.hold = false;
      mm.sayMs = String(text).includes("](") ? SAY_MS * 2 : SAY_MS;
      if (mm.state === "sleep" || mm.state === "sun") { mm.state = "idle"; mm.target = null; }
      timers.current.forEach(clearTimeout); timers.current = [];
      const a = { text, id: mm.sayAt, stage: 0 };
      const list = [a];
      const react = withReaction ? pick("reaction") : "";
      if (react) list.push({ text: react, id: mm.sayAt + 1, stage: 0 });
      setBubbles(list);
      /* each bubble grows dot → dot → balloon on its own timers */
      list.forEach((b, i) => {
        const base = i * BEAT_MS;
        [1, 2, 3].forEach((s) => timers.current.push(setTimeout(() => stage(b.id, s), base + s * STAGE_MS)));
      });
    };
    const sayFor = (key) => { const b = blurb(key); b ? say(b, true) : say(pick("fallback")); };

    /* ---- the clock: created once, never torn down ---- */
    useEffect(() => {
      const mm = m.current;
      let raf = 0, acc = 0, last = performance.now(), dead = false;

      const host = () => (hostRef.current ? hostRef.current.parentElement : null);
      const box = () => ({ l: mm.x, t: mm.y, r: mm.x + SIZE, b: mm.y + SIZE });
      const hit = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

      const tick = (h) => {
        const W = h.clientWidth, H = h.clientHeight;
        /* Nothing runs against an unsized desk: on the first frame after a
           route swap the host can still measure 0, and clamping to it would
           destroy his restored position (and mm.placed would never re-read). */
        if (W < SIZE || H < SIZE) return;
        if (!mm.placed) {
          mm.placed = true;
          try {
            const p = JSON.parse(localStorage.getItem(POS_KEY) || "null");
            if (p) { mm.x = p.x; mm.y = p.y; mm.pinned = !!p.pinned; }
            else { mm.x = W - SIZE - 28; mm.y = H - SIZE - 24; }
          } catch (e) { mm.x = W - SIZE - 28; mm.y = H - SIZE - 24; }
        }
        /* always inside the desk, whatever was saved on a taller screen */
        mm.x = Math.max(0, Math.min(Math.max(0, W - SIZE), mm.x));
        mm.y = Math.max(0, Math.min(Math.max(0, H - SIZE), mm.y));

        mm.t++;
        const now = mm.t, P = playerRef.current;
        const prev = rects.current;
        rects.current = [...h.querySelectorAll(".dkw")]
          .filter((e) => e.style.display !== "none")
          .map((e) => ({ l: e.offsetLeft, t: e.offsetTop, r: e.offsetLeft + e.offsetWidth, b: e.offsetTop + e.offsetHeight }));

        /* a window dragged into him shoves him along */
        if (prev.length === rects.current.length && !mm.drag) {
          for (let i = 0; i < prev.length; i++) {
            const dx = rects.current[i].l - prev[i].l;
            if (dx && hit(box(), rects.current[i])) { mm.x += dx; mm.facing = dx > 0 ? 1 : -1; }
          }
        }
        /* ducks behind a window he is standing in, pops above to talk */
        mm.behind = !mm.talking && rects.current.some((r) => hit(box(), r));

        if (!mm.greeted && now > 2 * FPS) {
          mm.greeted = true;
          let met = false;
          try { met = !!localStorage.getItem(MET_KEY); localStorage.setItem(MET_KEY, "1"); } catch (e) {}
          say(pick(met ? "returning" : "greeting") || pick("greeting"));
        }
        if (mm.talking && !mm.hold && Date.now() - mm.sayAt > (mm.sayMs || SAY_MS)) { mm.talking = false; setBubbles([]); }

        mm.idle++;
        const quiet = Date.now() < mm.quietUntil;
        if (mm.state === "idle" || mm.state === "walk") {
          if (mm.idle > SLEEP_TICKS) { mm.state = "sleep"; mm.st = now; }
          else if (mm.idle > IDLE_TICKS && mm.idle % IDLE_TICKS === 0 && !quiet)
            say(P && P.playing && Math.random() < 0.5 ? pick("music") : (pool("videos").length && Math.random() < 0.35 ? videoLine() : pick("idle")));
        }
        if (mm.state === "squash" && now - mm.st > 8) mm.state = "idle";
        if (mm.state === "stuck" && now - mm.st > 18) { mm.x += mm.facing * -14; mm.state = "idle"; mm.target = null; }
        if (mm.state === "trip") {
          if (mm.disc) { mm.disc.x += mm.disc.v; mm.disc.v *= 0.86; }
          if (now - mm.st > 16) { if (mm.disc) { mm.x = mm.disc.x; mm.disc = null; } mm.state = "walk"; }
        }
        if (mm.state === "sun" && now - mm.st > 6 * FPS) { mm.state = "idle"; mm.target = null; }

        if (mm.state === "walk" && mm.target && !mm.drag) {
          const sp = mm.brisk ? 11 : 4;
          const dx = mm.target.x - mm.x, dy = mm.target.y - mm.y, d = Math.hypot(dx, dy) || 1;
          if (d < sp * 1.2) {
            mm.state = mm.sun ? "sun" : "idle"; mm.st = now; mm.sun = false; mm.target = null; mm.blocked = 0;
          } else {
            if (dx) mm.facing = dx > 0 ? 1 : -1;
            const nx = mm.x + (dx / d) * sp, ny = mm.y + (dy / d) * sp;
            const nb = { l: nx, t: ny, r: nx + SIZE, b: ny + SIZE };
            const inside = rects.current.some((r) => hit(box(), r));
            const wall = rects.current.find((r) => hit(nb, r));
            if (wall && !inside) {
              mm.blocked++;
              if (mm.blocked > 2 && Math.random() < 0.6) { mm.state = "stuck"; mm.st = now; }
              else {
                const up = Math.abs(mm.y - wall.t), dn = Math.abs(wall.b - mm.y);
                mm.y += up < dn ? -sp : sp;
                mm.x += (dx / d) * sp * 0.4;
              }
            } else { mm.x = nx; mm.y = ny; mm.blocked = 0; }
          }
        }

        /* idle drift: wander, sometimes go lie on the taskbar, sometimes trip */
        if (mm.state === "idle" && !mm.pinned && !mm.target && !mm.talking && now % (5 * FPS) === 0) {
          const r = Math.random();
          if (r < 0.18) { mm.sun = true; mm.target = { x: 30 + Math.random() * Math.max(40, W - 130), y: H - SIZE - 2 }; mm.brisk = false; mm.state = "walk"; }
          else if (r < 0.62) {
            mm.target = { x: 20 + Math.random() * Math.max(40, W - SIZE - 40), y: 20 + Math.random() * Math.max(40, H - SIZE - 40) };
            mm.brisk = false;
            if (Math.random() < 0.18) { mm.state = "trip"; mm.st = now; mm.disc = { x: mm.x, y: mm.y, v: mm.facing * 9 }; }
            else mm.state = "walk";
          }
        }
        setTick(now);
      };

      const frame = (ts) => {
        if (dead) return;
        try {
          acc += ts - last; last = ts;
          if (acc >= MS) {
            acc = Math.min(acc - MS, MS);
            const h = host();
            if (h) tick(h);
          }
        } catch (e) {
          window.__krinkyError = String((e && e.stack) || e);   /* never freeze on a bad tick */
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);

      /* ---- what makes him talk ---- */
      const goTo = (el) => {
        const h = host(); if (!h || mm.pinned || mm.drag) return;
        mm.target = {
          x: Math.max(0, Math.min(h.clientWidth - SIZE, el.offsetLeft + el.offsetWidth / 2 - SIZE / 2 + 40)),
          y: Math.max(0, Math.min(h.clientHeight - SIZE, el.offsetTop + el.offsetHeight / 2 - SIZE / 2 + 30))
        };
        mm.brisk = true; mm.sun = false;
        if (mm.state !== "stuck" && mm.state !== "trip") mm.state = "walk";
      };
      const onOver = (e) => {
        if (!e.target.closest) return;
        const tag = e.target.closest("[data-krinky]");
        const ic = tag ? null : e.target.closest(".dk-ic[data-app]");
        if (!tag && !ic) return;
        const key = tag ? tag.dataset.krinky : (ic.dataset.app === "font" ? "font" : "app:" + ic.dataset.app);
        /* hover only draws his eye; the blurb waits for a click */
        if (key === mm.lastKey && Date.now() - mm.lookAt < 2500) return;
        mm.lastKey = key; mm.lookAt = Date.now();
        goTo(tag ? (tag.closest(".dkw") || tag) : ic);
      };
      const onTap = (e) => {
        if (!e.target.closest) return;
        const tag = e.target.closest("[data-krinky]");
        const ic = tag ? null : e.target.closest(".dk-ic[data-app]");
        if (!tag && !ic) return;
        const key = tag ? tag.dataset.krinky : (ic.dataset.app === "font" ? "font" : "app:" + ic.dataset.app);
        mm.saidKey = key; mm.saidAt = Date.now();
        sayFor(key);
        goTo(tag ? (tag.closest(".dkw") || tag) : ic);
      };
      const onMove = (e) => {
        const h = host(); if (!h) return;
        mm.idle = 0;
        if (mm.state === "sleep") { mm.state = "idle"; mm.target = null; }
        const r = h.getBoundingClientRect();
        const px = e.clientX - r.left, py = e.clientY - r.top;
        const near = Math.hypot(px - (mm.x + SIZE / 2), py - (mm.y + SIZE / 2));
        if (near < 190 && !mm.pinned && !mm.drag && mm.state !== "stuck" && Math.random() < 0.08) {
          mm.target = { x: px - SIZE / 2, y: py - SIZE / 2 }; mm.brisk = true; mm.state = "walk";
        }
      };
      const onKrinky = (e) => {
        const d = e.detail || {};
        if (d.kind === "open") {
          if (d.el) {
            const b = { l: d.el.offsetLeft, t: d.el.offsetTop, r: d.el.offsetLeft + d.el.offsetWidth, b: d.el.offsetTop + d.el.offsetHeight };
            if (hit(box(), b)) { mm.state = "squash"; mm.st = mm.t; } else goTo(d.el);
          }
          /* the click that opened it already had him read the blurb */
          if (!(mm.saidKey === d.key && Date.now() - mm.saidAt < 1500)) {
            const own = blurb(d.key);
            own ? say(own, true) : say(pick("open"));
          }
        }
        if (d.kind === "viz") say(pick("viz"));
        if (d.kind === "hover") sayFor(d.key);
      };

      document.addEventListener("pointerover", onOver, true);
      document.addEventListener("click", onTap, true);
      document.addEventListener("pointermove", onMove, true);
      window.addEventListener("krinky", onKrinky);
      return () => {
        dead = true; cancelAnimationFrame(raf);
        timers.current.forEach(clearTimeout);
        document.removeEventListener("pointerover", onOver, true);
        document.removeEventListener("click", onTap, true);
        document.removeEventListener("pointermove", onMove, true);
        window.removeEventListener("krinky", onKrinky);
      };
    }, []);

    /* ---- drag / pin / click ---- */
    const remember = () => {
      const mm = m.current;
      try { localStorage.setItem(POS_KEY, JSON.stringify({ x: mm.x, y: mm.y, pinned: mm.pinned })); } catch (e) {}
    };
    const onDown = (e) => {
      e.stopPropagation();
      const mm = m.current, h = hostRef.current.parentElement;
      const sx = e.clientX, sy = e.clientY, ox = mm.x, oy = mm.y;
      let moved = false;
      const move = (ev) => {
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 4) return;
        moved = true; mm.drag = true; mm.target = null; mm.state = "idle";
        mm.x = Math.max(0, Math.min(h.clientWidth - SIZE, ox + ev.clientX - sx));
        mm.y = Math.max(0, Math.min(h.clientHeight - SIZE, oy + ev.clientY - sy));
      };
      const up = () => {
        window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
        mm.drag = false;
        if (moved) remember(); else say(pick("click"));
      };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    };
    const onDbl = (e) => {
      e.stopPropagation();
      const mm = m.current;
      mm.pinned = !mm.pinned;
      if (mm.pinned) { mm.target = null; mm.state = "idle"; }
      remember();
      say(mm.pinned ? "Fine. I'll stay." : "Free at last.");
    };

    const mm = m.current;
    const spin = !off && kind !== "cursor" && (mm.talking || !!(player && player.playing));
    /* the desk clips its overflow, so bubbles are placed from measured room */
    const h = hostRef.current ? hostRef.current.parentElement : null;
    const HW = h ? h.clientWidth : 1200, HH = h ? h.clientHeight : 700;
    /* With Krinky sent away, the lines still work: they pop as one big
       balloon parked in his corner, with no character attached. */
    const kx = off ? HW - 40 : mm.x, ky = off ? HH - 34 : mm.y;
    const BW = off ? 340 : 288;
    const flip = kx + SIZE + BW > HW - 8;
    /* Room above him? Then the stack grows upward from just over his head,
       otherwise downward. Either way ONE flex container stacks the bubbles so
       the browser spaces them by their real heights — a fixed step used to
       overlap the moment a blurb ran to three lines. */
    const upward = off || ky > 150;
    const bx = Math.max(6, flip ? kx + 14 - BW : Math.min(HW - BW - 6, kx + SIZE - 14));
    const stack = upward
      ? { left: bx, bottom: Math.max(8, HH - ky + (off ? -18 : 22)), width: BW, flexDirection: "column-reverse" }
      : { left: bx, top: ky + SIZE + 6, width: BW, flexDirection: "column" };
    return (
      <React.Fragment>
        <div ref={hostRef} className={`kr ${off ? "gone" : ""} ${mm.behind ? "behind" : ""} ${mm.pinned ? "pinned" : ""}`}
          style={{ left: off ? HW - 2 : mm.x, top: off ? HH - 2 : mm.y, width: SIZE, height: SIZE }}
          onPointerDown={onDown} onDoubleClick={onDbl} title="Krinky. Drag him, double-click to pin.">
          {!off && <window.KrinkyArt kind={kind} state={mm.state} frame={mm.t} facing={mm.facing} spin={spin} size={SIZE} />}
          {!off && mm.state === "sleep" && <span className="kr-zzz">z<i>z</i><b>z</b></span>}
        </div>
        {!off && mm.disc && <span className="kr-loose" style={{ left: mm.disc.x + 18, top: mm.disc.y + 44 }} />}
        {bubbles.some((b) => b.stage > 0) &&
          <div className={`kr-stack ${flip ? "flip" : ""} ${off ? "solo" : ""}`} style={stack}>
            {bubbles.filter((b) => b.stage > 0).map((b, i) =>
              <div key={b.id} className={`kr-bubble ${i ? "second" : ""}`}>
                <span className="kr-dot a" />
                {b.stage > 1 && <span className="kr-dot b" />}
                {b.stage > 2 && <div className="kr-bal" onPointerEnter={() => { mm.hold = true; }} onPointerLeave={() => { mm.hold = false; mm.sayAt = Date.now() - (mm.sayMs || SAY_MS) + 2500; }}>{String(b.text).includes("](") && window.linkify ? window.linkify(b.text) : (window.plainText ? window.plainText(b.text) : b.text)}</div>}
              </div>)}
          </div>}
      </React.Fragment>);
  }

  window.Krinky = Krinky;
  window.krinkySay = (detail) => window.dispatchEvent(new CustomEvent("krinky", { detail }));
})();
