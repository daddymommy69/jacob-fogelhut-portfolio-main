/* =========================================================================
   media-edit.jsx — the on-page "edit this view" layer (WORKSPACE ONLY).

   Renders only when window.omelette.writeFile exists (the workspace) — never
   on the published GitHub Pages build, so visitors never see edit handles.
   Lets Jacob, per project:
     • drop / reframe / reorder Title pictures + Gallery (<image-slot> + MediaStore)
     • edit Tags (clickable multi-tags), Title, Role, Brands  → window.ProjInfo
     • set a hover / project VIDEO (drop a clip · a /media filename · a YouTube
       or Instagram link) and trim the hover loop with two draggable handles.
   Exposes window.MediaEditor (overlay) + window.MEDIT_EDITABLE.
   ========================================================================= */
(function () {
  const EDITABLE = !!(window.omelette && window.omelette.writeFile);
  window.MEDIT_EDITABLE = EDITABLE;
  if (!EDITABLE) { window.MediaEditor = function () {return null;}; return; }

  const { useRef, useState, useEffect } = React;

  /* ---- reorderable row of fixed image slots (title pics / gallery) ---- */
  function SlotRow({ label, sub, ids, shape = "rounded", h = 120 }) {
    const wrapRef = useRef(null);
    const [drag, setDrag] = useState(null);
    const nearest = (x, y) => {
      const cells = [...wrapRef.current.querySelectorAll(".medit-cell")];
      let best = 0, bd = Infinity;
      cells.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
        if (d < bd) {bd = d;best = i;}
      });
      return best;
    };
    const start = (from) => (e) => {
      e.preventDefault();e.stopPropagation();
      setDrag({ from, to: from });
      const move = (ev) => setDrag((d) => d ? { ...d, to: nearest(ev.clientX, ev.clientY) } : d);
      const up = (ev) => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        const to = nearest(ev.clientX, ev.clientY);
        setDrag(null);
        if (to !== from && window.MediaStore && window.MediaStore.reorder)
        window.MediaStore.reorder(ids, from, to);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };
    return (
      <div className="medit-rowblk">
        <div className="medit-rowblk-h"><b>{label}</b><span className="mono">{sub}</span></div>
        <div className="medit-cells" ref={wrapRef}>
          {ids.map((id, i) =>
          <div key={id}
            className={`medit-cell ${drag && drag.from === i ? "is-drag" : ""} ${drag && drag.to === i && drag.from !== i ? "is-target" : ""}`}>
              <span className="medit-grip" onPointerDown={start(i)} title="Drag to reorder">⠿</span>
              <image-slot id={id} shape={shape} radius="6" placeholder={String(i + 1)} fit="cover" style={{ width: "100%", height: h + "px" }}></image-slot>
              <span className="medit-num mono">{i + 1}</span>
            </div>
          )}
        </div>
      </div>);
  }

  /* ---- chip editor (tags / brands) ---- */
  function ChipEdit({ label, hint, values, onChange }) {
    const [txt, setTxt] = useState("");
    const add = () => { const v = txt.trim(); if (!v) return; if (!values.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...values, v]); setTxt(""); };
    const remove = (v) => onChange(values.filter((x) => x !== v));
    return (
      <div className="medit-field">
        <label className="medit-lbl"><b>{label}</b> <span className="mono">{hint}</span></label>
        <div className="medit-chips">
          {values.map((v) => <span className="medit-chip" key={v}>{v}<button onClick={() => remove(v)} aria-label={"Remove " + v}>✕</button></span>)}
        </div>
        <div className="medit-chip-add">
          <input value={txt} placeholder="add…" onChange={(e) => setTxt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
          <button className="medit-btn" onClick={add}>Add</button>
        </div>
      </div>);
  }

  /* ---- two-handle video trim bar (hover loop in/out) ---- */
  function TrimBar({ src, vin, vout, onCommit }) {
    const vidRef = useRef(null), barRef = useRef(null);
    const [dur, setDur] = useState(0);
    const [inS, setInS] = useState(vin || 0);
    const [outS, setOutS] = useState(vout || 0);
    const inRef = useRef(inS), outRef = useRef(outS);
    inRef.current = inS; outRef.current = outS;
    useEffect(() => { setInS(vin || 0); setOutS(vout || 0); }, [vin, vout, src]);
    const effOut = outS > inS ? outS : dur;
    const pct = (t) => dur ? Math.max(0, Math.min(100, t / dur * 100)) : 0;
    const fmt = (t) => (isFinite(t) ? t : 0).toFixed(1) + "s";

    const drag = (which) => (e) => {
      e.preventDefault(); e.stopPropagation();
      const bar = barRef.current.getBoundingClientRect();
      const move = (ev) => {
        if (!dur) return;
        let t = Math.max(0, Math.min(dur, (ev.clientX - bar.left) / bar.width * dur));
        if (which === "in") { t = Math.min(t, (outRef.current > inRef.current ? outRef.current : dur) - 0.2); setInS(t); inRef.current = t; }
        else { t = Math.max(t, inRef.current + 0.2); setOutS(t); outRef.current = t; }
        if (vidRef.current) vidRef.current.currentTime = t;
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        onCommit(Math.round(inRef.current * 10) / 10, Math.round((outRef.current > inRef.current ? outRef.current : 0) * 10) / 10);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };

    const preview = () => { const v = vidRef.current; if (!v) return; v.currentTime = inS; v.play().catch(() => {}); };
    const onTime = () => { const v = vidRef.current; if (!v) return; const o = outS > inS ? outS : dur; if (v.currentTime >= o) v.currentTime = inS; };

    return (
      <div className="medit-trim">
        <video ref={vidRef} src={src} muted playsInline preload="metadata"
          onLoadedMetadata={(e) => { setDur(e.currentTarget.duration || 0); e.currentTarget.currentTime = inS; }}
          onTimeUpdate={onTime} />
        <div className="trim-track" ref={barRef}>
          <div className="trim-range" style={{ left: pct(inS) + "%", right: (100 - pct(effOut)) + "%" }}></div>
          <span className="trim-h trim-in" style={{ left: pct(inS) + "%" }} onPointerDown={drag("in")}></span>
          <span className="trim-h trim-out" style={{ left: pct(effOut) + "%" }} onPointerDown={drag("out")}></span>
        </div>
        <div className="trim-row">
          <button className="medit-btn" onClick={preview}>▶ Preview loop</button>
          <span className="mono">in {fmt(inS)} · out {fmt(effOut)} {dur ? "· clip " + fmt(effOut - inS) : ""}</span>
        </div>
      </div>);
  }

  /* ---- video section ---- */
  function VideoField({ item }) {
    const [, bump] = useState(0);
    const rerender = () => bump((n) => n + 1);
    const [err, setErr] = useState("");
    useEffect(() => { setErr(""); }, [item.id]);
    const PI = window.ProjInfo;
    const MAX = 6;
    const videos = PI.normVideos(item.id);
    const coverId = (PI.coverVid(item.id) || {}).vid || null;
    const mode = PI.coverMode(item.id);

    const commit = (next, extra) => { PI.setVideos(item.id, next, extra || {}); rerender(); };
    const patchVideo = (idx, patch) => commit(videos.map((v, i) => i === idx ? { ...v, ...patch } : v));
    const removeVideo = (idx) => {
      const v = videos[idx];
      if (v && v.type === "drop") PI.setDropClip(item.id, v.vid, null);
      const next = videos.filter((_, i) => i !== idx);
      commit(next, coverId === (v && v.vid) ? { cover: next[0] ? next[0].vid : null } : {});
    };
    const addVideo = () => {
      if (videos.length >= MAX) return;
      const vid = "v" + Date.now().toString(36);
      commit([...videos, { vid, type: "mp4", src: "" }], videos.length === 0 ? { cover: vid, coverMode: "video" } : {});
    };
    const onDrop = (idx, file) => {
      if (!file || !/^video\//.test(file.type)) { setErr("Drop a video file (mp4/webm/mov)."); return; }
      const res = PI.setDropClip(item.id, videos[idx].vid, file);
      if (!res.ok) { setErr("That clip is too large (100MB max). Compress it, or send it to me for /media and use the filename field."); return; }
      setErr(""); patchVideo(idx, { type: "drop" });
    };

    return (
      <div className="medit-rowblk">
        <div className="medit-rowblk-h"><b>Project videos</b><span className="mono">stack on the project page · pick one as the card cover</span></div>
        <div className="medit-note mono">Give matching videos the same “Group” name (e.g. “Content”) to cluster them under their own heading on the page — leave it blank for the main piece(s).</div>

        <div className="medit-covermode">
          <span className="mono">Card cover</span>
          <button className={`medit-seg ${mode === "pictures" ? "on" : ""}`} onClick={() => commit(videos, { coverMode: "pictures" })}>Picture cycle</button>
          <button className={`medit-seg ${mode === "video" ? "on" : ""}`} onClick={() => commit(videos, { coverMode: "video" })}>Video loop</button>
        </div>

        {videos.map((v, idx) =>
          <VideoRow key={v.vid} item={item} v={v} isCover={v.vid === coverId}
            onPatch={(p) => patchVideo(idx, p)} onDrop={(f) => onDrop(idx, f)}
            onRemove={() => removeVideo(idx)} onSetCover={() => commit(videos, { cover: v.vid })} />)}

        {err && <div className="medit-err mono">{err}</div>}
        {videos.length < MAX &&
          <button className="medit-btn medit-addvid" onClick={addVideo}>+ Add video</button>}
        {!videos.length && <div className="medit-note mono">No videos yet. Add one to show it on the project page or use it as the card cover.</div>}
      </div>);
  }

  /* ---- one video in the project's video list ---- */
  function VideoRow({ item, v, isCover, onPatch, onDrop, onRemove, onSetCover }) {
    const PI = window.ProjInfo;
    const url = PI.videoUrlFor(item.id, v);
    const playable = v.type === "drop" || v.type === "mp4" || v.type === "file";
    const trimSrc = v.type === "drop" ? url : (v.type === "mp4" || v.type === "file") ? v.src : null;
    const [txt, setTxt] = useState(v.type !== "drop" ? (v.src || "") : "");
    useEffect(() => { setTxt(v.type !== "drop" ? (v.src || "") : ""); }, [v.type, v.vid]);
    return (
      <div className={`medit-vrow ${isCover ? "is-cover" : ""}`}>
        <div className="medit-vrow-top">
          <label className="medit-cover-pick"><input type="radio" checked={isCover} onChange={onSetCover} /> Cover</label>
          <label className="medit-cover-pick"><input type="checkbox" checked={!v.hidden} onChange={(e) => onPatch({ hidden: !e.target.checked })} /> On page</label>
          <input className="medit-vlabel" value={v.label || ""} placeholder="Label (optional)" onChange={(e) => onPatch({ label: e.target.value })} />
          <input className="medit-vlabel" value={v.group || ""} placeholder="Group (optional, e.g. Content)" onChange={(e) => onPatch({ group: e.target.value })} />
          <button className="medit-vremove" onClick={onRemove} title="Remove video">✕</button>
        </div>
        <div className="medit-vtypes">
          {[["drop", "Drop a clip"], ["file", "/media file"], ["mp4", "MP4 link"], ["youtube", "YouTube"], ["instagram", "Instagram"]].map(([t, l]) =>
            <button key={t} className={`medit-seg ${v.type === t ? "on" : ""}`} onClick={() => onPatch({ type: t })}>{l}</button>)}
        </div>

        {v.type === "drop" &&
          <div className="medit-drop" onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files && e.dataTransfer.files[0]); }}>
            <input type="file" accept="video/*" id={`vf-${item.id}-${v.vid}`} hidden onChange={(e) => onDrop(e.target.files && e.target.files[0])} />
            <label htmlFor={`vf-${item.id}-${v.vid}`} className="medit-drop-in">
              {url ? "✓ clip loaded — drop another to replace" : "Drop a clip here (up to 100MB), or click to browse"}
            </label>
          </div>}

        {(v.type === "file" || v.type === "mp4" || v.type === "youtube" || v.type === "instagram") &&
          <div className="medit-chip-add">
            <input value={txt} placeholder={v.type === "file" ? "media/clip.mp4" : v.type === "youtube" ? "https://youtube.com/watch?v=…" : v.type === "instagram" ? "https://instagram.com/p/…" : "https://…/clip.mp4"}
              onChange={(e) => setTxt(e.target.value)} onBlur={() => onPatch({ src: txt })} onKeyDown={(e) => { if (e.key === "Enter") onPatch({ src: txt }); }} />
            <button className="medit-btn" onClick={() => onPatch({ src: txt })}>Save</button>
          </div>}

        {v.type === "instagram" &&
          <div className="medit-chip-add" style={{ marginTop: 6 }}>
            <input defaultValue={v.poster || ""} placeholder="Thumbnail image URL (a screenshot of the post) — optional"
              onBlur={(e) => onPatch({ poster: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") onPatch({ poster: e.target.value }); }} />
          </div>}

        {playable && trimSrc &&
          <>
            <div className="medit-lbl" style={{ marginTop: 10 }}><b>Trim the hover loop</b> <span className="mono">drag the two handles</span></div>
            <TrimBar src={trimSrc} vin={v.in || 0} vout={v.out || 0} onCommit={(inS, outS) => onPatch({ in: inS, out: outS })} />
            {isCover &&
              <VideoCrop item={item} src={trimSrc} crop={v.crop || null} onCommit={(cl) => onPatch({ crop: cl })} />}
          </>}
        {(v.type === "youtube" || v.type === "instagram") &&
          <div className="medit-note mono" style={{ marginTop: 8 }}>Links play on the opened project only — a card cover video-loop needs a dropped clip, /media file, or MP4 link.</div>}
      </div>);
  }

  /* ---- video crop for the title-picture card (drag to pan, zoom slider) ---- */
  function VideoCrop({ item, src, crop, onCommit }) {
    const boxRef = useRef(null), vidRef = useRef(null);
    const [c, setC] = useState(crop || { s: 1, x: 0, y: 0 });
    const [box, setBox] = useState(null);
    useEffect(() => { setC(crop || { s: 1, x: 0, y: 0 }); }, [item.id, src]);
    const measure = () => {
      const b = boxRef.current, v = vidRef.current;
      if (b && v && v.videoWidth) setBox({ fw: b.clientWidth, fh: b.clientHeight, iw: v.videoWidth, ih: v.videoHeight });
    };
    const apply = (next) => {
      const cl = box ? window.coverClamp(box.fw, box.fh, box.iw, box.ih, next) : next;
      setC(cl); onCommit(cl);
    };
    const onDown = (e) => {
      e.preventDefault();
      if (!box) return;
      const start = { px: e.clientX, py: e.clientY, x: c.x || 0, y: c.y || 0 };
      const move = (ev) => apply({ s: c.s, x: start.x + (ev.clientX - start.px) / box.fw * 100, y: start.y + (ev.clientY - start.py) / box.fh * 100 });
      const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    };
    const style = box ? window.coverBoxStyle(box.fw, box.fh, box.iw, box.ih, c) : { width: "100%", height: "100%", objectFit: "cover", position: "absolute" };
    return (
      <div className="medit-vcrop">
        <div className="medit-lbl" style={{ marginTop: 10 }}><b>Crop on the card</b> <span className="mono">drag to reposition · zoom below</span></div>
        <div className="medit-vcrop-box" ref={boxRef} onPointerDown={onDown}>
          <video ref={vidRef} src={src} muted playsInline preload="metadata" style={style}
            onLoadedMetadata={measure} />
        </div>
        <div className="medit-vcrop-ctl">
          <span className="mono">Zoom</span>
          <input type="range" min="1" max="4" step="0.01" value={c.s || 1}
            onChange={(e) => apply({ s: parseFloat(e.target.value), x: c.x, y: c.y })} />
          <button className="medit-btn" onClick={() => apply({ s: 1, x: 0, y: 0 })}>Reset</button>
        </div>
      </div>);
  }

  /* ---- info fields (tags / title / role / brands) ---- */
  function InfoFields({ item }) {
    const o = window.ProjInfo.get(item.id) || {};
    const r = window.resolveItem(item);
    const [, bump] = useState(0);
    const set = (patch) => { window.ProjInfo.set(item.id, patch); bump((n) => n + 1); };
    return (
      <div className="medit-info">
        <div className="medit-field">
          <label className="medit-lbl"><b>Title</b></label>
          <input className="medit-input" defaultValue={r.title} key={"t" + item.id}
            onBlur={(e) => set({ title: e.target.value.trim() === item.title ? null : e.target.value.trim() })} />
        </div>
        <div className="medit-field">
          <label className="medit-lbl"><b>Role / description</b></label>
          <textarea className="medit-input" rows="2" defaultValue={r.role} key={"r" + item.id}
            onBlur={(e) => set({ role: e.target.value.trim() === item.role ? null : e.target.value.trim() })}></textarea>
        </div>
        <ChipEdit label="Tags" hint="click a tag on the site to filter" values={r.tags}
          onChange={(tags) => set({ tags })} />
        <ChipEdit label="Brands" hint="which brands this counts toward (for 'More from …')" values={r.brands}
          onChange={(brands) => set({ brands })} />
      </div>);
  }

  function MediaEditor({ item, onClose }) {
    if (!item) return null;
    const titleIds = window.titleStillIds(item.id);
    const galleryIds = Array.from({ length: 6 }, (_, i) => "gallery:" + item.id + ":" + i);
    return (
      <div className="medit" onClick={onClose}>
        <div className="medit-card" onClick={(e) => e.stopPropagation()}>
          <div className="medit-head">
            <div className="medit-title"><b>Edit project</b><span className="mono">{item.title}</span></div>
            <button className="medit-x" onClick={onClose} aria-label="Close">✕</button>
          </div>
          <div className="medit-note mono">
            Workspace only — hidden on the published site. Drop a photo · drag ⠿ to reorder · double-click a photo to reframe · hover for Remove.
          </div>
          <InfoFields item={item} />
          <VideoField item={item} />
          <SlotRow label="Title pictures" sub="up to 5 · cross-fade on hover" ids={titleIds} shape="rect" h={116} />
          <SlotRow label="Gallery" sub="extra shots on the opened project" ids={galleryIds} shape="rounded" h={104} />
          <a className="medit-mm mono" href="media.html">Open the full Media Manager →</a>
        </div>
      </div>);
  }

  window.MediaEditor = MediaEditor;
})();
