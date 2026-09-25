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

  /* ---- Folders: Design / Web Concepts hold PG.projects by their `folder`.
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
  const lk = (t) => (window.linkify ? window.linkify(t) : t);
  function ImageApp({ project }) {
    const slots = window.useMediaSlots();
    const v = projImg(slots, project);
    return (<div><div className="dk-shots"><button style={{ cursor: "default" }}>{v ? <CroppedImg value={v} alt={project.title} /> : null}</button></div><p style={{ marginTop: 10 }}>{lk(project.note)}</p></div>);
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
    const [big, setBig] = useState(null);
    useEffect(() => {
      if (!big) return;
      const onKey = (e) => e.key === "Escape" && setBig(null);
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [big]);
    const live = cats.filter((c) => c.photos.length);
    if (!live.length) return <p>No photos uploaded yet.</p>;
    const cur = live[Math.min(tab, live.length - 1)];
    return (
      <div className="dk-fill">
        <div className="dk-tabs">{live.map((c, i) => <button key={c.a} className={`dk-tab ${cur === c ? "on" : ""}`} data-krinky={"album:" + c.a} onClick={() => setTab(i)}>{c.name}</button>)}</div>
        <div className="dk-shots">{cur.photos.map((ph, i) => <button key={i} onClick={() => setBig(ph)}><CroppedImg value={ph} alt="" /></button>)}</div>
        {big && <div className="dk-lb" onClick={(e) => e.target === e.currentTarget && setBig(null)}>
          <img className="dk-native" src={srcOf(big)} alt="" draggable={false}
          onPointerDown={(e) => panPhoto(e, () => setBig(null))} />
        </div>}
        {/* sibling, not a child: .dk-lb scrolls, so a close button inside it
            would scroll out of reach on a photo larger than the window */}
        {big && <button className="dk-lb-x" onClick={() => setBig(null)} aria-label="Close">✕</button>}
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
    registry: {
      design: { title: "Design", Icon: I.FolderDesign, tint: "#9b5e39", body: (ctx) => <FolderApp open={ctx.open} folder="design" />, size: { w: 460, h: 320 }, min: { w: 320, h: 240 } },
      web: { title: "Web Concepts", Icon: I.FolderWeb, tint: "#41669a", body: (ctx) => <FolderApp open={ctx.open} folder="web" />, size: { w: 460, h: 320 }, min: { w: 320, h: 240 } },
      radio: { title: "Radio", Icon: I.Radio, tint: "#5b6b8c", mini: true },
      listening: { title: "What I'm listening to", Icon: I.Headphones, tint: "#5c3560", body: () => <ListeningApp />, size: { w: 720, h: 620 }, min: { w: 560, h: 420 } },
      photos: { title: "Photos", Icon: I.Photos, tint: "#6b4a70", body: () => <PhotosApp />, size: { w: 520, h: 380 }, min: { w: 400, h: 320 } },
      paint: { title: "Paint", Icon: I.Paint, tint: "#9b5e39", body: () => <PaintApp />, size: { w: 520, h: 400 }, min: { w: 420, h: 300 } },
      decks: { title: "Pitch Decks", Icon: I.FolderDecks, tint: "#3c6b68", body: () => <DecksApp />, size: { w: 460, h: 300 }, min: { w: 340, h: 220 } },
      guestbook: { title: "Guestbook", Icon: I.Book, tint: "#66743c", body: () => <GuestbookApp />, size: { w: 470, h: 400 }, min: { w: 340, h: 300 } },
      letter: { title: "Write me a letter", Icon: I.Letter, tint: "#8a6a2f", body: () => <LetterApp />, size: { w: 440, h: 400 }, min: { w: 360, h: 320 } },
      font: { title: "The font", Icon: I.Font, tint: "#7a4a5e", bleed: true, body: () => <FontApp />, size: { w: 660, h: 620 }, min: { w: 400, h: 400 } },
      trash: { title: "Recycle Bin", Icon: I.Bin, tint: "#555a61", body: () => <TrashApp />, size: { w: 400, h: 280 }, min: { w: 280, h: 200 } },
      readme: { title: "readme.txt", Icon: I.Note, tint: "#4c5b67", body: () => <ReadmeApp />, size: { w: 400, h: 260 }, min: { w: 300, h: 220 } }
    },
    webApp: (p) => ({ title: p.title + " — Internet", Icon: I.Web, tint: "#41669a", body: () => <WebApp project={p} />, size: { w: 640, h: 460 }, min: { w: 420, h: 320 } }),
    imageApp: (p) => ({ title: p.title, Icon: I.Img, tint: "#6b4a70", body: () => <ImageApp project={p} />, size: { w: 460, h: 380 }, min: { w: 320, h: 260 } })
  };
})();
