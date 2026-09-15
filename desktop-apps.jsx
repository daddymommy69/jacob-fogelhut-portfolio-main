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

  /* ---- My Projects: folder of personal projects; web ones open live ---- */
  function ProjectsApp({ open }) {
    return (
      <div className="dk-files">
        {(PG.projects || []).map((p) =>
          <button key={p.id} className="dk-file" onClick={() => open(p.kind === "web" ? "web:" + p.id : "img:" + p.id)}>
            {p.kind === "web" ? <I.Web s={38} /> : <I.Img s={38} />}<span>{p.title}</span>
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
  function ImageApp({ project }) {
    return (<div><div className="dk-shots"><button style={{ cursor: "default" }}>{project.pending ? null : <img src={project.src} alt={project.title} />}</button></div><p style={{ marginTop: 10 }}>{project.note}</p></div>);
  }

  /* ---- Radio: drives the shared player, so it keeps going elsewhere ---- */
  function RadioApp() {
    const p = window.usePlayer();
    if (!p) return <p>Radio unavailable.</p>;
    return (
      <div>
        <h4>Radio</h4>
        <div className="dk-tabs">
          {p.mixes.map((m, i) =>
            <button key={m.id} className={`dk-tab ${p.isMix && p.mixIdx === i ? "on" : ""}`} onClick={() => p.toMix(i)}>{m.title}</button>)}
        </div>
        <div className="dk-tabs">
          {p.playlists.map((pl, i) =>
            <button key={pl.id} className={`dk-tab ${!p.isMix && p.plIdx === i ? "on" : ""}`} onClick={() => p.toPlaylist(i)}>{pl.name}</button>)}
        </div>
        <div className="dk-row">
          <button className="dk-btn" onClick={p.togglePlay}>{p.playing ? "Pause" : "Play"}</button>
          <button className="dk-btn" onClick={p.prev}>Prev</button>
          <button className="dk-btn" onClick={p.next}>Next</button>
          <button className="dk-btn" onClick={p.shuffle}>Shuffle</button>
        </div>
        <p style={{ marginTop: 10, fontSize: 12, color: "#6b6452" }}>Playing: {p.isMix ? (p.mix && p.mix.title) : (p.playlist && p.playlist.name)}</p>
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
    const [big, setBig] = useState(null);
    const live = cats.filter((c) => c.photos.length);
    if (!live.length) return <p>No photos uploaded yet.</p>;
    const cur = live[Math.min(tab, live.length - 1)];
    return (
      <div>
        <div className="dk-tabs">{live.map((c, i) => <button key={c.a} className={`dk-tab ${cur === c ? "on" : ""}`} onClick={() => setTab(i)}>{c.name}</button>)}</div>
        <div className="dk-shots">{cur.photos.map((ph, i) => <button key={i} onClick={() => setBig(ph)}><CroppedImg value={ph} alt="" /></button>)}</div>
        {big && <div className="dk-lb" onClick={() => setBig(null)}><CroppedImg value={big} alt="" /></div>}
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
  function DecksApp() {
    return (<div>{(DATA.decks || []).map((d) =>
      <a key={d.id} className="dk-deck" href={`mailto:${DATA.email}?subject=${encodeURIComponent("Deck request — " + d.client + " " + d.title)}`}>
        <I.Deck s={30} /><span><b>{d.client} — {d.title}</b><small>{d.note} · click to request</small></span>
      </a>)}</div>);
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

  /* ---- Font story ---- */
  function FontApp() {
    const fs = PG.fontStory || {};
    const slots = window.useMediaSlots();
    const cover = window.MediaSlots.crop(slots, "font:cover");
    const scan = window.MediaSlots.crop(slots, "font:scan");
    const [sample, setSample] = useState(fs.previewPlaceholder || "type something");
    return (
      <div>
        <h4>{fs.title || "The font"}</h4>
        {cover && <div className="dk-shots" style={{ gridTemplateColumns: "1fr", marginBottom: 10 }}><button style={{ aspectRatio: "16/9", cursor: "default" }}><CroppedImg value={cover} alt="" /></button></div>}
        <p style={{ whiteSpace: "pre-wrap" }}>{fs.story || ""}</p>
        <div className="dk-paper" style={{ marginTop: 12, fontSize: 26 }}>{sample || " "}</div>
        <textarea className="dk-ta" value={sample} onChange={(e) => setSample(e.target.value)} />
        {scan && <div className="dk-shots" style={{ marginTop: 10 }}><button style={{ cursor: "default" }}><CroppedImg value={scan} alt="" /></button></div>}
        <div className="dk-row"><a className="dk-btn" href="fonts/jacob-custom.otf" download="Lloyd Fogelhut.otf">Download the font</a></div>
      </div>);
  }

  /* ---- readme + recycle bin ---- */
  function ReadmeApp() { return <div style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{PG.about}</div>; }
  function TrashApp() {
    const lines = ["nice try.", "that idea stays buried.", "you didn't see anything.", "deleted for a reason.", "the cutting room floor."];
    const [msg, setMsg] = useState("");
    return (<div className="dk-trash">
      {(PG.trash || []).map((f, i) => <button key={f} onClick={() => setMsg(lines[i % lines.length])}><I.Note s={18} />{f}</button>)}
      <div className="dk-trash-msg">{msg}</div>
    </div>);
  }

  window.DeskApps = {
    registry: {
      projects: { title: "My Projects", Icon: I.Folder, body: (ctx) => <ProjectsApp open={ctx.open} />, size: { w: 460, h: 320 } },
      radio: { title: "Radio", Icon: I.Radio, body: () => <RadioApp />, size: { w: 430, h: 300 } },
      photos: { title: "Photos", Icon: I.Photos, body: () => <PhotosApp />, size: { w: 520, h: 380 } },
      paint: { title: "Paint", Icon: I.Paint, body: () => <PaintApp />, size: { w: 520, h: 400 } },
      decks: { title: "Pitch Decks", Icon: I.Deck, body: () => <DecksApp />, size: { w: 460, h: 300 } },
      guestbook: { title: "Guestbook", Icon: I.Book, body: () => <GuestbookApp />, size: { w: 470, h: 400 } },
      letter: { title: "Write me a letter", Icon: I.Letter, body: () => <LetterApp />, size: { w: 440, h: 400 } },
      font: { title: "The font", Icon: I.Font, body: () => <FontApp />, size: { w: 470, h: 420 } },
      trash: { title: "Recycle Bin", Icon: I.Bin, body: () => <TrashApp />, size: { w: 400, h: 280 } },
      readme: { title: "readme.txt", Icon: I.Note, body: () => <ReadmeApp />, size: { w: 400, h: 260 } }
    },
    webApp: (p) => ({ title: p.title + " — Internet", Icon: I.Web, body: () => <WebApp project={p} />, size: { w: 640, h: 460 } }),
    imageApp: (p) => ({ title: p.title, Icon: I.Img, body: () => <ImageApp project={p} />, size: { w: 460, h: 380 } })
  };
})();
