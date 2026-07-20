/* =========================================================================
   player.jsx — the persistent radio. Lives in the SPA shell so it survives
   navigation between the main site and the Playground.

   TWO sources, ONE shared bottom bar (only one ever makes sound):
     • MIXES   (desk "radio")      → real audio files. Full transport in the
                                      bar + the mix panel; real visualizer.
     • PLAYLISTS (desk "headphones")→ Spotify/Apple embeds. The embed plays its
                                      own audio (you press play in it); the bar
                                      shows the name + ↗open + prev/next/shuffle,
                                      with play/seek/volume grayed (browsers
                                      don't allow controlling these embeds).
   Switching sources stops the other (a mix pauses; an embed unloads).

   Exposed on window (separate Babel scopes share these):
     PlayerCtx, usePlayer, PlayerProvider, PlayerBar, Visualizer
   The desk PANELS (MixPanel / PlaylistPanel) are defined in playground.jsx so
   they can reuse the desk drag + z-order helpers.
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

  /* =======================================================================
     PROVIDER
     ======================================================================= */
  // uploaded mixes (audio-store.js) — real shared files, appended after the
  // curated data.js mixes so they show up without disturbing that order.
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
      const base = (PG.mixes || []).filter((m) => m.src)
        .map((m) => ({ id: m.id, title: m.title, src: m.src, coverId: "mix:" + m.id + ":cover" }));
      const up = uploads.map((u) => ({ id: "up:" + u.id, title: u.title || "Untitled mix", src: window.AudioStore.urlFor(u.id), coverId: null, uploaded: true })).filter((m) => m.src);
      return [...base, ...up];
    }, [uploads]);
    const playlists = useMemo(() => (PG.radio || [])
      .map((r) => ({ id: r.name, name: r.name, kind: r.kind, embed: r.embed, page: embedToPage(r.embed) })), []);
    const slots = window.useMediaSlots();

    const [on, setOn] = useState(false);            // radio system on at all
    const [srcType, setSrcType] = useState("mix");   // "mix" | "playlist"
    const [mixIdx, setMixIdx] = useState(0);
    const [plIdx, setPlIdx] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [volume, setVol] = useState(0.9);
    const [time, setTime] = useState(0);
    const [dur, setDur] = useState(0);
    const [mixPanel, setMixPanel] = useState(false);
    const [plPanel, setPlPanel] = useState(false);

    const audioRef = useRef(null);
    const acRef = useRef(null);
    const analyserRef = useRef(null);
    const firstPlayRef = useRef(false);

    const isMix = srcType === "mix";
    const mix = mixes[Math.min(mixIdx, mixes.length - 1)] || null;
    const playlist = playlists[Math.min(plIdx, playlists.length - 1)] || null;

    // create the audio element once
    useEffect(() => {
      if (audioRef.current) return;
      const a = new Audio();
      a.preload = "metadata";
      a.volume = volume;
      // VBR / stream MP3s (DJ sets) report duration=Infinity until buffered;
      // force a real value by seeking far then snapping back.
      let fixing = false;
      const fixDur = () => {
        if (a.duration === Infinity && !fixing) {
          fixing = true;
          const onJump = () => { a.removeEventListener("timeupdate", onJump); a.currentTime = 0; fixing = false; setDur(a.duration || 0); };
          a.addEventListener("timeupdate", onJump);
          try { a.currentTime = 1e7; } catch (e) { fixing = false; }
        }
      };
      a.addEventListener("loadedmetadata", fixDur);
      a.addEventListener("timeupdate", () => setTime(a.currentTime));
      a.addEventListener("durationchange", () => { if (a.duration === Infinity) fixDur(); else setDur(a.duration || 0); });
      a.addEventListener("ended", () => nextRef.current && nextRef.current());
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

    // keep the audio element pointed at the current mix
    useEffect(() => {
      const a = audioRef.current; if (!a) return;
      if (isMix && mix && mix.src) {
        const abs = new URL(mix.src, location.href).href;
        if (a.src !== abs) { a.src = mix.src; setTime(0); setDur(0); }
      }
    }, [mixIdx, isMix]);

    const playAudio = useCallback(() => {
      const a = audioRef.current; if (!a) return;
      ensureGraph();
      if (acRef.current && acRef.current.state === "suspended") acRef.current.resume();
      const p = a.play(); if (p && p.catch) p.catch(() => {});
    }, [ensureGraph]);

    const togglePlay = useCallback(() => {
      if (!isMix) return;
      const a = audioRef.current; if (!a) return;
      if (a.paused) playAudio(); else a.pause();
    }, [isMix, playAudio]);

    // ── switch which mix plays ──
    const goMix = useCallback((i, autoplay) => {
      const n = mixes.length; if (!n) return;
      const nx = (i + n) % n; setMixIdx(nx);
      if (autoplay !== false) setTimeout(playAudio, 60);
    }, [mixes, playAudio]);

    // ── activate a SOURCE (stops the other) ──
    const toMix = useCallback((autoplay) => {
      setSrcType("mix");                 // unmounts the embed → its audio stops
      if (autoplay) setTimeout(playAudio, 60);
    }, [playAudio]);
    const toPlaylist = useCallback((i) => {
      const a = audioRef.current; if (a) a.pause();   // stop the mix
      if (typeof i === "number") setPlIdx((i + playlists.length) % playlists.length);
      setSrcType("playlist");
    }, [playlists]);

    // ── unified prev/next/shuffle that act on the ACTIVE group ──
    const next = useCallback(() => {
      if (isMix) goMix(mixIdx + 1, true);
      else setPlIdx((i) => (i + 1) % playlists.length);
    }, [isMix, mixIdx, goMix, playlists]);
    const prev = useCallback(() => {
      if (isMix) {
        const a = audioRef.current;
        if (a && a.currentTime > 3) { a.currentTime = 0; return; }
        goMix(mixIdx - 1, true);
      } else setPlIdx((i) => (i - 1 + playlists.length) % playlists.length);
    }, [isMix, mixIdx, goMix, playlists]);
    const nextRef = useRef(next); nextRef.current = next;
    const shuffle = useCallback(() => {
      if (isMix) { if (mixes.length > 1) { let n; do { n = Math.floor(Math.random() * mixes.length); } while (n === mixIdx); goMix(n, true); } }
      else if (playlists.length > 1) { let n; do { n = Math.floor(Math.random() * playlists.length); } while (n === plIdx); setPlIdx(n); }
    }, [isMix, mixes, mixIdx, goMix, playlists, plIdx]);

    // ── desk objects open these ──
    const openMixes = useCallback(() => {
      setOn(true); setMixPanel(true); setSrcType("mix");
      if (!firstPlayRef.current) {           // user asked: wait a beat the FIRST time
        firstPlayRef.current = true;
        setTimeout(playAudio, 900);
      } else setTimeout(playAudio, 60);
    }, [playAudio]);
    const openPlaylists = useCallback(() => {
      const a = audioRef.current; if (a) a.pause();
      setOn(true); setPlPanel(true); setSrcType("playlist");
    }, []);

    const closeRadio = useCallback(() => {
      const a = audioRef.current; if (a) a.pause();
      setOn(false); setMixPanel(false); setPlPanel(false); setPlaying(false);
    }, []);

    const changeVolume = useCallback((v) => { setVol(v); const a = audioRef.current; if (a) a.volume = v; }, []);
    const seek = useCallback((v) => { const a = audioRef.current; if (a && isFinite(a.duration)) { a.currentTime = v; setTime(v); } }, []);

    const cover = isMix && mix && mix.coverId ? window.MediaSlots.crop(slots, mix.coverId) : null;
    const accent = useAccent();

    // expand from the bar → open the right panel (and hop to the playground)
    const expand = useCallback(() => {
      if (isMix) setMixPanel(true); else setPlPanel(true);
      if (location.hash.replace("#", "") !== "playground") location.hash = "playground";
    }, [isMix]);

    const value = {
      mixes, playlists, on, srcType, isMix, mixIdx, plIdx, mix, playlist,
      playing, volume, time, dur, cover, accent,
      mixPanel, plPanel, analyser: analyserRef,
      setMixPanel, setPlPanel,
      togglePlay, next, prev, shuffle, goMix, toMix, toPlaylist,
      openMixes, openPlaylists, closeRadio, changeVolume, seek, expand
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
      const frame = (now) => {
        const W = cv.width / devicePixelRatio, H = cv.height / devicePixelRatio;
        ctx.clearRect(0, 0, W, H);
        const an = real && analyser && analyser.current;
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
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      return () => { cancelAnimationFrame(raf); ro && ro.disconnect(); };
    }, [style, real, color]);
    return React.createElement("canvas", { className: "viz", ref, style: { height: height || "100%", width: "100%", display: "block" } });
  }
  window.Visualizer = Visualizer;

  /* tiny live reader for the vizStyle / barStyle tweaks (mirrored to localStorage
     by the main app's Tweaks; player is a separate scope) */
  function useTweakVal(key, dflt) {
    const [v, setV] = useState(() => { try { return localStorage.getItem("jf-pv-" + key) || dflt; } catch (e) { return dflt; } });
    useEffect(() => { const f = (e) => { if (e.detail && key in e.detail) setV(e.detail[key]); }; window.addEventListener("tweakchange", f); return () => window.removeEventListener("tweakchange", f); }, []);
    return v;
  }
  window.usePlayerTweak = useTweakVal;

  /* =======================================================================
     BOTTOM BAR — persistent, always top layer. Adapts to the active source.
     ======================================================================= */
  function PlayerBar() {
    const p = usePlayer();
    const vizStyle = useTweakVal("vizStyle", "radial");
    const barStyle = useTweakVal("barStyle", "full");
    if (!p || !p.on) return null;
    const { isMix, mix, playlist, playing, volume, time, dur, cover, accent } = p;
    const title = isMix ? (mix ? mix.title : "My Mixes") : (playlist ? playlist.name : "Playlists");
    const sub = isMix ? `${fmt(time)} / ${fmt(dur)}` : (playlist && playlist.kind === "apple" ? "Apple Music" : "Spotify") + " · press play in panel";
    return (
      <div className={`pbar ${barStyle === "float" ? "is-float" : "is-full"}`} style={{ "--vc": accent }}>
        <div className="pbar-cover">{cover ? <img src={cover.u} alt="" /> : <span className="pbar-glyph">{isMix ? "♪" : "♬"}</span>}</div>
        <div className="pbar-info">
          <div className="pbar-title">{title}</div>
          <div className="pbar-meta mono">{sub}<span className="pbar-pl">· {isMix ? "My Mixes" : "Playlists"}</span></div>
          {isMix &&
          <input className="pbar-seek" type="range" min={0} max={dur || 0} step={0.1} value={Math.min(time, dur || 0)}
            onChange={(e) => p.seek(+e.target.value)} style={{ "--pct": (dur ? time / dur * 100 : 0) + "%" }} />}
        </div>
        <div className="pbar-viz"><Visualizer style={vizStyle} real={isMix && playing} analyser={p.analyser} color={accent} /></div>
        <div className="pbar-ctrls">
          <button className="pb-ic" title={isMix ? "Previous mix" : "Previous playlist"} onClick={p.prev}>‹</button>
          <button className="pb-play" title={playing ? "Pause" : "Play"} onClick={p.togglePlay} disabled={!isMix}>{playing ? "❚❚" : "►"}</button>
          <button className="pb-ic" title={isMix ? "Next mix" : "Next playlist"} onClick={p.next}>›</button>
          <button className="pb-ic" title="Shuffle" onClick={p.shuffle}>⚄</button>
          {isMix
            ? <input className="pbar-vol" type="range" min={0} max={1} step={0.02} value={volume} onChange={(e) => p.changeVolume(+e.target.value)} title="Volume" />
            : (playlist && playlist.page && <a className="pb-ic" href={playlist.page} target="_blank" rel="noreferrer" title="Open in app">↗</a>)}
          <button className="pb-ic" title="Expand" onClick={p.expand}>▣</button>
          <button className="pb-ic pb-x" title="Close radio" onClick={p.closeRadio}>✕</button>
        </div>
      </div>);
  }
  window.PlayerBar = PlayerBar;
})();
