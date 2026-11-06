/* =========================================================================
   desk-viz.jsx — the corner player's visualizer. Eight modes, spectrum
   colour by intensity, glow + motion trails, with grain and scanline
   overlays on dials (Jacob's choice: smooth shapes, not 8-bit blocks).

   Real audio drives it when a mix is playing (frequency data for the
   spectral modes, time-domain for the wave/scope); otherwise it runs a calm
   breath so the panel is never dead.

   DANCER (Nov 2026): a club. DJ at the decks in back (dice on the booth in
   Bay Area team colours), the dancer up front in a Kangol and shades, crowd
   silhouettes along the bottom, stage lights overhead. A kick-drum detector
   keeps the dancer on the beat; moves rotate every 16 beats (head nod,
   two-step, hands up, house shuffle, hyphy) and a drop gets a jump + spin.
   Energy is kept on the chill side on purpose.
   SPEAKER: a cabinet whose woofer pumps on the low end.
   SCOPE: a CRT oscilloscope trace with phosphor persistence.
   ========================================================================= */
(function () {
  const { useRef, useEffect } = React;
  const KINDS = ["radial", "bars", "wave", "grid", "dancer", "stars", "speaker", "scope"];
  const ramp = (v) => "hsl(" + (140 - 140 * Math.min(1, Math.max(0, (v - 0.25) / 0.7))) + " 85% " + (45 + 25 * v) + "%)";
  const TAU = Math.PI * 2;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const sstep = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

  /* Bay Area dice: [body, pips, face] */
  const DICE = [["#1D428A", "#FFC72C", 5], ["#AA0000", "#B3995D", 3], ["#FD5A1E", "#111111", 6], ["#003831", "#EFB21E", 2], ["#101010", "#A5ACAF", 4]];
  const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };

  /* ---------------- dance moves ----------------
     Each returns a pose. Angles in radians, 0 = limb hanging straight down,
     positive swings toward screen-right. ph = 0..1 through the beat (0 = on
     the kick), n = beats counted, a = amplitude. */
  const REST = { sx: 0, lean: 0, nod: 0, lsh: -0.14, lel: 0.3, rsh: 0.14, rel: -0.3, lhip: -0.07, lkn: 0.1, rhip: 0.07, rkn: -0.1 };
  const MOVES = {
    nod(ph, n, a) {
      const dip = (1 + Math.cos(ph * TAU)) / 2;
      return { sx: 0, lean: 0.03 * dip * a, nod: 0.5 * dip * a, lsh: -0.4 - 0.12 * dip * a, lel: 1.5, rsh: 0.4 + 0.12 * dip * a, rel: -1.5,
        lhip: -0.1 - 0.22 * dip * a, lkn: 0.45 * dip * a, rhip: 0.1 + 0.22 * dip * a, rkn: -0.45 * dip * a };
    },
    twostep(ph, n, a) {
      const dip = (1 + Math.cos(ph * TAU)) / 2, sh = Math.sin(Math.PI * (n + ph));
      return { sx: 2.6 * sh * a, lean: -0.07 * sh * a, nod: 0.3 * dip * a,
        lsh: -0.3 + 0.4 * sh * a, lel: 1.25, rsh: 0.3 + 0.4 * sh * a, rel: -1.25,
        lhip: -0.1 - 0.28 * Math.max(0, -sh) * a - 0.1 * dip * a, lkn: 0.3 * dip * a + 0.25 * Math.max(0, sh) * a,
        rhip: 0.1 + 0.28 * Math.max(0, sh) * a + 0.1 * dip * a, rkn: -0.3 * dip * a - 0.25 * Math.max(0, -sh) * a };
    },
    handsup(ph, n, a) {
      const dip = (1 + Math.cos(ph * TAU)) / 2, wave = Math.sin(Math.PI * (n + ph));
      return { sx: 0.6 * wave * a, lean: 0, nod: 0.25 * dip * a,
        lsh: -2.7 + 0.32 * wave * a, lel: -0.28, rsh: 2.7 + 0.32 * wave * a, rel: 0.28,
        lhip: -0.1 - 0.2 * dip * a, lkn: 0.4 * dip * a, rhip: 0.1 + 0.2 * dip * a, rkn: -0.4 * dip * a };
    },
    shuffle(ph, n, a) {
      const lift = Math.sin(Math.PI * ph), left = n % 2 === 0, k = lift * a;
      const pump = Math.sin(Math.PI * (n + ph));
      return { sx: (left ? 1 : -1) * 0.9 * k, lean: (left ? 0.06 : -0.06) * k, nod: 0.25 * lift * a,
        lsh: -0.35 + 0.35 * pump * a, lel: 1.7, rsh: 0.35 + 0.35 * pump * a, rel: -1.7,
        lhip: left ? -0.18 - 0.55 * k : -0.08, lkn: left ? 0.95 * k : 0.2 * a,
        rhip: left ? 0.08 : 0.18 + 0.55 * k, rkn: left ? -0.2 * a : -0.95 * k };
    },
    hyphy(ph, n, a) {
      const dip = (1 + Math.cos(ph * TAU)) / 2, s = Math.sin(ph * TAU), sway = Math.sin(Math.PI * (n + ph));
      return { sx: 1.4 * sway * a, lean: 0.2 * sway * a - 0.05, nod: 0.7 * dip * a,
        lsh: -1.25 - 0.55 * s * a, lel: -0.7 - 0.5 * dip * a, rsh: 1.25 + 0.55 * Math.sin(ph * TAU + 1.6) * a, rel: 0.7 + 0.5 * dip * a,
        lhip: -0.16 - 0.3 * dip * a, lkn: 0.6 * dip * a, rhip: 0.16 + 0.3 * dip * a, rkn: -0.6 * dip * a };
    }
  };
  const MOVE_LIST = ["nod", "twostep", "handsup", "shuffle", "hyphy"];

  /* forward kinematics + draw one figure. Returns the head centre. */
  function drawFigure(g, cx, ground, s, P, o) {
    const sc = o.scaleX == null ? 1 : o.scaleX;
    const TH = 7 * s, SH = 7 * s, TO = 10.5 * s, UA = 5 * s, FA = 4.6 * s, HR = 2.5 * s, NK = 1.5 * s;
    const dir = (ang, L) => [Math.sin(ang) * L, Math.cos(ang) * L];
    const leg = (hx, a1, a2) => { const k = dir(a1, TH), f = dir(a1 + a2, SH); return { k: [hx + k[0], k[1]], f: [hx + k[0] + f[0], k[1] + f[1]] }; };
    const L = leg(-1.3 * s, P.lhip, P.lkn), R = leg(1.3 * s, P.rhip, P.rkn);
    const hipY = ground - Math.max(L.f[1], R.f[1]) - (o.jump || 0);
    const hx = (P.sx || 0) * s;
    const X = (x) => cx + (hx + x) * sc;
    const Y = (y) => hipY + y;
    const shC = [Math.sin(P.lean) * TO, -Math.cos(P.lean) * TO];
    const nk = [shC[0] + Math.sin(P.lean) * NK, shC[1] - Math.cos(P.lean) * NK];
    const head = [nk[0] + Math.sin(P.lean) * HR, nk[1] - HR + (P.nod || 0) * 1.1 * s];
    const arm = (sx, a1, a2) => { const sh = [shC[0] + sx, shC[1] + 0.4 * s], e = dir(a1, UA), h = dir(a1 + a2, FA); return [sh, [sh[0] + e[0], sh[1] + e[1]], [sh[0] + e[0] + h[0], sh[1] + e[1] + h[1]]]; };
    const LA = arm(-2.3 * s, P.lsh, P.lel), RA = arm(2.3 * s, P.rsh, P.rel);
    g.lineCap = "round"; g.lineJoin = "round";
    g.beginPath();
    const pl = (pts) => { pts.forEach((p, i) => (i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])))); };
    pl([[-1.3 * s, 0], L.k, L.f]); pl([[1.3 * s, 0], R.k, R.f]);
    pl([[-1.3 * s, 0], [1.3 * s, 0]]);
    pl([[0, 0], shC, nk]);
    pl([[shC[0] - 2.3 * s, shC[1] + 0.4 * s], [shC[0] + 2.3 * s, shC[1] + 0.4 * s]]);
    pl(LA); pl(RA);
    g.stroke();
    const hX = X(head[0]), hY = Y(head[1]);
    g.beginPath(); g.arc(hX, hY, HR, 0, TAU); g.fill();
    if (o.props) o.props(hX, hY, HR, sc, { LA: LA.map((p) => [X(p[0]), Y(p[1])]), RA: RA.map((p) => [X(p[0]), Y(p[1])]) });
    return [hX, hY];
  }

  /* Kangol (504-style flat cap) + shades on the dancer */
  function dancerProps(g, col) {
    return (hx, hy, r, sc) => {
      const prevBlur = g.shadowBlur; g.shadowBlur = 0;
      const w = Math.abs(sc);
      g.fillStyle = "#151311"; g.strokeStyle = col; g.lineWidth = Math.max(1, r * 0.28);
      g.beginPath();
      g.ellipse(hx, hy - r * 0.55, r * 1.18 * Math.max(0.55, w), r * 0.62, 0, Math.PI, TAU);
      g.lineTo(hx + r * 1.25 * Math.max(0.55, w), hy - r * 0.42);
      g.lineTo(hx - r * 1.25 * Math.max(0.55, w), hy - r * 0.42);
      g.closePath(); g.fill(); g.stroke();
      if (sc > 0.25) {
        const gw = r * 0.72 * sc, gy = hy - r * 0.02;
        g.fillStyle = "#050505";
        g.beginPath(); g.roundRect ? g.roundRect(hx - gw * 1.08, gy - r * 0.26, gw, r * 0.48, r * 0.16) : g.rect(hx - gw * 1.08, gy - r * 0.26, gw, r * 0.48); g.fill();
        g.beginPath(); g.roundRect ? g.roundRect(hx + gw * 0.08, gy - r * 0.26, gw, r * 0.48, r * 0.16) : g.rect(hx + gw * 0.08, gy - r * 0.26, gw, r * 0.48); g.fill();
        g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = Math.max(0.8, r * 0.1);
        g.beginPath(); g.moveTo(hx - gw * 0.9, gy - r * 0.12); g.lineTo(hx - gw * 0.6, gy - r * 0.12); g.stroke();
      }
      g.shadowBlur = prevBlur;
    };
  }

  function drawDie(g, x, y, sz, rot, body, pip, face) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = body; g.strokeStyle = "rgba(255,255,255,.28)"; g.lineWidth = 1;
    g.beginPath(); g.roundRect ? g.roundRect(-sz / 2, -sz / 2, sz, sz, sz * 0.2) : g.rect(-sz / 2, -sz / 2, sz, sz); g.fill(); g.stroke();
    g.fillStyle = pip;
    const pr = Math.max(0.7, sz * 0.09), off = sz * 0.26;
    PIPS[face].forEach(([px, py]) => { g.beginPath(); g.arc(px * off, py * off, pr, 0, TAU); g.fill(); });
    g.restore();
  }

  function DeskViz({ kind = "radial", grain = 0.2, scan = 0.2, analyser, real, bg = false, transparent = false }) {
    const ref = useRef(null);
    const cfg = useRef({ kind, grain, scan, analyser, real, bg, transparent });
    cfg.current = { kind, grain, scan, analyser, real, bg, transparent };

    useEffect(() => {
      const canvas = ref.current; if (!canvas) return;
      const x = canvas.getContext("2d");
      const buf = document.createElement("canvas"), bx = buf.getContext("2d");
      /* trails live on their own layer and fade by alpha */
      const tr = document.createElement("canvas"), tx = tr.getContext("2d");
      const nz = document.createElement("canvas"); nz.width = nz.height = 128;
      (() => {
        const c = nz.getContext("2d"), d = c.createImageData(128, 128);
        for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
        c.putImageData(d, 0, 0);
      })();
      const stars = [];
      for (let i = 0; i < 90; i++) stars.push({ a: Math.random() * 6.283, d: Math.random(), s: 0.4 + Math.random() });
      const crowd = [];
      for (let i = 0; i < 40; i++) crowd.push({ o: Math.random(), h: 0.85 + Math.random() * 0.35, w: 0.9 + Math.random() * 0.3, up: Math.random() < 0.34 });
      let t = 0, raf = 0, freq = null, time = null;
      const sm = {};
      /* beat tracking (per canvas) */
      const bt = { avg: 0, slow: 0, last: -9, ivs: [], period: 0.5, ph: 0, n: 0, hit: 0, dropAt: -99, move: 0, moveFrom: 0, pt: 0 };
      const pose = Object.assign({}, REST);
      const rings = [];
      let W = 8, H = 8, visible = true;
      const measure = () => { const r = canvas.getBoundingClientRect(); W = Math.max(8, Math.round(r.width)); H = Math.max(8, Math.round(r.height)); };
      measure();
      const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
      ro && ro.observe(canvas);
      const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; }) : null;
      io && io.observe(canvas);
      const sl = document.createElement("canvas"); sl.width = 1; sl.height = 3;
      (() => { const c = sl.getContext("2d"); c.fillStyle = "#000"; c.fillRect(0, 0, 1, 1); })();
      const slPat = x.createPattern(sl, "repeat");
      let last = 0;

      const read = () => {
        const c = cfg.current;
        const an = c.real && c.analyser && c.analyser.current;
        if (!an) return null;
        if (!freq || freq.length !== an.frequencyBinCount) { freq = new Uint8Array(an.frequencyBinCount); time = new Uint8Array(an.frequencyBinCount); }
        an.getByteFrequencyData(freq); an.getByteTimeDomainData(time);
        return { freq, time };
      };

      /* kick detector + beat clock. Low bins vs their recent average; the
         median gap between kicks sets the tempo (folded into 75–165 BPM). */
      const beatStep = (d, now) => {
        const dt = Math.min(0.1, bt.pt ? (now - bt.pt) / 1000 : 0.016); bt.pt = now;
        const ts = now / 1000;
        const low = d ? (d.freq[0] + d.freq[1] + d.freq[2]) / 765 : 0;
        bt.avg += (low - bt.avg) * Math.min(1, dt * 2.5);
        bt.slow += (low - bt.slow) * Math.min(1, dt * 0.3);
        let kick = false;
        if (d && low > 0.3 && low > bt.avg * 1.15 && ts - bt.last > 0.27) {
          const iv = ts - bt.last;
          if (iv < 1.3) {
            bt.ivs.push(iv); if (bt.ivs.length > 9) bt.ivs.shift();
            const s = bt.ivs.slice().sort((p, q) => p - q); let p = s[s.length >> 1];
            while (p < 0.36) p *= 2; while (p > 0.8) p /= 2;
            bt.period += (p - bt.period) * 0.35;
          }
          bt.last = ts; kick = true; bt.hit = 1;
        }
        const period = d ? bt.period : 1.7;
        bt.ph += dt / period;
        if (kick) { if (bt.ph > 0.55) bt.n++; bt.ph = 0; }
        while (bt.ph >= 1) { bt.ph -= 1; bt.n++; }
        bt.hit *= Math.exp(-dt * 7);
        if (d && bt.avg > 0.55 && bt.avg > bt.slow * 1.45 && ts - bt.dropAt > 9) bt.dropAt = ts;
        if (bt.n - bt.moveFrom >= 16) {
          bt.moveFrom = bt.n;
          let m; do { m = Math.floor(Math.random() * MOVE_LIST.length); } while (m === bt.move && MOVE_LIST.length > 1);
          bt.move = m;
        }
        return { dt, ts, kick, drop: ts - bt.dropAt };
      };

      const drawStage = (g, hit) => {
        g.fillStyle = "#0a090c"; g.fillRect(0, 0, W, H);
        const fy = H * 0.6;
        const wall = g.createLinearGradient(0, 0, 0, fy);
        wall.addColorStop(0, "#0b0a10"); wall.addColorStop(1, "#17121c");
        g.fillStyle = wall; g.fillRect(0, 0, W, fy);
        const fl = g.createLinearGradient(0, fy, 0, H);
        fl.addColorStop(0, "#1b1620"); fl.addColorStop(1, "#08070a");
        g.fillStyle = fl; g.fillRect(0, fy, W, H - fy);
        g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = 1;
        for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(W / 2 + i * W * 0.05, fy); g.lineTo(W / 2 + i * W * 0.17, H); g.stroke(); }
        g.beginPath(); g.moveTo(0, fy + 0.5); g.lineTo(W, fy + 0.5); g.strokeStyle = "rgba(255,255,255,.08)"; g.stroke();
        /* lights */
        g.save(); g.globalCompositeOperation = "lighter";
        const cols = ["255,47,214", "41,231,255", "255,190,60", "120,255,150"];
        for (let i = 0; i < 4; i++) {
          const lx = W * (0.14 + i * 0.24), ang = Math.sin(t * 0.32 + i * 1.9) * 0.45;
          const ex = lx + Math.sin(ang) * H * 0.9, ey = H * 0.92, spread = W * 0.075;
          const gr = g.createLinearGradient(lx, 0, ex, ey);
          const al = 0.07 + 0.13 * hit;
          gr.addColorStop(0, "rgba(" + cols[i] + "," + (al * 1.8).toFixed(3) + ")"); gr.addColorStop(1, "rgba(" + cols[i] + ",0)");
          g.fillStyle = gr;
          g.beginPath(); g.moveTo(lx - 2, 0); g.lineTo(lx + 2, 0); g.lineTo(ex + spread, ey); g.lineTo(ex - spread, ey); g.closePath(); g.fill();
          g.fillStyle = "rgba(" + cols[i] + "," + (0.05 + 0.1 * hit).toFixed(3) + ")";
          g.beginPath(); g.ellipse(ex, H * 0.8, spread * 1.3, spread * 0.3, 0, 0, TAU); g.fill();
          g.fillStyle = "rgba(" + cols[i] + ",.9)"; g.fillRect(lx - 3, 0, 6, 3);
        }
        g.restore();
      };

      const frame = (now) => {
        raf = requestAnimationFrame(frame);
        if (document.hidden || !visible) return;
        const c = cfg.current;
        if (now - last < (c.real && c.analyser && c.analyser.current ? 0 : 33)) return;
        last = now;
        if (buf.width !== W || buf.height !== H) { buf.width = W; buf.height = H; }
        if (tr.width !== W || tr.height !== H) { tr.width = W; tr.height = H; }
        if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
        t += 0.045;
        const d = read();
        const B = beatStep(d, now);
        const smooth = (key, v) => {
          const prev = sm[key]; const out = prev === undefined ? v : prev + (v - prev) * 0.14;
          sm[key] = out; return out;
        };
        const calm = (i) => 0.16 * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.58 + i * 0.16)));
        const raw = d
          ? (i, n) => { const k = Math.floor(i / n * Math.min(d.freq.length, 96)); return d.freq[k] / 255; }
          : calm;
        const amp = (i, n) => smooth("a" + i, raw(i, n));
        const rawWave = d
          ? (i, n) => (d.time[Math.floor(i / n * d.time.length)] - 128) / 128 * 0.42
          : (i) => Math.sin(t * 0.58 + i * 0.07) * 0.075 + Math.sin(t * 0.26 + i * 0.03) * 0.03;
        const waveAt = (i, n) => smooth("w" + i, rawWave(i, n));

        bx.clearRect(0, 0, W, H);
        bx.shadowBlur = Math.max(6, W * 0.02);
        const K = c.kind;
        let back = null, front = null;   // dancer layers drawn without trails
        if (K === "radial") {
          const cx = W / 2, cy = H / 2, r0 = Math.min(W, H) * 0.15, n = Math.max(48, Math.round(W / 6));
          bx.lineWidth = Math.max(1.4, W / 400);
          for (let i = 0; i < n; i++) {
            const a = i / n * 6.283, v = amp(i, n), l = r0 + v * Math.min(W, H) * 0.3, col = ramp(v);
            bx.strokeStyle = col; bx.shadowColor = col;
            bx.beginPath(); bx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); bx.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l); bx.stroke();
          }
        } else if (K === "bars") {
          const n = Math.max(28, Math.round(W / 12)), bw = W / n;
          for (let i = 0; i < n; i++) {
            const v = amp(i, n), h = v * H * 0.82, col = ramp(v);
            bx.fillStyle = col; bx.shadowColor = col;
            bx.fillRect(i * bw + bw * 0.15, H - h, bw * 0.7, h);
          }
        } else if (K === "wave") {
          const n = Math.min(180, Math.max(48, Math.round(W / 4)));
          bx.lineWidth = Math.max(1.6, W / 300);
          let peak = 0;
          bx.beginPath();
          for (let i = 0; i <= n; i++) {
            const xx = i / n * W, v = waveAt(i, n), yy = H / 2 + v * H;
            if (Math.abs(v) > peak) peak = Math.abs(v);
            i ? bx.lineTo(xx, yy) : bx.moveTo(xx, yy);
          }
          const col = ramp(Math.min(1, peak * 2.4));
          bx.strokeStyle = col; bx.shadowColor = col; bx.stroke();
        } else if (K === "grid") {
          const cell = Math.max(7, W / 34), cols = Math.floor(W / cell), rows = Math.floor(H / cell);
          for (let cc = 0; cc < cols; cc++) {
            const lit = amp(cc, cols) * rows;
            for (let rr = 0; rr < rows; rr++) {
              const on = rr < lit, v = 1 - rr / rows, col = ramp(v);
              bx.fillStyle = on ? col : "rgba(120,150,120,.08)"; bx.shadowColor = on ? col : "transparent";
              bx.fillRect(cc * cell + 1, H - (rr + 1) * cell + 1, cell - 2, cell - 2);
            }
          }
        } else if (K === "dancer") {
          /* chill on purpose: amplitude tops out well below full */
          const a = d ? 0.45 + 0.4 * clamp01(bt.avg * 1.5) : 0.2;
          const lo = smooth("lo", d ? bt.avg : 0.06);
          const col = ramp(0.3 + lo * 0.7);
          /* target pose */
          let tgt;
          if (d) tgt = MOVES[MOVE_LIST[bt.move]](bt.ph, bt.n, a);
          else {
            const sw = Math.sin(t * 0.55);
            tgt = Object.assign({}, REST, { sx: 0.7 * sw, lean: 0.03 * sw, nod: 0.12 * Math.max(0, Math.sin(t * 1.1)),
              rkn: -0.22 * Math.max(0, Math.sin(t * 1.1)), rhip: 0.07 + 0.06 * Math.max(0, Math.sin(t * 1.1)) });
          }
          /* drop: medium jump + a quick spin, arms going up */
          const dr = B.drop;
          let jump = 0, spin = 1;
          if (d && dr >= 0 && dr < 1.1) {
            const up = MOVES.handsup(bt.ph, bt.n, a), w = Math.sin(Math.PI * clamp01(dr / 1.1));
            ["lsh", "lel", "rsh", "rel"].forEach((k) => { tgt[k] = tgt[k] + (up[k] - tgt[k]) * w; });
            jump = dr < 0.55 ? Math.sin(Math.PI * dr / 0.55) : 0;
            spin = Math.cos(TAU * sstep(0.1, 0.75, dr));
          }
          const k = Math.min(1, B.dt * 13);
          Object.keys(REST).forEach((key) => { pose[key] += ((tgt[key] == null ? REST[key] : tgt[key]) - pose[key]) * k; });

          if (c.transparent) {
            /* small thumbnail: just the dancer, bigger */
            const s = Math.min(H / 34, W / 26);
            bx.strokeStyle = col; bx.fillStyle = col; bx.shadowColor = col; bx.lineWidth = Math.max(1.6, s * 0.7);
            drawFigure(bx, W / 2, H * 0.97, s, pose, { jump: jump * 6 * s, scaleX: spin, props: dancerProps(bx, col) });
          } else {
            const s = Math.min(H * 0.0145, W * 0.022);
            bx.strokeStyle = col; bx.fillStyle = col; bx.shadowColor = col; bx.lineWidth = Math.max(2, s * 0.62);
            drawFigure(bx, W * 0.5, H * 0.87, s, pose, { jump: jump * 7 * s, scaleX: spin, props: dancerProps(bx, col) });
            /* DJ + booth + dice: behind the dancer, crisp (no trails) */
            back = (g) => {
              const ds = s * 0.62, bxL = W * 0.31, bxR = W * 0.69, top = H * 0.49, fh = H * 0.09;
              const djCol = ramp(0.25 + lo * 0.5);
              const dip = (1 + Math.cos(bt.ph * TAU)) / 2;
              const scr = d ? Math.sin(t * 7) * 0.35 : 0;
              const djPose = { sx: 0, lean: 0.12, nod: (d ? 0.55 * dip * a : 0.1 * Math.max(0, Math.sin(t * 1.1))),
                lsh: -0.75 + scr, lel: 1.35, rsh: dr >= 0 && dr < 3 && d ? 2.4 : 0.95, rel: dr >= 0 && dr < 3 && d ? 0.9 : -1.8,
                lhip: -0.06, lkn: 0.1, rhip: 0.06, rkn: -0.1 };
              g.save();
              g.beginPath(); g.rect(0, 0, W, top + fh); g.clip();   /* legs stay behind the booth */
              g.strokeStyle = djCol; g.fillStyle = djCol; g.shadowColor = djCol; g.shadowBlur = Math.max(4, W * 0.012);
              g.lineWidth = Math.max(1.6, ds * 0.62);
              drawFigure(g, W * 0.5, top + 15 * ds, ds, djPose, { props: (hx, hy, r) => {
                g.shadowBlur = 0; g.lineWidth = Math.max(1.2, r * 0.35);
                g.beginPath(); g.arc(hx, hy, r * 1.25, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
                g.fillStyle = "#151311"; g.strokeStyle = djCol;
                [-1, 1].forEach((sd) => { g.beginPath(); g.ellipse(hx + sd * r * 1.15, hy + r * 0.1, r * 0.42, r * 0.6, 0, 0, TAU); g.fill(); g.stroke(); });
              } });
              g.restore();
              /* booth: top surface + front panel */
              g.fillStyle = "#1d1a22";
              g.beginPath(); g.moveTo(bxL + W * 0.02, top - fh * 0.32); g.lineTo(bxR - W * 0.02, top - fh * 0.32); g.lineTo(bxR, top); g.lineTo(bxL, top); g.closePath(); g.fill();
              const pf = g.createLinearGradient(0, top, 0, top + fh);
              pf.addColorStop(0, "#26212c"); pf.addColorStop(1, "#110f14");
              g.fillStyle = pf; g.fillRect(bxL, top, bxR - bxL, fh);
              g.strokeStyle = ramp(0.2 + bt.hit * 0.5); g.globalAlpha = 0.55 + 0.45 * bt.hit; g.lineWidth = 1.5;
              g.beginPath(); g.moveTo(bxL + 3, top + fh * 0.55); g.lineTo(bxR - 3, top + fh * 0.55); g.stroke();
              g.globalAlpha = 1;
              /* decks */
              [0.4, 0.6].forEach((fx, i) => {
                const px = W * fx, py = top - fh * 0.16, pr = (bxR - bxL) * 0.085;
                g.fillStyle = "#0b0a0d"; g.beginPath(); g.ellipse(px, py, pr, pr * 0.32, 0, 0, TAU); g.fill();
                g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1; g.stroke();
                const ang = t * (d ? 3.3 : 0.6) * (i ? 1 : 1.04) + (i === 0 ? scr * 2 : 0);
                g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(ang) * pr * 0.9, py + Math.sin(ang) * pr * 0.29); g.stroke();
              });
              /* dice on the right end of the booth */
              const dsz = Math.max(5, (bxR - bxL) * 0.034);
              DICE.forEach((dd, i) => {
                const dx = bxR - W * 0.02 - dsz * 0.6 - i * dsz * 1.25, dy = top - dsz * 0.62 - bt.hit * dsz * 0.25 * ((i % 2) ? 1 : 0.6);
                drawDie(g, dx, dy, dsz, (i - 2) * 0.16, dd[0], dd[1], dd[2]);
              });
            };
            /* crowd silhouettes along the bottom, in front of everything */
            front = (g) => {
              const n = Math.max(7, Math.round(W / 34)), step = W / (n - 1), base = H + s * 1.5;
              for (let i = 0; i < n; i++) {
                const p = crowd[i % crowd.length], cx = i * step + (p.o - 0.5) * step * 0.5;
                const bob = d ? ((1 + Math.cos((bt.ph + p.o * 0.3) * TAU)) / 2) * a * s * 1.6 : Math.sin(t * 0.5 + p.o * 6) * s * 0.4;
                const hr = s * 2.4 * p.w, sh = s * 5.2 * p.w, hy = base - s * 7.5 * p.h + bob;
                g.fillStyle = "#040305";
                g.beginPath(); g.ellipse(cx, hy + hr + sh * 0.95, sh, sh, 0, Math.PI, TAU); g.fill();
                g.beginPath(); g.arc(cx, hy, hr, 0, TAU); g.fill();
                if (p.up && d && (dr >= 0 && dr < 4)) {
                  g.strokeStyle = "#040305"; g.lineWidth = s * 1.1; g.lineCap = "round";
                  const wv = Math.sin(t * 4 + p.o * 5) * s;
                  g.beginPath(); g.moveTo(cx - sh * 0.55, hy + hr * 1.6); g.lineTo(cx - sh * 0.75 + wv, hy - s * 6); g.stroke();
                  g.beginPath(); g.moveTo(cx + sh * 0.55, hy + hr * 1.6); g.lineTo(cx + sh * 0.75 + wv, hy - s * 6); g.stroke();
                }
                g.strokeStyle = "rgba(255,180,240," + (0.08 + 0.18 * bt.hit).toFixed(3) + ")"; g.lineWidth = 1;
                g.beginPath(); g.arc(cx, hy, hr, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
              }
            };
          }
        } else if (K === "speaker") {
          const ch = Math.min(H * 0.84, W * 1.1), cw = Math.min(ch * 0.66, W * 0.62), lx = W / 2 - cw / 2, ty = H / 2 - ch / 2;
          const push = smooth("push", d ? clamp01(bt.avg * 1.15 + bt.hit * 0.25) : 0.1 + 0.06 * Math.sin(t * 0.58));
          const hi = smooth("hi", d ? (d.freq[40] + d.freq[55] + d.freq[70]) / 765 : 0.05);
          const lw = Math.max(1.4, W / 360);
          bx.lineWidth = lw;
          const cab = ramp(0.2);
          bx.strokeStyle = cab; bx.shadowColor = cab; bx.globalAlpha = 0.55;
          bx.beginPath(); bx.roundRect ? bx.roundRect(lx, ty, cw, ch, cw * 0.06) : bx.rect(lx, ty, cw, ch); bx.stroke();
          bx.globalAlpha = 1;
          const tx0 = W / 2, ty0 = ty + ch * 0.2, tr0 = cw * 0.11 * (1 + hi * 0.12);
          const tcol = ramp(0.25 + hi);
          bx.strokeStyle = tcol; bx.shadowColor = tcol;
          bx.beginPath(); bx.arc(tx0, ty0, tr0, 0, TAU); bx.stroke();
          bx.beginPath(); bx.arc(tx0, ty0, tr0 * 0.45, 0, TAU); bx.stroke();
          const wx = W / 2, wy = ty + ch * 0.63, R = cw * 0.36;
          if (B.kick && d) rings.push({ r: R, life: 1 });
          const col = ramp(0.25 + push * 0.75);
          bx.strokeStyle = col; bx.shadowColor = col;
          bx.lineWidth = lw * 1.6; bx.beginPath(); bx.arc(wx, wy, R, 0, TAU); bx.stroke();
          bx.lineWidth = lw;
          [0.8, 0.6, 0.42].forEach((f, i) => { bx.beginPath(); bx.arc(wx, wy, R * f * (1 + push * (0.05 + i * 0.03)), 0, TAU); bx.stroke(); });
          bx.fillStyle = col; bx.globalAlpha = 0.85;
          bx.beginPath(); bx.arc(wx, wy, R * 0.2 * (1 + push * 0.35), 0, TAU); bx.fill();
          bx.globalAlpha = 1;
          for (let i = rings.length - 1; i >= 0; i--) {
            const rg = rings[i]; rg.r += R * 0.05; rg.life -= 0.03;
            if (rg.life <= 0) { rings.splice(i, 1); continue; }
            bx.globalAlpha = rg.life * 0.5; bx.beginPath(); bx.arc(wx, wy, rg.r, 0, TAU); bx.stroke();
          }
          if (rings.length > 6) rings.splice(0, rings.length - 6);
          bx.globalAlpha = 1;
        } else if (K === "scope") {
          const mx = W * 0.07, my = H * 0.09, sw = W - mx * 2, sh = H - my * 2, cy = my + sh / 2;
          bx.shadowBlur = 0;
          bx.strokeStyle = "rgba(120,255,150,.22)"; bx.lineWidth = 1.2;
          bx.beginPath(); bx.roundRect ? bx.roundRect(mx, my, sw, sh, Math.min(sw, sh) * 0.08) : bx.rect(mx, my, sw, sh); bx.stroke();
          bx.strokeStyle = "rgba(120,255,150,.07)"; bx.lineWidth = 1;
          for (let i = 1; i < 10; i++) { const gx = mx + sw * i / 10; bx.beginPath(); bx.moveTo(gx, my); bx.lineTo(gx, my + sh); bx.stroke(); }
          for (let i = 1; i < 8; i++) { const gy = my + sh * i / 8; bx.beginPath(); bx.moveTo(mx, gy); bx.lineTo(mx + sw, gy); bx.stroke(); }
          bx.strokeStyle = "rgba(120,255,150,.16)";
          bx.beginPath(); bx.moveTo(mx, cy); bx.lineTo(mx + sw, cy); bx.moveTo(W / 2, my); bx.lineTo(W / 2, my + sh); bx.stroke();
          bx.shadowBlur = Math.max(6, W * 0.02);
          let pts = [], peak = 0;
          if (d) {
            const tm = d.time, L = tm.length;
            let trig = 0;
            for (let i = 1; i < L / 2; i++) if (tm[i - 1] < 128 && tm[i] >= 128) { trig = i; break; }
            const N = L - trig;
            for (let i = 0; i < N; i++) { const v = (tm[trig + i] - 128) / 128; pts.push(v); peak = Math.max(peak, Math.abs(v)); }
          } else {
            for (let i = 0; i < 96; i++) { const v = Math.sin(i / 96 * TAU * 2 + t * 0.9) * (0.1 + 0.04 * Math.sin(t * 0.58)); pts.push(v); peak = Math.max(peak, Math.abs(v)); }
          }
          const col = ramp(Math.min(1, peak * 2.4));
          bx.strokeStyle = col; bx.shadowColor = col; bx.lineWidth = Math.max(1.6, W / 280);
          bx.beginPath();
          pts.forEach((v, i) => {
            const px = mx + sw * i / Math.max(1, pts.length - 1), py = cy + Math.max(-1, Math.min(1, v * 1.7)) * sh * 0.44;
            i ? bx.lineTo(px, py) : bx.moveTo(px, py);
          });
          bx.stroke();
        } else {
          const cx = W / 2, cy = H / 2, lo = smooth("lo", d ? amp(3, 64) : 0.05);
          const rate = d ? 0.03 + lo * 0.006 : 0.02;
          stars.forEach((st) => {
            const dd = (st.d + t * rate * st.s) % 1, rr = dd * Math.min(W, H) * 0.62, col = ramp(dd);
            bx.fillStyle = col; bx.shadowColor = col;
            const k = Math.max(1.4, dd * W * 0.006);
            bx.fillRect(cx + Math.cos(st.a) * rr, cy + Math.sin(st.a) * rr, k, k);
          });
        }
        bx.shadowBlur = 0;

        /* trails: fade the previous frame's alpha instead of painting over it */
        tx.globalCompositeOperation = "destination-out";
        tx.fillStyle = "rgba(0,0,0,.26)"; tx.fillRect(0, 0, W, H);
        tx.globalCompositeOperation = "source-over";
        tx.drawImage(buf, 0, 0);

        x.clearRect(0, 0, W, H);
        if (!c.transparent) {
          if (c.bg && K === "dancer") drawStage(x, bt.hit);
          else { x.fillStyle = "#0d0c09"; x.fillRect(0, 0, W, H); }
        }
        if (back) back(x);
        x.drawImage(tr, 0, 0);
        if (front) front(x);

        if (c.transparent) return;
        if (c.grain > 0) {
          x.save(); x.globalCompositeOperation = "overlay"; x.globalAlpha = c.grain;
          const ox = -Math.random() * 128, oy = -Math.random() * 128;
          for (let yy = oy; yy < H; yy += 128) for (let xx = ox; xx < W; xx += 128) x.drawImage(nz, xx, yy);
          x.restore();
        }
        if (c.scan > 0) {
          x.globalAlpha = c.scan * 0.8; x.fillStyle = slPat;
          x.fillRect(0, 0, W, H);
          x.globalAlpha = 1;
        }
      };
      raf = requestAnimationFrame(frame);
      return () => { cancelAnimationFrame(raf); ro && ro.disconnect(); io && io.disconnect(); };
    }, []);

    return <canvas ref={ref} className="dkm-canvas" />;
  }

  window.DeskViz = DeskViz;
  window.DESK_VIZ_KINDS = KINDS;
})();
