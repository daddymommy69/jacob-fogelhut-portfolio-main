/* =========================================================================
   player.jsx — the persistent radio. Lives in the SPA shell so it survives
   navigation between the main site and the Playground.

   TWO sources, ONE shared bottom bar (only one ever makes sound):
     • MIXES   (desk "radio")      → real audio files, run as LIVE STATIONS.
     • PLAYLISTS (desk "headphones")→ Spotify/Apple embeds (unchanged: the
                                      embed plays its own audio).

   LIVE STATIONS (Jacob, Nov 2026)
     Every mix is its own station and is always "on air": its position is
     worked out from the real clock, so everyone tuned in hears the same
     moment, with no server. Each station loops forever and has its own
     offset so they don't all start together.
       • play          → lands on live (static crackle as it tunes in)
       • pause         → resumes where you paused; you're now behind live,
                         the LIVE badge goes grey and tapping it jumps back
       • prev          → restarts this station from 0:00 (seek bar appears);
                         press again within 3s → previous station
       • next          → next station
       • switching     → always lands on live
   Durations are cached in localStorage so returning visitors tune faster.
   While live it re-checks the clock every 3s and corrects anything >2s off.

   Exposed on window (separate Babel scopes share these):
     PlayerCtx, usePlayer, PlayerProvider, PlayerBar, Visualizer, LiveBadge
   ========================================================================= */
(function () {
  const { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } = React;
  const PG = window.PORTFOLIO_DATA.playground;

  const PlayerCtx = createContext(null);
  window.PlayerCtx = PlayerCtx;
  const usePlayer = () => useContext(PlayerCtx);
  window.usePlayer = usePlayer;

  function embedToPage(u) {
    if (!u) return null;
    return u
      .replace("open.spotify.com/embed/", "open.spotify.com/")
      .replace("embed.music.apple.com", "music.apple.com");
  }
  const fmt = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return m + ":" + String(ss).padStart(2, "0");
  };

  /* ---- the broadcast clock ---- */
  const EPOCH = Date.UTC(2026, 0, 1) / 1000;
  const hashOff = (id) => { let h = 7; const s = String(id); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h % 86400; };
  const livePosFor = (id, d) => (d > 0 && isFinite(d)) ? (((Date.now() / 1000 - EPOCH + hashOff(id)) % d) + d) % d : 0;
  const DUR_KEY = "jf-radio-dur-v1";
  const loadDur = () => { try { return JSON.parse(localStorage.getItem(DUR_KEY) || "{}") || {}; } catch (e) { return {}; } };
  const saveDur = (o) => { try { localStorage.setItem(DUR_KEY, JSON.stringify(o)); } catch (e) {} };
  const durOK = (a) => !!a && isFinite(a.duration) && a.duration > 0;

  /* =======================================================================
     PROVIDER
     ======================================================================= */
  function useAudioUploads() {
    const [list, setList] = useState([]);
    useEffect(() => {
      if (!window.AudioStore) return;
      let on = true;
      const sync = () => { if (on) setList(window.AudioStore.list()); };
      window.AudioStore.load().then(sync);
      const unsub = window.AudioStore.subscribe(sync);
      return () => { on = false; unsub(); };
    }, []);
    return list;
  }

  function PlayerProvider({ children }) {
    const uploads = useAudioUploads();
    const mixes = useMemo(() => {
      const host = (u) => {
        if (!u || /^(https?:\/\/|data:|blob:)/.test(u)) return u;
        const b = (window.MEDIA_BASE || "").replace(/\/$/, "");
        return b ? b + "/" + u.replace(/^\//, "") : u;
      };
      // `hidden: true` in data.js keeps a mix off the radio until it's ready
      const base = (PG.mixes || []).filter((m) => m.src && !m.hidden)
        .map((m) => ({ id: m.id, title: m.title, src: host(m.src), coverId: "mix:" + m.id + ":cover" }));
      const up = uploads.map((u) => ({ id: "up:" + u.id, title: u.title || "Untitled mix", src: window.AudioStore.urlFor(u.id), coverId: null, uploaded: true })).filter((m) => m.src);
      return [...base, ...up];
    }, [uploads]);
    const playlists = useMemo(() => (PG.radio || [])
      .map((r) => ({ id: r.name, name: r.name, kind: r.kind, embed: r.embed, page: embedToPage(r.embed) })), []);
    const slots = window.useMediaSlots();

    const [on, setOn] = useState(false);
    const [srcType, setSrcType] = useState("mix");
    const [mixIdx, setMixIdx] = useState(0);
    const [plIdx, setPlIdx] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [volume, setVol] = useState(0.9);
    const [time, setTime] = useState(0);
    const [dur, setDur] = useState(0);
    const [live, setLiveS] = useState(true);
    const [mixPanel, setMixPanel] = useState(false);
    const [plPanel, setPlPanel] = useState(false);

    const audioRef = useRef(null);
    const acRef = useRef(null);
    const analyserRef = useRef(null);
    const firstPlayRef = useRef(false);
    const liveRef = useRef(true);
    const pendRef = useRef(null);         // { mode: "live" | "start", play }
    const posRef = useRef(false);         // current src has been positioned
    const curRef = useRef(null);          // the mix the audio element holds
    const volRef = useRef(0.9);
    const durCache = useRef(loadDur());
    const playRef = useRef(() => {});

    const setLive = (v) => { liveRef.current = v; setLiveS(v); };

    const isMix = srcType === "mix";
    const mix = mixes[Math.min(mixIdx, mixes.length - 1)] || null;
    const playlist = playlists[Math.min(plIdx, playlists.length - 1)] || null;

    /* put the element where the pending request wants it */
    const applyPend = (a) => {
      const pd = pendRef.current; if (!pd) return;
      pendRef.current = null;
      const m = curRef.current;
      try { a.currentTime = pd.mode === "live" && durOK(a) ? livePosFor(m ? m.id : "", a.duration) : 0; } catch (e) {}
      posRef.current = true;
      setTime(a.currentTime);
      if (pd.play) playRef.current();
    };

    useEffect(() => {
      if (audioRef.current) return;
      const a = new Audio();
      a.crossOrigin = "anonymous";   // Web Audio needs CORS-mode media
      a.preload = "metadata";
      a.volume = volRef.current;
      let fixing = false, lastSync = 0;
      const known = () => {
        setDur(a.duration);
        const m = curRef.current;
        if (m && durCache.current[m.src] !== a.duration) { durCache.current[m.src] = a.duration; saveDur(durCache.current); }
        applyPend(a);
      };
      /* VBR / stream MP3s (DJ sets) report duration=Infinity until buffered:
         seek far to force a real value, then land where we were asked to. */
      const fixDur = () => {
        if (durOK(a)) { known(); return; }
        if (a.duration === Infinity && !fixing) {
          fixing = true;
          const onJump = () => {
            a.removeEventListener("timeupdate", onJump); fixing = false;
            if (durOK(a)) known(); else { setDur(0); applyPend(a); }
          };
          a.addEventListener("timeupdate", onJump);
          try { a.currentTime = 1e7; } catch (e) { fixing = false; applyPend(a); }
        }
      };
      a.addEventListener("loadedmetadata", fixDur);
      a.addEventListener("durationchange", () => { if (!fixing && durOK(a)) { setDur(a.duration); if (pendRef.current) known(); } });
      a.addEventListener("timeupdate", () => {
        if (fixing) return;
        setTime(a.currentTime);
        /* stay on air: a stall or a sleeping tab can drift us off the clock */
        const now = performance.now();
        if (liveRef.current && !a.paused && a.readyState >= 3 && durOK(a) && now - lastSync > 3000) {
          lastSync = now;
          const m = curRef.current, want = livePosFor(m ? m.id : "", a.duration);
          let diff = Math.abs(a.currentTime - want); diff = Math.min(diff, a.duration - diff);
          if (diff > 2) a.currentTime = want;
        }
      });
      /* stations loop forever */
      a.addEventListener("ended", () => {
        const m = curRef.current;
        a.currentTime = liveRef.current && durOK(a) ? livePosFor(m ? m.id : "", a.duration) : 0;
        playRef.current();
      });
      a.addEventListener("play", () => setPlaying(true));
      a.addEventListener("pause", () => setPlaying(false));
      audioRef.current = a;
    }, []);

    const ensureGraph = useCallback(() => {
      if (acRef.current || !audioRef.current) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        const ac = new AC();
        const node = ac.createMediaElementSource(audioRef.current);
        const an = ac.createAnalyser();
        an.fftSize = 256; an.smoothingTimeConstant = 0.82;
        node.connect(an); an.connect(ac.destination);
        acRef.current = ac; analyserRef.current = an;
      } catch (e) {}
    }, []);

    const playAudio = useCallback(() => {
      const a = audioRef.current; if (!a) return;
      ensureGraph();
      if (acRef.current && acRef.current.state === "suspended") acRef.current.resume();
      const p = a.play(); if (p && p.catch) p.catch(() => {});
    }, [ensureGraph]);
    playRef.current = playAudio;

    /* ~0.3s of radio static, made on the fly (no file) */
    const crackle = useCallback(() => {
      ensureGraph();
      const ac = acRef.current; if (!ac) return;
      try {
        if (ac.state === "suspended") ac.resume();
        const sr = ac.sampleRate, len = Math.floor(sr * 0.3);
        const b = ac.createBuffer(1, len, sr), d = b.getChannelData(0);
        for (let i = 0; i < len; i++) {
          const env = Math.min(1, i / (sr * 0.012)) * Math.pow(1 - i / len, 1.6);
          const pop = Math.random() < 0.005 ? (Math.random() * 2 - 1) * 2.6 : 0;
          d[i] = ((Math.random() * 2 - 1) * 0.55 + pop) * env;
        }
        const s = ac.createBufferSource(); s.buffer = b;
        const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2200; bp.Q.value = 0.7;
        const g = ac.createGain(); g.gain.value = 0.2 * volRef.current;
        s.connect(bp); bp.connect(g); g.connect(ac.destination);
        s.start();
      } catch (e) {}
    }, [ensureGraph]);

    /* load a station into the element and position it */
    const load = useCallback((m, pend) => {
      const a = audioRef.current; if (!a || !m) return;
      curRef.current = m;
      const abs = new URL(m.src, location.href).href;
      pendRef.current = pend;
      if (a.src !== abs) {
        posRef.current = false;
        a.src = m.src; setTime(0);
        setDur(durCache.current[m.src] || 0);
      } else if (durOK(a) || a.readyState >= 1) {
        applyPend(a);
      }
    }, []);

    // point the element at the first station without playing, so metadata is ready
    useEffect(() => {
      const a = audioRef.current;
      if (a && !a.src && mix) { curRef.current = mix; a.src = mix.src; }
    }, [mix && mix.src]);

    /* ── tune to station i: always lands live ── */
    const tune = useCallback((i, opts) => {
      const n = mixes.length; if (!n) return;
      const o = opts || {};
      const nx = ((i % n) + n) % n;
      setSrcType("mix"); setOn(true); setMixIdx(nx); setLive(true);
      if (o.play !== false) crackle();
      load(mixes[nx], { mode: "live", play: o.play !== false });
    }, [mixes, load, crackle]);

    /* start the current station: resume if positioned, else tune in live */
    const startCurrent = useCallback(() => {
      const a = audioRef.current; if (!a || !mix) return;
      if (posRef.current && curRef.current && curRef.current.id === mix.id) { playAudio(); return; }
      crackle();
      load(mix, { mode: liveRef.current ? "live" : "start", play: true });
    }, [mix, load, crackle, playAudio]);

    const togglePlay = useCallback(() => {
      if (!isMix) return;
      const a = audioRef.current; if (!a) return;
      if (!a.paused) { a.pause(); setLive(false); return; }   // now behind live
      startCurrent();
    }, [isMix, startCurrent]);

    const goLive = useCallback(() => {
      if (!mix) return;
      setSrcType("mix"); setOn(true); setLive(true);
      load(mix, { mode: "live", play: true });
    }, [mix, load]);

    const goMix = useCallback((i, autoplay) => tune(i, { play: autoplay !== false }), [tune]);

    const toMix = useCallback((autoplay) => {
      setSrcType("mix");                 // unmounts the embed → its audio stops
      if (autoplay === true) setTimeout(startCurrent, 60);
    }, [startCurrent]);
    const toPlaylist = useCallback((i) => {
      const a = audioRef.current; if (a) a.pause();
      if (typeof i === "number") setPlIdx((i + playlists.length) % playlists.length);
      setSrcType("playlist");
    }, [playlists]);

    const next = useCallback(() => {
      if (isMix) tune(mixIdx + 1);
      else setPlIdx((i) => (i + 1) % playlists.length);
    }, [isMix, mixIdx, tune, playlists]);
    const prev = useCallback(() => {
      if (!isMix) { setPlIdx((i) => (i - 1 + playlists.length) % playlists.length); return; }
      const a = audioRef.current;
      const sameMix = curRef.current && mix && curRef.current.id === mix.id;
      // already at the top of an on-demand play → previous station
      if (a && sameMix && posRef.current && !liveRef.current && a.currentTime < 3) { tune(mixIdx - 1); return; }
      // otherwise restart this station from 0:00
      setLive(false);
      if (a && sameMix && posRef.current) { a.currentTime = 0; setTime(0); playAudio(); }
      else load(mix, { mode: "start", play: true });
    }, [isMix, mix, mixIdx, tune, load, playAudio, playlists]);
    const shuffle = useCallback(() => {
      if (isMix) { if (mixes.length > 1) { let n; do { n = Math.floor(Math.random() * mixes.length); } while (n === mixIdx); tune(n); } }
      else if (playlists.length > 1) { let n; do { n = Math.floor(Math.random() * playlists.length); } while (n === plIdx); setPlIdx(n); }
    }, [isMix, mixes, mixIdx, tune, playlists, plIdx]);

    const openMixes = useCallback(() => {
      setOn(true); setMixPanel(true); setSrcType("mix");
      const a = audioRef.current;
      if (a && !a.paused) return;
      if (!firstPlayRef.current) {           // wait a beat the FIRST time
        firstPlayRef.current = true;
        setTimeout(startCurrent, 900);
      } else setTimeout(startCurrent, 60);
    }, [startCurrent]);
    const armRadio = useCallback(() => { setOn(true); setSrcType("mix"); }, []);
    const openPlaylists = useCallback(() => {
      const a = audioRef.current; if (a) a.pause();
      setOn(true); setPlPanel(true); setSrcType("playlist");
    }, []);

    /* turning the radio off: next time it comes back on air */
    const closeRadio = useCallback(() => {
      const a = audioRef.current; if (a) a.pause();
      setOn(false); setMixPanel(false); setPlPanel(false); setPlaying(false);
      posRef.current = false; setLive(true);
    }, []);

    const changeVolume = useCallback((v) => { setVol(v); volRef.current = v; const a = audioRef.current; if (a) a.volume = v; }, []);
    const seek = useCallback((v) => {
      const a = audioRef.current;
      if (a && isFinite(a.duration)) { a.currentTime = v; setTime(v); setLive(false); }
    }, []);

    const cover = isMix && mix && mix.coverId ? window.MediaSlots.crop(slots, mix.coverId) : null;
    const accent = useAccent();

    const expand = useCallback(() => {
      if (isMix) setMixPanel(true); else setPlPanel(true);
      if (location.hash.replace("#", "") !== "playground") location.hash = "playground";
    }, [isMix]);

    const value = {
      mixes, playlists, on, srcType, isMix, mixIdx, plIdx, mix, playlist,
      playing, volume, time, dur, cover, accent, live,
      mixPanel, plPanel, analyser: analyserRef,
      setMixPanel, setPlPanel,
      togglePlay, next, prev, shuffle, goMix, toMix, toPlaylist, tune, goLive,
      openMixes, openPlaylists, armRadio, closeRadio, changeVolume, seek, expand
    };
    return React.createElement(PlayerCtx.Provider, { value }, children);
  }
  window.PlayerProvider = PlayerProvider;

  function useAccent() {
    const [c, setC] = useState("#d98324");
    useEffect(() => {
      const read = () => { const v = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim(); if (v) setC(v); };
      read(); const t = setInterval(read, 1200); return () => clearInterval(t);
    }, []);
    return c;
  }

  /* =======================================================================
     LIVE BADGE — red while on air; grey "go live" once you're behind.
     ======================================================================= */
  (() => {
    if (document.getElementById("jf-live-kf")) return;
    const s = document.createElement("style"); s.id = "jf-live-kf";
    s.textContent = "@keyframes jfLivePulse{0%,100%{opacity:1}50%{opacity:.25}}";
    document.head.appendChild(s);
  })();
  function LiveBadge({ p, small }) {
    if (!p) return null;
    const on = p.live;
    const lit = on && p.playing;
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); if (!on) p.goLive(); }}
        title={on ? "You're listening live" : "Jump back to live"} aria-label={on ? "Live" : "Go live"}
        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: small ? "0 6px" : "1px 8px", marginRight: 6,
          borderRadius: 999, border: "1px solid " + (on ? "#e5484d" : "rgba(150,150,150,.55)"),
          background: lit ? "rgba(229,72,77,.16)" : "transparent", color: on ? "#e5484d" : "#8f8f8f",
          font: "600 " + (small ? 9 : 10) + "px/1.5 var(--font-mono, ui-monospace, monospace)", letterSpacing: ".08em",
          cursor: on ? "default" : "pointer", verticalAlign: "middle", flex: "none" }}>
        <i style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block",
          animation: lit ? "jfLivePulse 1.6s ease-in-out infinite" : "none" }} />
        {on ? "LIVE" : "GO LIVE"}
      </button>);
  }
  window.LiveBadge = LiveBadge;

  /* =======================================================================
     VISUALIZER — canvas. Real (analyser) for mixes; decorative otherwise.
     style ∈ "radial" | "wave" | "bars"
     ======================================================================= */
  function Visualizer({ style = "radial", real, analyser, color, height }) {
    const ref = useRef(null);
    useEffect(() => {
      const cv = ref.current; if (!cv) return;
      const ctx = cv.getContext("2d");
      let raf, t0 = performance.now();
      const data = new Uint8Array(128);
      const resize = () => {
        const r = cv.getBoundingClientRect();
        cv.width = Math.max(1, r.width) * devicePixelRatio; cv.height = Math.max(1, r.height) * devicePixelRatio;
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      };
      resize();
      const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
      ro && ro.observe(cv);
      let visible = true, last = 0;
      const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; }) : null;
      io && io.observe(cv);
      const frame = (now) => {
        raf = requestAnimationFrame(frame);
        if (document.hidden || !visible) return;
        const an = real && analyser && analyser.current;
        if (now - last < (an ? 0 : 33)) return;
        last = now;
        const W = cv.width / devicePixelRatio, H = cv.height / devicePixelRatio;
        ctx.clearRect(0, 0, W, H);
        let amp = [];
        if (an) {
          if (style === "wave") { an.getByteTimeDomainData(data); for (let i = 0; i < data.length; i++) amp.push((data[i] - 128) / 128); }
          else { an.getByteFrequencyData(data); for (let i = 0; i < data.length; i++) amp.push(data[i] / 255); }
        } else {
          const t = (now - t0) / 1000;
          for (let i = 0; i < 64; i++) {
            const v = 0.5 + 0.5 * Math.sin(t * 2 + i * 0.5) * Math.sin(t * 0.7 + i * 0.2);
            amp.push(style === "wave" ? Math.sin(t * 3 + i * 0.4) * 0.7 : v * (0.4 + 0.6 * Math.abs(Math.sin(i * 0.3 + t))));
          }
        }
        ctx.fillStyle = color; ctx.strokeStyle = color;
        if (style === "bars") {
          const n = Math.min(48, amp.length); const bw = W / n;
          for (let i = 0; i < n; i++) { const h = Math.max(2, amp[i] * H * 0.92); ctx.globalAlpha = 0.55 + 0.45 * amp[i]; ctx.fillRect(i * bw + bw * 0.18, H - h, bw * 0.64, h); }
          ctx.globalAlpha = 1;
        } else if (style === "wave") {
          ctx.lineWidth = 2.2; ctx.beginPath(); const n = amp.length;
          for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * W, y = H / 2 + amp[i] * H * 0.42; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.stroke();
          ctx.globalAlpha = 0.4; ctx.lineWidth = 1.2; ctx.beginPath();
          for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * W, y = H / 2 - amp[i] * H * 0.42; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.stroke(); ctx.globalAlpha = 1;
        } else {
          const cx = W / 2, cy = H / 2, n = Math.min(64, amp.length); const base = Math.min(W, H) * 0.16;
          let avg = amp.slice(0, 16).reduce((a, b) => a + b, 0) / 16;
          ctx.globalAlpha = 0.9; ctx.lineWidth = 2; ctx.beginPath();
          for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, v = amp[i % n]; const rr = base + v * Math.min(W, H) * 0.30; const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.closePath(); ctx.stroke();
          ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.arc(cx, cy, base * (0.7 + avg * 0.6), 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        }
      };
      raf = requestAnimationFrame(frame);
      return () => { cancelAnimationFrame(raf); ro && ro.disconnect(); io && io.disconnect(); };
    }, [style, real, color]);
    return React.createElement("canvas", { className: "viz", ref, style: { height: height || "100%", width: "100%", display: "block" } });
  }
  window.Visualizer = Visualizer;

  let vizKind = "radial";
  window.VizKind = { get: () => vizKind, set: (k) => { vizKind = k; window.dispatchEvent(new CustomEvent("jf-vizkind", { detail: k })); } };
  function useVizKind() {
    const [k, setK] = useState(vizKind);
    useEffect(() => {
      const f = (e) => setK(e.detail);
      window.addEventListener("jf-vizkind", f);
      return () => window.removeEventListener("jf-vizkind", f);
    }, []);
    return k;
  }

  function useTweakVal(key, dflt) {
    const [v, setV] = useState(() => { try { return localStorage.getItem("jf-pv-" + key) || dflt; } catch (e) { return dflt; } });
    useEffect(() => { const f = (e) => { if (e.detail && key in e.detail) setV(e.detail[key]); }; window.addEventListener("tweakchange", f); return () => window.removeEventListener("tweakchange", f); }, []);
    return v;
  }
  window.usePlayerTweak = useTweakVal;

  /* =======================================================================
     BOTTOM BAR — persistent, always top layer. Adapts to the active source.
     ======================================================================= */
  const pbSvg = (d, fill) => <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
  const PBI = {
    prev: pbSvg(<><path d="M17 6v12l-9-6z" fill="currentColor" stroke="none" /><path d="M7 6v12" /></>),
    next: pbSvg(<><path d="M7 6v12l9-6z" fill="currentColor" stroke="none" /><path d="M17 6v12" /></>),
    play: pbSvg(<path d="M9 7v10l8-5z" fill="currentColor" stroke="none" />),
    pause: pbSvg(<path d="M10 7v10M14 7v10" />),
    close: pbSvg(<path d="M7 7l10 10M17 7 7 17" />)
  };
  function PlayerBar() {
    const p = usePlayer();
    const vizStyle = useTweakVal("vizStyle", "radial");
    const barStyle = useTweakVal("barStyle", "float");
    const deskKind = useVizKind();
    const [desk, setDesk] = useState(() => location.hash === "#playground");
    useEffect(() => { const f = () => setDesk(location.hash === "#playground"); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
    if (!p || !p.on) return null;
    const { isMix, mix, playlist, playing, volume, time, dur, accent, live } = p;
    const title = isMix ? (mix ? mix.title : "Radio") : (playlist ? playlist.name : "Playlists");
    const sub = isMix
      ? <><LiveBadge p={p} small />{live ? "on air" : `${fmt(time)} / ${fmt(dur)}`}</>
      : (playlist && playlist.kind === "apple" ? "Apple Music" : "Spotify") + " · press play in panel";
    const seekBar = isMix && !live &&
      <input className="pbar-seek" type="range" min={0} max={dur || 0} step={0.1} value={Math.min(time, dur || 0)}
        onChange={(e) => p.seek(+e.target.value)} style={{ "--pct": (dur ? time / dur * 100 : 0) + "%" }} aria-label="Seek" />;
    const prevTitle = isMix ? "Restart station (twice: previous station)" : "Previous playlist";
    const nextTitle = isMix ? "Next station" : "Next playlist";
    if (desk) return (
      <div className={`pbar pbar-desk ${barStyle === "float" ? "is-float" : "is-full"}`} style={{ "--vc": accent }}>
        <div className="pbar-cover">{window.DeskViz && <window.DeskViz kind={deskKind} grain={0} scan={0} transparent real={isMix && playing} analyser={p.analyser} />}</div>
        <div className="pbar-info">
          <div className="pbar-title">{title}</div>
          <div className="pbar-meta mono">{sub}<span className="pbar-pl">· {isMix ? "Radio" : "Playlists"}</span></div>
          {seekBar}
        </div>
        <div className="pbar-right">
          <div className="pbar-ctrls">
            <button className="pbd-ic" title={prevTitle} onClick={p.prev}>{PBI.prev}</button>
            <button className="pbd-play" title={playing ? "Pause" : "Play"} onClick={p.togglePlay} disabled={!isMix}>{playing ? PBI.pause : PBI.play}</button>
            <button className="pbd-ic" title={nextTitle} onClick={p.next}>{PBI.next}</button>
          </div>
          <div className="pbar-aux">
            {isMix && <input className="pbar-vol" type="range" min={0} max={1} step={0.02} value={volume} onChange={(e) => p.changeVolume(+e.target.value)} title="Volume" aria-label="Volume" />}
            <button className="pbd-ic pb-x" title="Turn radio off" onClick={p.closeRadio}>{PBI.close}</button>
          </div>
        </div>
      </div>);
    return (
      <div className={`pbar ${barStyle === "float" ? "is-float" : "is-full"}`} style={{ "--vc": accent }}>
        <div className="pbar-cover">{window.DeskViz
          ? <window.DeskViz kind={deskKind} grain={0} scan={0} transparent real={isMix && playing} analyser={p.analyser} />
          : <span className="pbar-glyph">{isMix ? "♪" : "♬"}</span>}</div>
        <div className="pbar-info">
          <div className="pbar-title">{title}</div>
          <div className="pbar-meta mono">{sub}<span className="pbar-pl">· {isMix ? "Radio" : "Playlists"}</span></div>
          {seekBar}
        </div>
        <div className="pbar-viz"><Visualizer style={vizStyle} real={isMix && playing} analyser={p.analyser} color={accent} /></div>
        <div className="pbar-ctrls">
          <button className="pb-ic" title={prevTitle} onClick={p.prev}>‹</button>
          <button className="pb-play" title={playing ? "Pause" : "Play"} onClick={p.togglePlay} disabled={!isMix}>{playing ? "❚❚" : "►"}</button>
          <button className="pb-ic" title={nextTitle} onClick={p.next}>›</button>
          {isMix
            ? <input className="pbar-vol" type="range" min={0} max={1} step={0.02} value={volume} onChange={(e) => p.changeVolume(+e.target.value)} title="Volume" />
            : (playlist && playlist.page && <a className="pb-ic" href={playlist.page} target="_blank" rel="noreferrer" title="Open in app">↗</a>)}
          <button className="pb-ic" title="Expand" onClick={p.expand}>▣</button>
          <button className="pb-ic pb-x" title="Turn radio off" onClick={p.closeRadio}>✕</button>
        </div>
      </div>);
  }
  window.PlayerBar = PlayerBar;
})();
