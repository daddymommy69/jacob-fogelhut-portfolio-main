/* =========================================================================
   desk-viz.jsx — the corner player's visualizer. Six modes, spectrum colour
   by intensity, glow + motion trails, with grain and scanline overlays on
   dials (Jacob's choice: smooth shapes, not 8-bit blocks).

   Real audio drives it when a mix is playing (frequency data for the
   spectral modes, time-domain for the wave); otherwise it runs a synthetic
   snappy beat so the panel is never dead.
   ========================================================================= */
(function () {
  const { useRef, useEffect } = React;
  const KINDS = ["radial", "bars", "wave", "grid", "dancer", "stars"];
  const ramp = (v) => "hsl(" + (140 - 140 * Math.min(1, Math.max(0, (v - 0.25) / 0.7))) + " 85% " + (45 + 25 * v) + "%)";

  function DeskViz({ kind = "radial", grain = 0.2, scan = 0.2, analyser, real, bg = false, transparent = false }) {
    const ref = useRef(null);
    const cfg = useRef({ kind, grain, scan, analyser, real, bg, transparent });
    cfg.current = { kind, grain, scan, analyser, real, bg, transparent };

    useEffect(() => {
      const canvas = ref.current; if (!canvas) return;
      const x = canvas.getContext("2d");
      const buf = document.createElement("canvas"), bx = buf.getContext("2d");
      /* trails live on their own layer and fade by alpha, so whatever sits
         behind them (the neon grid, or nothing at all in the bottom bar)
         stays visible instead of being painted over */
      const tr = document.createElement("canvas"), tx = tr.getContext("2d");
      /* static neon horizon, redrawn only on resize */
      const gridCv = document.createElement("canvas");
      let gridW = 0, gridH = 0;
      const buildGrid = (W, H) => {
        gridCv.width = W; gridCv.height = H; gridW = W; gridH = H;
        const g = gridCv.getContext("2d");
        g.fillStyle = "#0d0c09"; g.fillRect(0, 0, W, H);
        const hy = Math.round(H * 0.62), cx = W / 2;
        const sky = g.createLinearGradient(0, 0, 0, hy);
        sky.addColorStop(0, "rgba(255,47,214,0)"); sky.addColorStop(1, "rgba(255,47,214,.09)");
        g.fillStyle = sky; g.fillRect(0, 0, W, hy);
        const fl = g.createLinearGradient(0, hy, 0, H);
        fl.addColorStop(0, "rgba(41,231,255,.08)"); fl.addColorStop(1, "rgba(41,231,255,0)");
        g.fillStyle = fl; g.fillRect(0, hy, W, H - hy);
        g.lineWidth = 1; g.strokeStyle = "rgba(41,231,255,.11)";
        for (let i = -14; i <= 14; i++) { g.beginPath(); g.moveTo(cx, hy); g.lineTo(cx + i * (W / 8), H); g.stroke(); }
        for (let i = 1; i <= 12; i++) {
          const f = Math.pow(i / 12, 2.1), y = hy + f * (H - hy);
          g.globalAlpha = 0.5 + 0.5 * f;
          g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
        }
        g.globalAlpha = 1;
        const gl = g.createLinearGradient(0, hy - 10, 0, hy + 10);
        gl.addColorStop(0, "rgba(255,47,214,0)"); gl.addColorStop(.5, "rgba(255,120,235,.20)"); gl.addColorStop(1, "rgba(41,231,255,0)");
        g.fillStyle = gl; g.fillRect(0, hy - 10, W, 20);
        g.strokeStyle = "rgba(255,160,245,.20)";
        g.beginPath(); g.moveTo(0, hy + .5); g.lineTo(W, hy + .5); g.stroke();
      };
      const nz = document.createElement("canvas"); nz.width = nz.height = 128;
      (() => {
        const c = nz.getContext("2d"), d = c.createImageData(128, 128);
        for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
        c.putImageData(d, 0, 0);
      })();
      const stars = [];
      for (let i = 0; i < 90; i++) stars.push({ a: Math.random() * 6.283, d: Math.random(), s: 0.4 + Math.random() });
      let t = 0, raf = 0, freq = null, time = null;
      const sm = {};   /* per-bin easing state, so calm↔playing is a glide */
      /* The bar mounts a second copy of this canvas, so two run at once.
         Cache the size (a per-frame getBoundingClientRect forced a layout
         every frame), skip work in a hidden tab or when scrolled out of view,
         and halve the rate while idling. */
      let W = 8, H = 8, visible = true;
      const measure = () => { const r = canvas.getBoundingClientRect(); W = Math.max(8, Math.round(r.width)); H = Math.max(8, Math.round(r.height)); };
      measure();
      const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
      ro && ro.observe(canvas);
      const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; }) : null;
      io && io.observe(canvas);
      /* scanlines: one pre-rendered tile instead of H/3 fillRects per frame */
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


      const frame = (now) => {
        raf = requestAnimationFrame(frame);
        if (document.hidden || !visible) return;
        const c = cfg.current;
        /* 60fps only while a mix is actually playing; the idle breath and the
           star drift read the same at 30 and cost half as much. */
        if (now - last < (c.real && c.analyser && c.analyser.current ? 0 : 33)) return;
        last = now;
        if (buf.width !== W || buf.height !== H) { buf.width = W; buf.height = H; }
        if (tr.width !== W || tr.height !== H) { tr.width = W; tr.height = H; }
        if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
        t += 0.045;
        const d = read();
        /* amp(i, n): 0..1 per bin. Real spectrum when a mix is playing,
           otherwise a calm breath: ~4s cycle, reaching ~16% of full height,
           in whichever mode is selected. Every value is eased toward its
           target (~0.5s), so starting and pausing settles instead of
           snapping. Grain and trails are unchanged either way. */
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
          /* One path, one shadowed stroke. Stroking every segment separately
             with shadowBlur on meant ~W/2 blurred draw calls a frame, which
             is what made this mode drag the whole page down. */
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
          const cx = W / 2, cy = H * 0.6, s = Math.min(W, H) * 0.014;
          const lo = smooth("lo", d ? (amp(2, 64) + amp(5, 64)) / 2 : 0.06);
          const sw = Math.sin(t * (d ? 3.2 : 0.7)), col = ramp(0.3 + lo * 0.7);
          bx.strokeStyle = col; bx.fillStyle = col; bx.shadowColor = col; bx.lineWidth = Math.max(2, s * 0.55);
          const P = (ax, ay) => [cx + ax * s, cy + ay * s - lo * s * 2.2];
          const line = (a, b) => { const p = P(a[0], a[1]), q = P(b[0], b[1]); bx.beginPath(); bx.moveTo(p[0], p[1]); bx.lineTo(q[0], q[1]); bx.stroke(); };
          const head = P(0, -15);
          bx.beginPath(); bx.arc(head[0], head[1], s * 2.6, 0, 6.283); bx.fill();
          line([0, -12], [0, -2]); line([0, -10], [-6 - sw * 3, -4 - lo * 4]); line([0, -10], [6 + sw * 3, -4 + lo * 4]);
          line([0, -2], [-4 + sw * 2, 8]); line([0, -2], [4 + sw * 2, 8]);
        } else {
          /* stars: the calm drift reads better than a reactive one, so playing
             now moves at the old idle rate and idle is slower still */
          const cx = W / 2, cy = H / 2, lo = smooth("lo", d ? amp(3, 64) : 0.05);
          const rate = d ? 0.12 + lo * 0.01 : 0.055;
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
          if (c.bg && c.kind === "dancer") { if (gridW !== W || gridH !== H) buildGrid(W, H); x.drawImage(gridCv, 0, 0); }
          else { x.fillStyle = "#0d0c09"; x.fillRect(0, 0, W, H); }
        }
        x.drawImage(tr, 0, 0);

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
