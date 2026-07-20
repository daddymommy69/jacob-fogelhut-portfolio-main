/* =========================================================================
   JACOB FOGELHUT — Main site (minimal)  ·  motion overhaul
   Uses primitives from motion.jsx (Collapse, Reveal, useMagnetic, Img,
   flipFrom, CursorThumb, Intro).
   ========================================================================= */
const { useState, useEffect, useRef, useLayoutEffect, useMemo } = React;
const DATA = window.PORTFOLIO_DATA;

/* media slots dropped in the Media Manager (media.html), read from the
   shared project sidecar. */
const SlotsCtx = React.createContext({});
const useSlot = (id) => window.MediaSlots.url(React.useContext(SlotsCtx), id);
// full reframe record {u,s,x,y} for a slot, honoring Media-Manager pan/zoom.
const useCrop = (id) => window.MediaSlots.crop(React.useContext(SlotsCtx), id);

const IcArrow = () => <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: "14px", height: "14px" }}><path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const IcX = () => <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 2 L12 12 M12 2 L2 12" /></svg>;
const IcChevron = ({ dir }) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7"><path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} strokeLinecap="round" strokeLinejoin="round" /></svg>;
const IcPlay = () => <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>;

const ACCENTS = ["#9c7a3c", "#a8623a", "#5d6b4e", "#4a5a6a", "#7a6f63"];

/* clicking a tag chip opens a filtered gallery of everything with that tag */
const TagCtx = React.createContext(() => {});

/* youtube/vimeo/etc → embeddable iframe src */
function ytEmbed(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/i);
  if (yt) return "https://www.youtube.com/embed/" + yt[1];
  return url;
}
/* youtube video id → its public thumbnail image, so a YouTube piece has a
   real thumbnail without needing a manually-set poster */
function ytThumb(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/i);
  return yt ? "https://img.youtube.com/vi/" + yt[1] + "/hqdefault.jpg" : null;
}

/* a row of clickable tag chips (deduped upstream in resolveItem) */
function TagChips({ tags, extra }) {
  const openTag = React.useContext(TagCtx);
  if (!tags || !tags.length) return null;
  return (
    <div className="d-tags">
      {tags.map((t) =>
        <button key={t} className="d-tag chip tag-btn" onClick={(e) => { e.stopPropagation(); openTag(t); }}>{t}</button>
      )}
      {extra}
    </div>);
}

/* Did we arrive here from an internal page (the Playground)? If so, skip the
   intro this once. Consumed synchronously at load so a later refresh on the
   main page plays the intro again. (#1) */
const CAME_FROM_INTERNAL = (() => {
  try {
    const v = sessionStorage.getItem("jf-skip-intro") === "1";
    if (v) sessionStorage.removeItem("jf-skip-intro");
    return v;
  } catch (e) {return false;}
})();

/* ---------------------------------------------------------------------
   shared media renderer (instagram / spotify / video / placeholder)
   --------------------------------------------------------------------- */
function useInstagram(active) {
  useEffect(() => {
    if (!active) return;
    const run = () => {if (window.instgrm) window.instgrm.Embeds.process();};
    if (window.instgrm) {run();return;}
    let s = document.getElementById("ig-embed");
    if (!s) {
      s = document.createElement("script");
      s.id = "ig-embed";s.async = true;s.src = "https://www.instagram.com/embed.js";
      s.onload = run;document.body.appendChild(s);
    } else {s.addEventListener("load", run);}
  }, [active]);
}

function WorkMedia({ item, onImageClick }) {
  const m = item.media;
  const poster = useSlot("poster:" + item.id) || m.poster;
  const stillCrop = useCrop("still:" + item.id);
  const still = stillCrop || item.still;
  useInstagram(m.kind === "instagram");
  if (m.kind === "instagram") {
    return (
      <blockquote className="instagram-media" data-instgrm-permalink={m.src} data-instgrm-version="14"
      style={{ background: "#fff", border: 0, margin: 0, width: "100%" }} key={m.src}></blockquote>);
  }
  if (m.kind === "spotify") {
    return <iframe src={m.src} height="360" allow="encrypted-media" loading="lazy" title={item.title}></iframe>;
  }
  if (m.kind === "video" && !m.pending) {
    return <video src={m.src} poster={poster} controls autoPlay playsInline></video>;
  }
  if (still) {
    return (
      <div className={`po-still ${onImageClick ? "clickable" : ""}`} onClick={onImageClick} title={onImageClick ? "Click to close" : undefined}>
        <CroppedImg value={still} alt={item.title} />
      </div>);
  }
  return <div className="block"><MediaBlock item={item} /></div>;
}

function MediaBlock({ item }) {
  return <span className="b-mono">{item.media.pending ? "Media coming soon" : item.tag}</span>;
}

/* one embed (instagram / spotify / video / youtube) — used when a project
   carries more than one piece via item.embeds (e.g. the Justin Park / 5A
   campaign) or a hover/project video set in the editor. */
function EmbedBlock({ embed, title }) {
  useInstagram(embed.kind === "instagram");
  if (embed.kind === "instagram")
  return <blockquote className="instagram-media" data-instgrm-permalink={embed.src} data-instgrm-version="14"
  style={{ background: "#fff", border: 0, margin: 0, width: "100%" }} key={embed.src}></blockquote>;
  if (embed.kind === "spotify")
  return <iframe src={embed.src} height="360" allow="encrypted-media" loading="lazy" title={title}></iframe>;
  if (embed.kind === "youtube")
  return <div className="yt-frame"><iframe src={ytEmbed(embed.src)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" title={title}></iframe></div>;
  if (embed.kind === "video" && !embed.pending)
  return <video src={embed.src} poster={embed.poster} controls playsInline></video>;
  return null;
}

/* hover video — muted loop, optionally clipped to a [in,out] window set in
   the ✎ editor. Shows the first (in-point) frame at rest. */
function HoverVideo({ url, vin, vout, crop }) {
  const clip = vout > vin;
  const seekIn = (v) => { try { v.currentTime = vin || 0; } catch (e) {} };
  return (
    <CroppedVideo url={url} crop={crop} className="thumb-video"
      videoProps={{
        muted: true, playsInline: true, preload: "metadata", loop: !clip,
        onLoadedMetadata: (e) => seekIn(e.currentTarget),
        onMouseEnter: (e) => { const v = e.currentTarget; if (clip && (v.currentTime < vin || v.currentTime >= vout)) seekIn(v); v.play().catch(() => {}); },
        onMouseLeave: (e) => { const v = e.currentTarget; v.pause(); seekIn(v); },
        onTimeUpdate: (e) => { const v = e.currentTarget; if (clip && v.currentTime >= vout) seekIn(v); }
      }} />);
}

/* video card that RESTS on title picture #1 and cross-fades to the muted
   hover-loop video on hover; reverts to the picture on leave. Used when a
   project has BOTH a hover video and at least one title picture. */
function VideoWithStill({ url, vin, vout, still, alt, crop }) {
  const [hover, setHover] = useState(false);
  const vref = useRef(null);
  const clip = vout > vin;
  const seekIn = (v) => { try { v.currentTime = vin || 0; } catch (e) {} };
  const enter = () => {
    setHover(true);
    const v = vref.current; if (!v) return;
    if (clip && (v.currentTime < vin || v.currentTime >= vout)) seekIn(v);
    v.play().catch(() => {});
  };
  const leave = () => {
    setHover(false);
    const v = vref.current; if (!v) return;
    v.pause(); seekIn(v);
  };
  return (
    <div className="vws" onMouseEnter={enter} onMouseLeave={leave}>
      <div className="vws-layer vws-still" style={{ opacity: hover ? 0 : 1 }}>
        <CroppedImg value={still} alt={alt} />
      </div>
      <div className="vws-layer vws-video-wrap" style={{ opacity: hover ? 1 : 0 }}>
        <CroppedVideo url={url} crop={crop} className="thumb-video" vref={vref}
          videoProps={{
            muted: true, playsInline: true, preload: "metadata", loop: !clip,
            onLoadedMetadata: (e) => seekIn(e.currentTarget),
            onTimeUpdate: (e) => { const v = e.currentTarget; if (clip && v.currentTime >= vout) seekIn(v); }
          }} />
      </div>
    </div>);
}

/* a static thumbnail for the main list (title pictures cross-fade on hover;
   a project video, if set, loops muted on hover instead) */
function Thumb({ item, revealName }) {
  const slots = React.useContext(SlotsCtx);
  const titles = window.titleStills(slots, item.id);
  const m = item.media;
  const stillCrop = useCrop("still:" + item.id);
  const still = stillCrop || item.still;
  const showVideo = m.kind === "video" && !m.pending;
  // cover video (chosen in the editor). Only a playable cover in 'video'
  // cover-mode hover-loops on the card; otherwise the title pictures cycle.
  const PI = window.ProjInfo;
  const cover = PI ? PI.coverVid(item.id) : null;
  const mode = PI ? PI.coverMode(item.id) : "pictures";
  const coverPlayable = cover && (cover.type === "file" || cover.type === "mp4" || cover.type === "drop");
  const hoverVid = (mode === "video" && coverPlayable) ? PI.videoUrlFor(item.id, cover) : null;
  const vcrop = cover && cover.crop;
  const vin = (cover && cover.in) || 0, vout = (cover && cover.out) || 0;
  return (
    <div className="thumb" data-thumb-id={item.id}>
      {hoverVid ?
      (titles.length ?
      <VideoWithStill url={hoverVid} vin={vin} vout={vout} still={titles[0]} alt={item.title} crop={vcrop} /> :
      <HoverVideo url={hoverVid} vin={vin} vout={vout} crop={vcrop} />) :
      titles.length ?
      <CyclingStill values={titles} alt={item.title} /> :
      still ?
      <CroppedImg value={still} alt={item.title} /> :
      showVideo ?
      <video className="zoom" src={m.src} poster={m.poster} muted loop playsInline preload="metadata"
      onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => e.currentTarget.pause()} /> :
      <div className="block"><MediaBlock item={item} /></div>}
      <div className="reveal" style={{ fontSize: "20px" }}><span className="b-name" style={{ fontFamily: "JacobMarker", fontSize: "26px" }}>{revealName}</span></div>
    </div>);
}

/* ---------------------------------------------------------------------
   row hover → drive the cursor-following thumbnail
   --------------------------------------------------------------------- */
function useRowHover(item, enabled) {
  return {
    onMouseEnter: () => {if (enabled && window.__cursorThumb) window.__cursorThumb.show(item);},
    onMouseLeave: () => {if (window.__cursorThumb) window.__cursorThumb.hide();}
  };
}

/* =====================================================================
   HEADER
   ===================================================================== */
function Header({ theme, cycleTheme }) {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 220);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const tLabel = theme === "auto" ? "Auto" : theme === "dark" ? "Dark" : "Light";
  return (
    <header className={`site-head ${stuck ? "stuck" : ""}`}>
      <div className="wrap head-inner">
        <a className="head-brand" href="#top">{DATA.name}</a>
        <nav className="head-nav">
          <a href="#playground">Playground</a>
          <a href={`mailto:${DATA.email}`}>Contact</a>
          <button className="theme-btn" onClick={cycleTheme} aria-label="Toggle theme">
            <span className="dot" style={{ background: theme === "dark" ? "currentColor" : "transparent" }}></span>
            {tLabel}
          </button>
        </nav>
      </div>
    </header>);
}

/* =====================================================================
   HERO
   ===================================================================== */
function Hero({ roleLine }) {
  const [idx, setIdx] = useState(0);
  const cycling = roleLine === "__cycle";
  useEffect(() => {
    if (!cycling) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % DATA.taglines.length), 3200);
    return () => clearInterval(id);
  }, [cycling]);
  const role = cycling ? DATA.taglines[idx] : roleLine;
  return (
    <section className="wrap hero" id="top">
      <h1 className="hero-h1">Jacob<br />Fogelhut</h1>
      <div className="hero-role" key={role}>{role}</div>
    </section>);
}

/* =====================================================================
   PLUS / X morph indicator
   ===================================================================== */
const Plus = ({ open, page }) =>
<span className={`plus ${open ? "x" : ""} ${page ? "page" : ""}`} style={{ fontSize: "14px" }}>{page ? "↗" : "+"}</span>;

/* =====================================================================
   WORK ITEM (projects mode)
   ===================================================================== */
/* the inline detail panel — shared by ProjectItem (with prev/next) */
function ProjectDetail({ item, onStep, onClose, stepped }) {
  const isIg = item.media.kind === "instagram";
  const r = window.resolveItem(item);
  return (
    <div className="detail-inner" key={item.id}>
      <div className="detail-head">
        <div className="dh-nav">
          <button className="dh-arrow" onClick={() => onStep(-1)} aria-label="Previous project"><IcChevron dir="left" /></button>
          <button className="dh-arrow" onClick={() => onStep(1)} aria-label="Next project"><IcChevron dir="right" /></button>
          {stepped && <span className="dh-stepped mono">viewing {item.client}</span>}
        </div>
        <button className="dh-close" onClick={onClose} aria-label="Close"><IcX /></button>
      </div>
      <div className={`detail-media ${isIg ? "is-ig" : ""}`}>
        <WorkMedia item={item} onImageClick={onClose} />
      </div>
      <div className="detail-meta">
        <h4 style={{ fontFamily: "JacobMarker" }}>{r.title}</h4>
        <div className="d-role">{r.role}</div>
        <TagChips tags={r.tags} extra={item.stat && <span className="d-stat chip">{item.stat}</span>} />
        {(item.media.kind === "instagram" || item.media.kind === "spotify") &&
        <a className="detail-out" href={item.media.src} target="_blank" rel="noreferrer">
            {item.media.kind === "spotify" ? "Open in Spotify" : "View on Instagram"} <IcArrow />
          </a>}
      </div>
    </div>);
}

function ProjectItem({ item, openMode, feel, isOpen, viewItem, onToggle, onStep, onClose, onOpenFull, onEditMedia, cursorFollow, dragRef, onDragGrip, dragging }) {
  const hover = useRowHover(item, cursorFollow);
  const vItem = viewItem || item;
  const r = window.resolveItem(item);
  const full = openMode === "full";
  const onRowClick = (e) => {
    if (full) {
      const th = e.currentTarget.querySelector(".thumb");
      onOpenFull(item, th ? th.getBoundingClientRect() : null);
    } else onToggle(item.id);
  };
  return (
    <div className={`item ${full ? "is-full" : ""} ${dragging ? "is-dragging" : ""}`} ref={dragRef}>
      <div className="item-row" onClick={onRowClick} {...hover}>
        {onDragGrip &&
        <span className="row-drag-grip" title="Drag to reorder (only you see this)"
          onClick={(e) => e.stopPropagation()} onPointerDown={onDragGrip}>⠿</span>}
        {window.MEDIT_EDITABLE &&
        <button className="edit-media-btn" title="Edit media (only you see this)"
        onClick={(e) => {e.stopPropagation();onEditMedia(item);}}>✎ media</button>}
        <Thumb item={item} revealName={item.client} />
        <div>
          <div className="item-name serif" style={{ fontFamily: "JacobMarker", fontSize: "34px" }}>{r.title}</div>
          <div className="item-sub">
            <span style={{ fontFamily: "\"JetBrains Mono\"", fontSize: "12px" }}>{r.tags[0] || item.tag}</span>
            {full ? <span className="row-arrow"><IcArrow /></span> : <Plus open={isOpen} />}
          </div>
        </div>
      </div>
      {!full &&
      <Collapse open={isOpen} feel={feel}>
          <div className="detail-pad">
            {isOpen && <ProjectDetail item={vItem} onStep={onStep} onClose={onClose} stepped={vItem.id !== item.id} />}
          </div>
        </Collapse>}
    </div>);
}

/* =====================================================================
   BRAND ITEM (brands mode)
   ===================================================================== */
function BrandItem({ brand, feel, isOpen, onToggle, cursorFollow }) {
  const lead = brand.items[0];
  const hover = useRowHover(lead, cursorFollow);
  const count = `${brand.items.length} ${brand.items.length === 1 ? "piece" : "pieces"}`;
  const [piece, setPiece] = useState(null);
  useEffect(() => {if (!isOpen) setPiece(null);}, [isOpen]);
  return (
    <div className="item">
      <div className="item-row" onClick={() => onToggle(brand.client)} {...hover}>
        <Thumb item={lead} revealName={count} />
        <div>
          <div className="item-name serif">{brand.client}</div>
          <div className="item-sub">
            <span>{count}</span>
            <Plus open={isOpen} />
          </div>
        </div>
      </div>
      <Collapse open={isOpen} feel={feel}>
        <div className="detail-pad">
          {isOpen && (piece ?
          <div className="detail-inner">
              <div className="detail-head">
                <button className="dh-back" onClick={() => setPiece(null)}>← {brand.client}</button>
              </div>
              <div className={`detail-media ${piece.media.kind === "instagram" ? "is-ig" : ""}`}>
                <WorkMedia item={piece} onImageClick={() => setPiece(null)} />
              </div>
              <div className="detail-meta">
                <h4 style={{ fontFamily: "JacobMarker" }}>{piece.title}</h4>
                <div className="d-role">{piece.role}</div>
                <TagChips tags={window.resolveItem(piece).tags} extra={piece.stat && <span className="d-stat chip">{piece.stat}</span>} />
                {(piece.media.kind === "instagram" || piece.media.kind === "spotify") &&
              <a className="detail-out" href={piece.media.src} target="_blank" rel="noreferrer">
                    {piece.media.kind === "spotify" ? "Open in Spotify" : "View on Instagram"} <IcArrow />
                  </a>}
              </div>
            </div> :

          <div className="brand-pieces">
              {brand.items.map((p, i) =>
            <button key={p.id} className="bp chip" style={{ "--ci": i }} onClick={() => setPiece(p)}>
                  <div className="bp-media"><div className="block"><MediaBlock item={p} /></div></div>
                  <div className="bp-cap"><b>{p.title}</b><span>{p.role}</span></div>
                </button>
            )}
            </div>)}
        </div>
      </Collapse>
    </div>);
}

/* =====================================================================
   RELATED WORK (shown on a full-page project view)
   ===================================================================== */
function RelatedRow({ title, items, onPiece }) {
  if (!items.length) return null;
  return (
    <div className="po-rel">
      <div className="po-rel-h mono">{title}</div>
      <div className="brand-pieces">
        {items.map((p, i) =>
        <button key={p.id} className="bp chip" style={{ "--ci": i }} onClick={() => onPiece(p)}>
            <div className="bp-media"><div className="block"><MediaBlock item={p} /></div></div>
            <div className="bp-cap"><b>{p.title}</b><span>{p.client} · {p.tag}</span></div>
          </button>
        )}
      </div>
    </div>);
}
function Related({ item, onPiece }) {
  // brand tags let collabs (e.g. "ESENES X TOMBOGO") surface under each brand.
  const myBrands = item.brands && item.brands.length ? item.brands : [item.client];
  const primary = myBrands[0];
  const brandItems = (b) => DATA.work.filter((w) => w.id !== item.id && (w.brands && w.brands.length ? w.brands : [w.client]).includes(b));
  const brand = brandItems(primary);
  const brandIds = new Set([item.id, ...brand.map((w) => w.id)]);
  const cat = DATA.work.filter((w) => w.tag === item.tag && !brandIds.has(w.id));
  if (!brand.length && !cat.length) return null;
  return (
    <div className="po-related">
      <RelatedRow title={`More from ${primary}`} items={brand} onPiece={onPiece} />
      <RelatedRow title={`More in ${item.tag}`} items={cat} onPiece={onPiece} />
    </div>);
}

/* =====================================================================
   FULL-PAGE PROJECT OPEN
   The clicked title picture becomes a full-bleed background; project content
   rides in a frosted glass card over it. Opening = zoom-from-thumbnail or
   crossfade (Tweak). Background blur + dim are Tweaks. Closing reverses the
   open (shrinks back into the list thumbnail). Closes on ✕, Esc, or a click on
   any background area outside the card. (Browser-Back + ?p= URL handled in App.)
   ===================================================================== */
const REFRAME = (v) => !v ? null : typeof v === "string" ? { u: v, s: 1, x: 0, y: 0 } : v;

/* full-screen dark lightbox for gallery photos + playable videos. Arrows/
   keyboard navigate the set; click backdrop / Esc / ✕ closes. */
function Lightbox({ items, index, onClose, onNav }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();else
      if (e.key === "ArrowRight") onNav(1);else
      if (e.key === "ArrowLeft") onNav(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    return () => {window.removeEventListener("keydown", onKey);document.body.style.overflow = prev;};
  }, [onClose, onNav]);
  const it = items[index];
  if (!it) return null;
  const multi = items.length > 1;
  return (
    <div className="lb" onClick={onClose}>
      <button className="lb-x" onClick={onClose} aria-label="Close"><IcX /></button>
      {multi &&
      <button className="lb-nav lb-prev" onClick={(e) => {e.stopPropagation();onNav(-1);}} aria-label="Previous"><IcChevron dir="left" /></button>}
      <div className="lb-stage" onClick={(e) => e.stopPropagation()}>
        {it.type === "video" ?
        <video className="lb-media" src={it.src} poster={it.poster} controls autoPlay playsInline /> :
        <img className="lb-media" src={it.url} alt="" />}
      </div>
      {multi &&
      <button className="lb-nav lb-next" onClick={(e) => {e.stopPropagation();onNav(1);}} aria-label="Next"><IcChevron dir="right" /></button>}
    </div>);
}

/* the single "main player" a project page funnels every clickable piece of
   media into. Autoplays muted video on swap-in (loops while muted, stops
   looping once unmuted so a full sound-on watch doesn't repeat). Clicking
   the player area opens the shared fullscreen viewer — except for IG/Spotify,
   which have no fullscreen state and just live inline. */
function MainPlayer({ item, onFullscreen }) {
  const vref = useRef(null);
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    if (item.type !== "video" || !vref.current) return;
    const v = vref.current;
    v.currentTime = 0;
    v.muted = true; setMuted(true);
    v.play().catch(() => {});
  }, [item.src, item.type]);
  const toggleMute = (e) => { e.stopPropagation(); const v = vref.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); };
  const togglePlay = (e) => { e.stopPropagation(); const v = vref.current; if (!v) return; if (v.paused) v.play().catch(() => {}); else v.pause(); };
  const Pause = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>;
  const Muted = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" /><path d="M17 9l4 6M21 9l-4 6" /></svg>;
  const Loud = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8 8 0 0 1 0 12" /></svg>;

  if (item.type === "photo") {
    return (
      <button className="pp-mainplayer pp-mainplayer-photo" onClick={onFullscreen} aria-label="Enlarge">
        <CroppedImg value={item.raw} alt="" />
      </button>);
  }
  if (item.type === "video") {
    return (
      <div className="pp-mainplayer pp-mainplayer-video" onClick={onFullscreen}>
        {item.drop ?
        <CroppedVideo url={item.src} crop={item.crop} vref={vref}
          videoProps={{ autoPlay: true, muted: true, loop: true, playsInline: true, preload: "metadata" }} /> :
        <video ref={vref} src={item.src} poster={item.poster} autoPlay muted loop playsInline preload="metadata" />}
        <div className="pp-mainplayer-ctl" onClick={(e) => e.stopPropagation()}>
          <button onClick={togglePlay} aria-label="Play/Pause"><Pause /></button>
          <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>{muted ? <Muted /> : <Loud />}</button>
        </div>
      </div>);
  }
  return null;
}

function ProjectPage({ item, fromRect, anim, blur, dim, text, blendMedia, onRequestClose }) {
  const slots = React.useContext(SlotsCtx);
  const titles = window.titleStills(slots, item.id);
  const still = REFRAME(titles[0] || window.MediaSlots.crop(slots, "still:" + item.id) || item.still);
  const gallery = useMemo(() => window.MediaSlots.collectCrops(slots, "gallery:" + item.id + ":", 6), [slots, item.id]);
  const rootRef = useRef(null);
  const bgRef = useRef(null);
  const innerRef = useRef(null);
  const scrollRef = useRef(null);
  const closingRef = useRef(false);
  const reduced = window.motionReduced && window.motionReduced();
  const bgPics = titles.length ? titles : still ? [still] : [];
  const [bgIdx, setBgIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(0);
  // open-project background cross-fades through the title pictures (rests on #1
  // for 8s, then advances; only when 2+ pics; honors reduced-motion). The new
  // picture fades in ON TOP of the previous one (which stays fully opaque)
  // so the page never shows through mid-fade.
  useEffect(() => {
    if (reduced || bgPics.length < 2) return undefined;
    const id = setInterval(() => setBgIdx((p) => { setPrevIdx(p); return (p + 1) % bgPics.length; }), 8000);
    return () => clearInterval(id);
  }, [reduced, bgPics.length]);

  // shared FLIP math between a fullscreen bg and a thumbnail rect
  const flipPair = (rect) => {
    const to = bgRef.current.getBoundingClientRect();
    return {
      full: { transform: "none", borderRadius: "0px" },
      thumb: {
        transformOrigin: "top left",
        transform: `translate(${rect.left - to.left}px, ${rect.top - to.top}px) scale(${rect.width / to.width}, ${rect.height / to.height})`,
        borderRadius: "6px"
      }
    };
  };

  // OPEN
  useLayoutEffect(() => {
    const root = rootRef.current;if (!root) return;
    if (reduced) return;
    if (anim === "zoom" && fromRect && bgRef.current) {
      const p = flipPair(fromRect);
      bgRef.current.animate([{ ...p.thumb, transformOrigin: "top left" }, { ...p.full, transformOrigin: "top left" }],
      { duration: 560, easing: "cubic-bezier(.5,.05,.2,1)" });
      root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: "ease-out" });
      const card = root.querySelector(".pp-card");
      if (card) card.animate([{ opacity: 0, transform: "translateY(26px)" }, { opacity: 1, transform: "none" }],
      { duration: 460, delay: 160, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" });
    } else {
      root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: "ease-out" });
    }
    // eslint-disable-next-line
  }, []);

  // CLOSE — animate, then tell App to drop it (App pops history)
  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    const root = rootRef.current,bg = bgRef.current;
    let fired = false;
    const done = () => {if (fired) return;fired = true;onRequestClose();};
    if (reduced || !root) return done();
    const thumb = document.querySelector(`[data-thumb-id="${window.CSS && CSS.escape ? CSS.escape(item.id) : item.id}"]`);
    const r = thumb && thumb.getBoundingClientRect();
    const onScreen = r && r.bottom > 0 && r.top < window.innerHeight;
    let dur = 300;
    if (anim === "zoom" && onScreen && bg) {
      const p = flipPair(r);
      bg.animate([{ ...p.full, transformOrigin: "top left" }, { ...p.thumb, transformOrigin: "top left" }],
      { duration: 460, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
      const card = root.querySelector(".pp-card");
      if (card) card.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(20px)" }], { duration: 240, easing: "ease-in", fill: "forwards" });
      const a = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 440, easing: "ease-in", fill: "forwards" });
      a.onfinish = done;dur = 460;
    } else {
      const a = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: "ease-in", fill: "forwards" });
      a.onfinish = done;dur = 300;
    }
    // fallback: WAAPI onfinish never fires when the tab isn't painting
    // (backgrounded/headless), so guarantee the close completes.
    setTimeout(done, dur + 80);
  };
  // App can call this to run the exit animation before unmount (unused by
  // hardware-Back, which unmounts instantly).
  useEffect(() => {window.__ppClose = close;return () => {if (window.__ppClose === close) window.__ppClose = null;};});

  // Esc + scroll lock + parallax
  useEffect(() => {
    const onKey = (e) => {if (e.key === "Escape") close();};
    window.addEventListener("keydown", onKey);
    const prevOv = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {window.removeEventListener("keydown", onKey);document.body.style.overflow = prevOv;};
    // eslint-disable-next-line
  }, []);

  const onScroll = () => {
    if (reduced || !innerRef.current || !scrollRef.current) return;
    // clamp the parallax to the background's overscan so the blurred photo
    // always fully covers — the site behind never peeks through at the edges.
    const max = window.innerHeight * 0.12;
    const ty = Math.min(scrollRef.current.scrollTop * 0.18, max);
    innerRef.current.style.transform = `translateY(${ty}px)`;
  };

  const bgClick = (e) => {if (e.target === scrollRef.current || e.target.classList.contains("pp-deadzone")) close();};
  const r = window.resolveItem(item);
  const m = item.media;
  const hasEmbed = m.kind === "instagram" || m.kind === "spotify" || m.kind === "video" && !m.pending;
  // editor-set videos (each plays with sound here; standard controls). All
  // are stacked on the project page; one is the card cover (see Thumb).
  const info = window.ProjInfo && window.ProjInfo.get(item.id);
  const evs = window.ProjInfo ? window.ProjInfo.normVideos(item.id) : [];
  const editorEmbeds = evs.filter((v) => !v.hidden).map((v) => {
    const k = v.type === "youtube" ? "youtube" : v.type === "instagram" ? "instagram" : "video";
    return { kind: k, src: window.ProjInfo.videoUrlFor(item.id, v), label: v.label || "Video", poster: v.poster, drop: v.type === "drop", crop: v.crop, group: (v.group || "").trim(), in: v.in, out: v.out };
  }).filter((e) => e.src);
  // a project can carry several pieces (item.embeds); else its single media
  // plus any `media.more` extra links (e.g. more Instagram posts).
  const baseEmbeds = item.embeds && item.embeds.length ?
  item.embeds :
  hasEmbed ?
  [{ kind: m.kind, src: m.src, poster: m.poster, label: m.label }, ...(m.more || []).map((u, i) => ({ kind: "instagram", src: u, label: (m.moreLabels && m.moreLabels[i]) || `Instagram post ${i + 2}` }))] :
  [];
  const embeds = [...editorEmbeds, ...baseEmbeds];
  const mainEmbeds = embeds.filter((e) => !e.group);
  // cluster grouped videos (free-text label, matched case-insensitively) in
  // first-appearance order, so "Content", "content", "CONTENT" merge — but
  // the group's displayed heading keeps the first spelling used.
  const groupedList = useMemo(() => {
    const order = [], map = new Map();
    embeds.forEach((e) => {
      if (!e.group) return;
      const key = e.group.toLowerCase();
      if (!map.has(key)) { map.set(key, { label: e.group, items: [] }); order.push(key); }
      map.get(key).items.push(e);
    });
    return order.map((k) => map.get(k));
  }, [embeds]);

  // ---- single "main player" model: every piece of media on the page (main
  // embeds, grouped/content videos, gallery photos) is one flat, ordered
  // list. One item is "active" (shown big, up top); clicking any OTHER item
  // swaps it in + scrolls the player into view; clicking the active player
  // itself opens the shared fullscreen viewer (video/photo only — IG/Spotify
  // just live inline, no fullscreen state). ----
  let _cursor = 0;
  const withAutoPoster = (e) => ({ ...e, poster: e.poster || (e.kind === "youtube" ? ytThumb(e.src) : null) });
  const mainMapped = mainEmbeds.map(withAutoPoster).map((e) => ({ type: e.kind, src: e.src, poster: e.poster, crop: e.crop, drop: e.drop, label: e.label, title: item.title, vin: e.in, vout: e.out, idx: _cursor++ }));
  const groupMapped = groupedList.map((g) => ({ label: g.label, items: g.items.map(withAutoPoster).map((e) => ({ type: e.kind, src: e.src, poster: e.poster, label: e.label, drop: e.drop, crop: e.crop, vin: e.in, vout: e.out, idx: _cursor++ })) }));
  const galleryMapped = gallery.map((g) => ({ type: "photo", src: typeof g === "string" ? g : g.u, raw: g, idx: _cursor++ }));
  const combined = [...mainMapped, ...groupMapped.flatMap((g) => g.items), ...galleryMapped];

  const [activeIdx, setActiveIdx] = useState(0);
  // default stage pick: prefer a video (so something's autoplaying muted+
  // looped the moment the page opens), then a photo, only falling back to
  // an IG/Spotify embed (which can't autoplay) if that's literally all there is.
  const defaultIdx = useMemo(() => {
    const v = combined.find((it) => it.type === "video");
    if (v) return v.idx;
    const p = combined.find((it) => it.type === "photo");
    if (p) return p.idx;
    return combined.length ? combined[0].idx : 0;
  }, [combined]);
  useEffect(() => { setActiveIdx(defaultIdx); }, [item.id]); // eslint-disable-line
  const mainRef = useRef(null);
  const goTo = (idx) => {
    setActiveIdx(idx);
    if (mainRef.current) mainRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const fsList = useMemo(() => combined.filter((it) => it.type === "video" || it.type === "photo"), [combined]);
  const [fsPos, setFsPos] = useState(-1); // position within fsList, or -1 = closed
  const openFullscreen = () => {
    const cur = combined[Math.min(activeIdx, combined.length - 1)];
    if (!cur || (cur.type !== "video" && cur.type !== "photo")) return;
    const p = fsList.findIndex((it) => it.idx === cur.idx);
    if (p >= 0) setFsPos(p);
  };
  const navFs = (d) => setFsPos((p) => {
    const n = (p + d + fsList.length) % fsList.length;
    setActiveIdx(fsList[n].idx);
    return n;
  });
  const fsItems = fsList.map((it) => it.type === "video" ? { type: "video", src: it.src, poster: it.poster } : { type: "image", url: it.src });
  // Instagram/Spotify embeds mutate their own DOM (the IG script replaces the
  // blockquote with an iframe) — unmounting one mid-session throws a
  // removeChild error and blanks the page. So embed items stay PERSISTENTLY
  // mounted for the life of the page and are just shown/hidden via CSS,
  // instead of being conditionally rendered by the active-item swap.
  const embedItems = combined.filter((it) => it.type === "instagram" || it.type === "spotify" || it.type === "youtube");
  const activeItem = combined[Math.min(activeIdx, combined.length - 1)];
  const activeIsEmbed = activeItem && (activeItem.type === "instagram" || activeItem.type === "spotify" || activeItem.type === "youtube");

  return (
    <div className={`pp pp-text-${text || "gradient"} ${blendMedia ? "pp-blend" : ""}`} ref={rootRef} style={{ "--pp-blur": (blur || 0) + "px", "--pp-dim": (dim || 0) / 100 }}>
      <div className="pp-bg" ref={bgRef}>
        <div className="pp-bg-inner" ref={innerRef}>
          {bgPics.length ?
          bgPics.map((p, idx) =>
          <div className="pp-bg-layer" key={idx}
            style={{ opacity: idx === bgIdx || idx === prevIdx ? 1 : 0, zIndex: idx === bgIdx ? 2 : idx === prevIdx ? 1 : 0 }}>
                <CroppedImg value={p} alt={item.title} />
              </div>
          ) :
          <div className="pp-bg-fallback" />}
        </div>
        <div className="pp-bg-scrim" />
      </div>

      <button className="pp-x" onClick={close} aria-label="Close project"><IcX /></button>

      <div className="pp-scroll" ref={scrollRef} onScroll={onScroll} onClick={bgClick}>
        <div className="pp-deadzone" />
        <article className="pp-card" onClick={(e) => e.stopPropagation()}>
          <div className="pp-eyebrow mono">{item.client}</div>
          <h2 className="pp-title" style={{ fontFamily: "JacobMarker", textAlign: item.titleAlign }}>{r.title}</h2>
          <div className="pp-role" style={{ fontSize: item.roleSize, textAlign: item.roleAlign }}>{r.role}</div>

          <div className="pp-tags">
            <TagChips tags={r.tags} extra={item.stat && <span className="d-stat chip">{item.stat}</span>} />
          </div>

          {item.blurb && <p className="pp-blurb">{item.blurb}</p>}

          {combined.length > 0 &&
          <div className="pp-mainplayer-wrap" ref={mainRef}>
              {embedItems.map((it) =>
              <div key={it.idx} className="pp-mainplayer pp-mainplayer-embed" style={{ display: activeIdx === it.idx ? "block" : "none" }}>
                  <EmbedBlock embed={{ kind: it.type, src: it.src }} title={item.title} />
                  <a className="detail-out" href={it.src} target="_blank" rel="noreferrer">
                    {it.type === "spotify" ? "Open in Spotify" : "View on Instagram"} <IcArrow />
                  </a>
                </div>
              )}
              {!activeIsEmbed && <MainPlayer item={activeItem} onFullscreen={openFullscreen} />}
            </div>}

          {mainMapped.length > 1 &&
          <div className="pp-group">
              <div className="pp-vidgrid">
                {mainMapped.map((it) =>
                <button key={it.idx} className={`pp-vidthumb ${activeIdx === it.idx ? "is-active" : ""}`}
                  onClick={() => goTo(it.idx)} aria-label={`Show ${it.label || "media"} ${it.idx + 1}`}>
                    {it.type === "video" && it.vout > it.vin ?
                    <HoverVideo url={it.src} vin={it.vin} vout={it.vout} crop={it.crop} /> :
                    it.poster ? <img src={it.poster} alt="" /> : it.type === "video" ? <video src={it.src} muted preload="metadata" /> : <div className="pp-vidthumb-fallback">{it.type === "instagram" ? "IG" : it.type === "youtube" ? "▶" : it.type === "spotify" ? "♫" : ""}</div>}
                    {(it.type === "video" || it.type === "youtube") && <span className="pp-play-sm"><IcPlay /></span>}
                  </button>
                )}
              </div>
            </div>}

          {groupMapped.map((g, gi) =>
          <div className="pp-group" key={g.label + gi}>
              <div className="pp-sec mono">{g.label}</div>
              <div className="pp-vidgrid">
                {g.items.map((it) =>
                <button key={it.idx} className={`pp-vidthumb ${activeIdx === it.idx ? "is-active" : ""}`}
                  onClick={() => goTo(it.idx)} aria-label={`Play ${it.label || g.label} ${it.idx + 1}`}>
                    {it.type === "video" && it.vout > it.vin ?
                    <HoverVideo url={it.src} vin={it.vin} vout={it.vout} crop={it.crop} /> :
                    it.poster ? <img src={it.poster} alt="" /> : it.type === "video" ? <video src={it.src} muted preload="metadata" /> : <div className="pp-vidthumb-fallback">{it.type === "instagram" ? "IG" : it.type === "youtube" ? "▶" : it.type === "spotify" ? "♫" : ""}</div>}
                    <span className="pp-play-sm"><IcPlay /></span>
                  </button>
                )}
              </div>
            </div>
          )}

          {gallery.length > 0 &&
          <div className="pp-gallery">
              <div className="pp-sec mono">Gallery</div>
              <div className="pp-grid">
                {galleryMapped.map((it) => <button className={`pp-shot ${activeIdx === it.idx ? "is-active" : ""}`} key={it.idx} onClick={() => goTo(it.idx)} aria-label={`Show ${item.title} ${it.idx + 1}`}><CroppedImg value={it.raw} alt={`${item.title} ${it.idx + 1}`} /></button>)}
              </div>
            </div>}

          <div className="pp-foot mono">Click anywhere outside · Esc · ✕ to close</div>
        </article>
      </div>
      {fsPos >= 0 && fsItems[fsPos] &&
      <Lightbox items={fsItems} index={fsPos} onClose={() => setFsPos(-1)} onNav={navFs} />}
    </div>);
}

/* =====================================================================
   TAG FILTER VIEW — clicking any tag opens a clean gallery of everything
   carrying it; clicking a result opens that project full-page.
   ===================================================================== */
function TagView({ tag, onOpen, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  const matches = DATA.work.filter((w) => window.resolveItem(w).tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
  return (
    <div className="tagview" onClick={onClose}>
      <div className="tagview-inner" onClick={(e) => e.stopPropagation()}>
        <div className="tagview-head">
          <div className="tv-h-l">
            <span className="mono">Tagged</span>
            <h2 style={{ fontFamily: "JacobMarker" }}>{tag}</h2>
            <span className="mono tv-count">{matches.length} {matches.length === 1 ? "project" : "projects"}</span>
          </div>
          <button className="po-x" onClick={onClose} aria-label="Close"><IcX /></button>
        </div>
        <div className="tagview-grid">
          {matches.map((w) => {
            const r = window.resolveItem(w);
            return (
              <button key={w.id} className="tv-card" onClick={() => onOpen(w)}>
                <div className="tv-media"><Thumb item={w} revealName={w.client} /></div>
                <div className="tv-cap">
                  <b style={{ fontFamily: "JacobMarker" }}>{r.title}</b>
                  <span className="mono">{r.tags.slice(0, 3).join(" · ")}</span>
                </div>
              </button>);
          })}
        </div>
      </div>
    </div>);
}

/* =====================================================================
   WORK SECTION
   ===================================================================== */
function Work({ listMode, openMode, feel, cursorFollow, rowHover, multiOpen, onOpenFull, onEditMedia }) {
  const [openMap, setOpenMap] = useState({}); // id -> viewId (project shown in that row's panel)
  useEffect(() => {setOpenMap({});}, [listMode, multiOpen]);
  const PI = window.useProjInfo ? window.useProjInfo() : null;
  const editable = window.MEDIT_EDITABLE;

  // Master project order (workspace-only drag-to-reorder). `dragList` holds a
  // live preview while actively dragging a row; otherwise we derive straight
  // from the committed order so edits elsewhere stay in sync.
  const baseList = PI ? PI.orderedWork(DATA.work) : DATA.work;
  const [dragList, setDragList] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const list = dragList || baseList;
  const rowRefs = useRef({});

  const startRowDrag = (id) => (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    let cur = [...(dragList || baseList)];
    setDragList(cur); setDraggingId(id);
    const move = (ev) => {
      const curIdx = cur.findIndex((w) => w.id === id);
      let nearestIdx = curIdx, nearestDist = Infinity;
      cur.forEach((w, i) => {
        const el = rowRefs.current[w.id];
        if (!el) return;
        const r = el.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        const d = Math.abs(ev.clientY - mid);
        if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
      });
      if (nearestIdx !== curIdx) {
        const item = cur[curIdx];
        cur = cur.filter((w) => w.id !== id);
        cur.splice(nearestIdx, 0, item);
        setDragList(cur);
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
      if (PI) PI.setOrder(cur.map((w) => w.id));
      setDragList(null); setDraggingId(null);
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };

  const toggle = (id) => setOpenMap((prev) => {
    if (id in prev) {const n = { ...prev };delete n[id];return n;}
    return multiOpen ? { ...prev, [id]: id } : { [id]: id };
  });
  const close = (id) => setOpenMap((prev) => {const n = { ...prev };delete n[id];return n;});
  const step = (rowId, d) => setOpenMap((prev) => {
    const cur = prev[rowId];
    if (cur == null) return prev;
    const i = DATA.work.findIndex((w) => w.id === cur);
    if (i < 0) return prev;
    const nid = DATA.work[(i + d + DATA.work.length) % DATA.work.length].id;
    return { ...prev, [rowId]: nid };
  });

  return (
    <section className="wrap work" id="work">
      <Reveal className="work-lead">
        <span className="mono">Selected Work</span>
      </Reveal>
      <div className="work-list" data-hover={rowHover}>
        {listMode === "projects" ?
        list.map((it, i) =>
        <Reveal key={it.id} delay={dragList ? 0 : Math.min(i, 4) * 60}>
              <ProjectItem item={it} openMode={openMode} feel={feel}
          isOpen={it.id in openMap}
          viewItem={DATA.work.find((w) => w.id === openMap[it.id])}
          onToggle={toggle} onStep={(d) => step(it.id, d)} onClose={() => close(it.id)}
          onOpenFull={onOpenFull} onEditMedia={onEditMedia}
          cursorFollow={cursorFollow}
          dragRef={(el) => { rowRefs.current[it.id] = el; }}
          onDragGrip={editable ? startRowDrag(it.id) : undefined}
          dragging={draggingId === it.id} />
            </Reveal>
        ) :
        DATA.brands.map((b, i) =>
        <Reveal key={b.client} delay={Math.min(i, 4) * 60}>
              <BrandItem brand={b} feel={feel}
          isOpen={b.client in openMap}
          onToggle={toggle} cursorFollow={cursorFollow} />
            </Reveal>
        )}
      </div>
    </section>);
}

/* =====================================================================
   INTERACTIVE PLAYGROUND TEASER
   ===================================================================== */
/* =====================================================================
   PLAYGROUND TEASER — marker sign  ⇄  polaroid collage (Tweak)
   ===================================================================== */
function TeaserSign() {
  return (
    <div className="tsign">
      <span className="tsign-rope tsign-rope-l"></span>
      <span className="tsign-rope tsign-rope-r"></span>
      <div className="tsign-board">
        <span className="tsign-word" style={{ fontFamily: "JacobMarker" }}>Playground</span>
        <span className="tsign-arrow mono">step inside →</span>
      </div>
    </div>);
}

function TeaserCollage({ photos }) {
  const rots = [-8, 5, -4, 9, -6];
  const cells = (photos.length ? photos : [null, null, null, null, null]).slice(0, 5);
  return (
    <div className="tcollage">
      <div className="tcollage-stack">
        {cells.map((p, i) =>
        <div className="tpola" key={i} style={{ "--r": rots[i % rots.length] + "deg", "--i": i }}>
            <div className="tpola-img">{p ? <CroppedImg value={p} /> : <span className="tpola-empty" />}</div>
          </div>
        )}
      </div>
      <span className="tcollage-word" style={{ fontFamily: "JacobMarker" }}>Playground</span>
    </div>);
}

function Teaser({ style }) {
  const slots = React.useContext(SlotsCtx);
  const photos = useMemo(() => {
    const out = [];
    for (let a = 0; a < 4; a++) {
      const c = window.MediaSlots.crop(slots, "alb:" + a + ":cover");
      if (c) out.push(c);
      out.push(...window.MediaSlots.collectCrops(slots, "alb:" + a + ":", 5));
    }
    // de-dupe by data-url
    const seen = new Set();
    return out.filter((p) => p && !seen.has(p.u) && seen.add(p.u)).slice(0, 5);
  }, [slots]);
  const collage = style === "collage";
  return (
    <Reveal>
      <section className="wrap teaser">
        <div className="teaser-mono mono">Off the clock</div>
        <a className={`teaser-link ${collage ? "is-collage" : "is-sign"}`} href="#playground">
          {collage ? <TeaserCollage photos={photos} /> : <TeaserSign />}
        </a>
        <div className="teaser-hint">{collage ? "Snapshots from the playground — step inside →" : "A little corner of things I make for fun — step inside →"}</div>
      </section>
    </Reveal>);
}

/* =====================================================================
   CONTACT + FOOTER
   ===================================================================== */
function Contact() {
  const btnRef = useMagnetic(0.4);
  return (
    <Reveal>
      <section className="wrap contact" id="contact">
        <h2 className="serif" style={{ fontFamily: "JacobMarker", fontSize: "90px" }}>Let's make<br />something real.</h2>
        <a className="contact-btn magnetic" ref={btnRef} href={`mailto:${DATA.email}`}>Contact me <IcArrow /></a>
      </section>
    </Reveal>);
}
function Footer() {
  return (
    <footer className="wrap foot">
      <span className="f-name">{DATA.name}</span>
      <span className="f-year mono">© {new Date().getFullYear()}</span>
    </footer>);
}

/* =====================================================================
   TWEAKS + APP
   ===================================================================== */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "#9c7a3c",
  "roleLine": "__cycle",
  "listMode": "projects",
  "openMode": "full",
  "openAnim": "zoom",
  "ppText": "gradient",
  "ppBlendMedia": true,
  "bgBlur": 14,
  "bgDim": 30,
  "inlineFeel": "accordion",
  "inlineMulti": false,
  "intro": "photoCycle",
  "introSource": "intro",
  "teaserStyle": "sign",
  "vizStyle": "radial",
  "barStyle": "full",
  "motion": 45,
  "cursorFollow": true,
  "rowHover": "wash"
} /*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS, "jf-tweaks-main");
  const [introDone, setIntroDone] = useState(false);
  const [forceIntro, setForceIntro] = useState(false);
  const [slotsReady, setSlotsReady] = useState(false);
  const [openFull, setOpenFull] = useState(null); // {item, fromRect} | null
  const [editMedia, setEditMedia] = useState(null); // workspace-only media editor
  const [tagView, setTagView] = useState(null); // active tag filter, or null
  const slots = useMediaSlots();
  const info = window.useProjInfo(); // re-render on any editor change

  // ── full-page project open: shareable ?p=<id> URL + browser-Back closes ──
  const openProject = (item, fromRect) => {
    setOpenFull({ item, fromRect });
    try {history.pushState({ pp: item.id }, "", "?p=" + encodeURIComponent(item.id));} catch (e) {}
  };
  const openFromTag = (w) => { setTagView(null); openProject(w, null); };
  // user close (✕/Esc/click): pop our history entry → popstate unmounts
  const requestClose = () => {
    if (history.state && history.state.pp) history.back();else
    setOpenFull(null);
  };
  useEffect(() => {
    const onPop = () => setOpenFull(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  // deep link on load (?p=id) — open it once slots are ready (fade, no zoom)
  const deepLinkedRef = useRef(false);
  useEffect(() => {
    if (deepLinkedRef.current || !slotsReady) return;
    deepLinkedRef.current = true;
    try {
      const id = new URLSearchParams(location.search).get("p");
      const item = id && DATA.work.find((w) => w.id === id);
      if (item) {
        history.replaceState(null, "", location.pathname);
        history.pushState({ pp: item.id }, "", "?p=" + encodeURIComponent(item.id));
        setOpenFull({ item, fromRect: null });
      }
    } catch (e) {}
  }, [slotsReady]);

  // wait for uploaded photos (or 1.5s max) before the intro starts, so the
  // first-load intro shows real photos just like the Replay button does. (#1)
  useEffect(() => {
    let on = true;
    window.MediaSlots.load().then(() => {if (on) setSlotsReady(true);});
    const id = setTimeout(() => {if (on) setSlotsReady(true);}, 1500);
    return () => {on = false;clearTimeout(id);};
  }, []);

  // detect environments where CSS animation/transition can't run (disabled,
  // or a frozen capture harness) and force visible end-states.
  useEffect(() => {
    const d = document.createElement("div");
    d.style.cssText = "position:absolute;left:-9999px;opacity:0;transition:opacity .05s linear;pointer-events:none";
    document.body.appendChild(d);
    d.offsetHeight;
    d.style.opacity = "1";
    const id = setTimeout(() => {
      const ran = parseFloat(getComputedStyle(d).opacity) > 0.05;
      d.remove();
      if (!ran) document.documentElement.classList.add("no-anim");
    }, 140);
    return () => clearTimeout(id);
  }, []);

  // sync global motion state
  const [sysReduced, setSysReduced] = useState(() => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = (e) => setSysReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  useEffect(() => {window.__MOTION.level = (t.motion || 0) / 100;}, [t.motion]);
  useEffect(() => {window.__MOTION.reduced = sysReduced;}, [sysReduced]);
  useEffect(() => {document.documentElement.style.setProperty("--motion", String((t.motion || 0) / 100));}, [t.motion]);

  const [sysDark, setSysDark] = useState(() => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = (e) => setSysDark(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  const effTheme = t.theme === "auto" ? sysDark ? "dark" : "light" : t.theme;
  useEffect(() => {document.documentElement.setAttribute("data-theme", effTheme);}, [effTheme]);
  useEffect(() => {document.documentElement.style.setProperty("--accent", t.accent);}, [t.accent]);

  const cycleTheme = () => {
    const order = ["light", "dark", "auto"];
    setTweak("theme", order[(order.indexOf(t.theme) + 1) % 3]);
  };

  const introOn = t.intro !== "off";
  const showIntro = !introDone && (forceIntro || introOn && !CAME_FROM_INTERNAL && !window.__introShown);
  const replayIntro = () => {setForceIntro(true);setIntroDone(false);};
  const showCursor = t.cursorFollow && t.rowHover === "thumb" && !sysReduced;
  const introFrames = useMemo(() => {
    const introSlots = window.MediaSlots.collect(slots, "intro:", 14);
    const work = [
    ...DATA.work.map((w) => window.MediaSlots.url(slots, "still:" + w.id) || w.still).filter(Boolean),
    ...(DATA.introFrames || []).filter(Boolean)];
    const play = [];
    for (let a = 0; a < 4; a++) {
      const c = window.MediaSlots.url(slots, "alb:" + a + ":cover");
      if (c) play.push(c);
      play.push(...window.MediaSlots.collect(slots, "alb:" + a + ":", 5));
    }
    const wall = window.MediaSlots.collect(slots, "wall:", 12);
    let pool;
    if (t.introSource === "intro") pool = introSlots;else
    if (t.introSource === "work") pool = [...introSlots, ...work];else
    if (t.introSource === "playground") pool = play;else
    if (t.introSource === "computer") pool = wall;else
    pool = [...introSlots, ...work, ...play, ...wall];
    pool = [...new Set(pool.filter(Boolean))];
    return pool.length ? pool : DATA.introFrames || [];
  }, [slots, t.introSource]);

  return (
    <SlotsCtx.Provider value={slots}>
     <TagCtx.Provider value={setTagView}>
      {showIntro && (
      slotsReady ?
      <Intro concept={t.intro} frames={introFrames} name={DATA.name}
      seconds={2} onDone={() => {window.__introShown = true;setIntroDone(true);}} /> :

      <div className="intro" aria-hidden="true"><div className="intro-stage"></div></div>)
      }

      {showCursor && <CursorThumb />}

      <div className={`site ${showIntro ? "pre" : "go"} ${openFull ? "site-behind" : ""}`}>
        <Header theme={t.theme} cycleTheme={cycleTheme} />
        <Hero roleLine={t.roleLine} />
        <Work listMode={t.listMode} openMode={t.openMode} feel={t.inlineFeel} cursorFollow={showCursor} rowHover={t.rowHover} multiOpen={t.inlineMulti} onOpenFull={openProject} onEditMedia={setEditMedia} />
        <Teaser style={t.teaserStyle} />
        <Contact />
        <Footer />
      </div>

      {openFull &&
      <ProjectPage key={openFull.item.id} item={openFull.item} fromRect={openFull.fromRect}
      anim={t.openAnim} blur={t.bgBlur} dim={t.bgDim} text={t.ppText} blendMedia={t.ppBlendMedia} onRequestClose={requestClose} />}

      {tagView && <TagView tag={tagView} onOpen={openFromTag} onClose={() => setTagView(null)} />}

      {window.MEDIT_EDITABLE && editMedia && window.MediaEditor &&
      React.createElement(window.MediaEditor, { item: editMedia, onClose: () => setEditMedia(null) })}

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme} options={["light", "dark", "auto"]}
        onChange={(v) => setTweak("theme", v)} />
        <TweakColor label="Accent" value={t.accent} options={ACCENTS}
        onChange={(v) => setTweak("accent", v)} />

        <TweakSection label="Motion" />
        <TweakSlider label="Intensity" value={t.motion} min={0} max={100} step={5}
        onChange={(v) => setTweak("motion", v)} />
        <TweakToggle label="Cursor-follow thumbnail" value={t.cursorFollow}
        onChange={(v) => setTweak("cursorFollow", v)} />
        <TweakSelect label="Intro" value={t.intro}
        options={[
        { value: "photoCycle", label: "Photo cycle + name" },
        { value: "markerDraw", label: "Marker name draws on" },
        { value: "heroSlam", label: "Hero slam + stamp" },
        { value: "off", label: "No intro" }]}
        onChange={(v) => setTweak("intro", v)} />
        <TweakSelect label="Intro photos" value={t.introSource}
        options={[
        { value: "intro", label: "Intro-cycle slots (curated)" },
        { value: "everything", label: "Everything (all uploads)" },
        { value: "work", label: "Work stills" },
        { value: "playground", label: "Playground albums" },
        { value: "computer", label: "Computer wallpapers" }]}
        onChange={(v) => setTweak("introSource", v)} />
        <TweakButton label="Replay intro" secondary onClick={replayIntro} />

        <TweakSection label="Hero" />
        <TweakSelect label="Role line" value={t.roleLine}
        options={[{ value: "__cycle", label: "Auto (cycle all)" }, ...DATA.taglines.map((x) => ({ value: x, label: x }))]}
        onChange={(v) => setTweak("roleLine", v)} />

        <TweakSection label="Work layout" />
        <TweakSelect label="Row hover" value={t.rowHover}
        options={[
        { value: "wash", label: "Color wash + brand" },
        { value: "scribble", label: "Marker scribble" },
        { value: "thumb", label: "Photo follows cursor" }]}
        onChange={(v) => setTweak("rowHover", v)} />
        <TweakRadio label="List by" value={t.listMode}
        options={[{ value: "projects", label: "Projects" }, { value: "brands", label: "Brands" }]}
        onChange={(v) => setTweak("listMode", v)} />
        <TweakRadio label="Open project as" value={t.openMode}
        options={[{ value: "full", label: "Full page" }, { value: "inline", label: "Inline" }]}
        onChange={(v) => setTweak("openMode", v)} />
        <TweakToggle label="Allow several open at once" value={t.inlineMulti}
        onChange={(v) => setTweak("inlineMulti", v)} />
        <TweakSelect label="Inline feel" value={t.inlineFeel}
        options={[
        { value: "accordion", label: "Accordion (push)" },
        { value: "lift", label: "Lift in place" },
        { value: "morph", label: "Panel morph" },
        { value: "fade", label: "Simple fade" }]}
        onChange={(v) => setTweak("inlineFeel", v)} />

        <TweakSection label="Full-page open" />
        <TweakRadio label="Open animation" value={t.openAnim}
        options={[{ value: "zoom", label: "Zoom from photo" }, { value: "crossfade", label: "Cross-fade" }]}
        onChange={(v) => setTweak("openAnim", v)} />
        <TweakRadio label="Text backdrop" value={t.ppText}
        options={[{ value: "gradient", label: "Soft fade" }, { value: "scrim", label: "Pure glow" }]}
        onChange={(v) => setTweak("ppText", v)} />
        <TweakToggle label="Blend media (no frames)" value={t.ppBlendMedia}
        onChange={(v) => setTweak("ppBlendMedia", v)} />
        <TweakSlider label="Background blur" value={t.bgBlur} min={0} max={30} step={1}
        onChange={(v) => setTweak("bgBlur", v)} />
        <TweakSlider label="Background dim" value={t.bgDim} min={0} max={80} step={2}
        onChange={(v) => setTweak("bgDim", v)} />

        <TweakSection label="Playground teaser" />
        <TweakRadio label="Style" value={t.teaserStyle}
        options={[{ value: "sign", label: "Marker sign" }, { value: "collage", label: "Polaroid collage" }]}
        onChange={(v) => setTweak("teaserStyle", v)} />

        <TweakSection label="Radio" />
        <TweakRadio label="Visualizer" value={t.vizStyle}
        options={[{ value: "radial", label: "Radial" }, { value: "wave", label: "Wave" }, { value: "bars", label: "Bars" }]}
        onChange={(v) => {try {localStorage.setItem("jf-pv-vizStyle", v);} catch (e) {}setTweak("vizStyle", v);}} />
        <TweakRadio label="Player bar" value={t.barStyle}
        options={[{ value: "full", label: "Full width" }, { value: "float", label: "Floating" }]}
        onChange={(v) => {try {localStorage.setItem("jf-pv-barStyle", v);} catch (e) {}setTweak("barStyle", v);}} />

        <TweakSection label="Media" />
        <TweakButton label="Open Media Manager →" onClick={() => {window.location.href = "media.html";}} />
      </TweaksPanel>
     </TagCtx.Provider>
    </SlotsCtx.Provider>);
}

ReactDOM.createRoot;
window.MainApp = App;