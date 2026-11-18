/* =========================================================================
   media-ui.jsx — shared media renderers used by BOTH the main site (app.jsx)
   and the Playground (playground.jsx). Loaded (babel) after React + slots.js
   and before those files. Exposes globals via window.

   CroppedImg — renders an uploaded photo honoring the reframe (pan/zoom) the
   user set in the Media Manager. The Manager stores {u, s, x, y} per slot:
     u = data URL, s = scale (1 = cover baseline), x/y = pan in frame-percent.
   object-fit:cover reproduces the cover baseline; transform applies the saved
   scale + pan exactly the way <image-slot> does, so what you frame in the
   Manager is what shows on the site.
   ========================================================================= */
/* ---------------------------------------------------------------------
   In-app browsers (the X app on iPhone, Instagram, TikTok…) can refuse to
   play video inside the page and throw muted background clips into the
   phone's full-screen player. We still try inline first (playsInline +
   webkit-playsinline); if a background clip pops full-screen anyway, it is
   closed at once and every background clip stops for the rest of the visit,
   showing its still / frozen frame instead. Videos with controls (the ones
   a visitor opens on purpose) are never touched.
   --------------------------------------------------------------------- */
window.IN_APP = /Twitter|FBAN|FBAV|Instagram|TikTok|musical_ly|BytedanceWebview|Snapchat|LinkedInApp|Line\//i.test(navigator.userAgent || "");
window.NoInlineVideo = (function () {
  let off = false;
  try { off = sessionStorage.getItem("jf-noinline") === "1"; } catch (e) {}
  const subs = new Set();
  const trip = () => {
    if (off) return;
    off = true;
    try { sessionStorage.setItem("jf-noinline", "1"); } catch (e) {}
    document.querySelectorAll("video:not([controls])").forEach((v) => { try { v.pause(); } catch (e) {} });
    subs.forEach((f) => { try { f(true); } catch (e) {} });
  };
  document.addEventListener("webkitbeginfullscreen", (e) => {
    const v = e.target;
    if (!v || v.tagName !== "VIDEO" || v.controls) return;
    try { v.webkitExitFullscreen(); } catch (err) {}
    try { v.pause(); } catch (err) {}
    trip();
  }, true);
  return { get: () => off, sub: (f) => { subs.add(f); return () => subs.delete(f); } };
})();
/* re-render when background video gets switched off */
window.useNoInline = function () {
  const [off, setOff] = React.useState(window.NoInlineVideo.get());
  React.useEffect(() => window.NoInlineVideo.sub(() => setOff(true)), []);
  return off;
};
/* attribute bag that asks older iOS web views to play inline too */
window.INLINE_ATTRS = { playsInline: true, "webkit-playsinline": "true" };

/* "open in Safari" note — only inside in-app browsers, dismissible per visit */
(function () {
  if (!window.IN_APP) return;
  try { if (sessionStorage.getItem("jf-inapp-note") === "x") return; } catch (e) {}
  const ua = navigator.userAgent || "";
  const ios = /iPhone|iPad|iPod/i.test(ua);
  const href = ios ? "x-safari-" + location.href
    : "intent://" + location.host + location.pathname + location.search + "#Intent;scheme=https;end";
  const el = document.createElement("div");
  el.setAttribute("role", "note");
  el.style.cssText = "position:fixed;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);z-index:2147483000;" +
    "display:flex;align-items:center;gap:10px;max-width:calc(100% - 24px);box-sizing:border-box;padding:7px 8px 7px 14px;border-radius:999px;" +
    "background:rgba(18,17,16,.92);color:#f6f3ec;font:500 12.5px/1.3 'Schibsted Grotesk',system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.28)";
  el.style.width = "max-content";
  el.innerHTML = '<span style="white-space:nowrap">For the full site, open in ' + (ios ? "Safari" : "your browser") + '</span>' +
    '<a style="color:#121110;background:#f6f3ec;border-radius:999px;padding:4px 10px;text-decoration:none;font-weight:600;white-space:nowrap">Open</a>' +
    '<button type="button" aria-label="Dismiss" style="all:unset;cursor:pointer;padding:2px 6px;opacity:.7;font-size:14px">✕</button>';
  el.querySelector("a").setAttribute("href", href);
  el.querySelector("button").addEventListener("click", () => {
    try { sessionStorage.setItem("jf-inapp-note", "x"); } catch (e) {}
    el.remove();
  });
  const add = () => document.body && document.body.appendChild(el);
  if (document.body) add(); else document.addEventListener("DOMContentLoaded", add);
})();

function CroppedImg({ value, alt = "", className = "", onClick }) {
  const { useRef, useState, useLayoutEffect } = React;
  // value may be a {u,s,x,y} record (from MediaSlots.crop) or a bare url string.
  const v = !value ? null : typeof value === "string" ? { u: value, s: 1, x: 0, y: 0 } : value;
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const [box, setBox] = useState(null); // {fw,fh,iw,ih} of the CURRENT frame
  const [shown, setShown] = useState(false); // blur-up: sharpen once decoded
  const url = v && v.u;
  useLayoutEffect(() => {
    const wrap = wrapRef.current, img = imgRef.current;
    if (!wrap || !img) return undefined;
    const measure = () => {
      const fw = wrap.clientWidth, fh = wrap.clientHeight;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      if (fw && fh && iw && ih) setBox({ fw, fh, iw, ih });
    };
    if (img.complete) { measure(); setShown(true); }
    img.addEventListener("load", measure);
    let ro;
    if (window.ResizeObserver) { ro = new ResizeObserver(measure); ro.observe(wrap); }
    return () => { img.removeEventListener("load", measure); if (ro) ro.disconnect(); };
  }, [url]);
  if (!v || !url) return null;

  // Replicate <image-slot>'s reframe geometry EXACTLY so a crop set in the
  // Media Manager renders identically here — and re-clamp for THIS frame's
  // aspect ratio so the image always fully covers (never shows the grey
  // backing), whatever shape it's shown at. s is a multiplier on the cover
  // baseline; x,y are the centre offset in frame-percent.
  let imgStyle;
  if (box) {
    imgStyle = window.coverBoxStyle(box.fw, box.fh, box.iw, box.ih, v);
  } else {
    // pre-measure fallback: plain cover (also covers, just not yet reframed)
    imgStyle = { width: "100%", height: "100%", objectFit: "cover", display: "block" };
  }
  return (
    <span ref={wrapRef} className={`cropbox ${className}`} onClick={onClick}
      style={{ position: "relative", display: "block", width: "100%", height: "100%", overflow: "hidden" }}>
      <img ref={imgRef} src={url} alt={alt} draggable={false} decoding="async"
        className={`cropimg cropfade ${shown ? "is-on" : ""}`} style={imgStyle}
        onLoad={() => setShown(true)} />
    </span>);
}

window.CroppedImg = CroppedImg;

// Shared cover geometry: size an element to the cover baseline × zoom (s),
// centre-offset by x,y in frame-percent, and clamp so it ALWAYS fully covers
// the frame (never reveals the backing). Used by CroppedImg, CroppedVideo and
// the editor's video-crop preview so a crop set anywhere renders identically.
window.coverBoxStyle = function (fw, fh, iw, ih, crop) {
  const c = window.coverClamp(fw, fh, iw, ih, crop);
  const base = Math.max(fw / iw, fh / ih);
  const k = base * c.s;
  return {
    position: "absolute", left: (50 + c.x) + "%", top: (50 + c.y) + "%",
    width: (iw * k / fw * 100) + "%", height: (ih * k / fh * 100) + "%",
    maxWidth: "none", transform: "translate(-50%, -50%)", display: "block"
  };
};
window.coverClamp = function (fw, fh, iw, ih, crop) {
  const base = Math.max(fw / iw, fh / ih);
  const s = Math.max(1, (crop && crop.s) || 1);
  const k = base * s;
  const mx = Math.max(0, (iw * k / fw - 1) * 50);
  const my = Math.max(0, (ih * k / fh - 1) * 50);
  return {
    s,
    x: Math.max(-mx, Math.min(mx, (crop && crop.x) || 0)),
    y: Math.max(-my, Math.min(my, (crop && crop.y) || 0))
  };
};

/* Same cover-crop geometry as CroppedImg, but for a <video>. `videoProps` are
   spread onto the element (muted/loop/handlers); `vref` receives the element. */
function CroppedVideo({ url, crop, className = "", videoProps = {}, vref }) {
  const { useRef, useState, useLayoutEffect } = React;
  const wrapRef = useRef(null), innerRef = useRef(null);
  const [box, setBox] = useState(null);
  useLayoutEffect(() => {
    const wrap = wrapRef.current, vid = innerRef.current;
    if (!wrap || !vid) return undefined;
    const measure = () => {
      const fw = wrap.clientWidth, fh = wrap.clientHeight, iw = vid.videoWidth, ih = vid.videoHeight;
      if (fw && fh && iw && ih) setBox({ fw, fh, iw, ih });
    };
    if (vid.videoWidth) measure();
    vid.addEventListener("loadedmetadata", measure);
    let ro; if (window.ResizeObserver) { ro = new ResizeObserver(measure); ro.observe(wrap); }
    return () => { vid.removeEventListener("loadedmetadata", measure); if (ro) ro.disconnect(); };
  }, [url]);
  const style = box
    ? window.coverBoxStyle(box.fw, box.fh, box.iw, box.ih, crop)
    : { width: "100%", height: "100%", objectFit: "cover", display: "block" };
  const setRef = (el) => { innerRef.current = el; if (vref) vref.current = el; };
  return (
    <span ref={wrapRef} className="cropbox" style={{ position: "relative", display: "block", width: "100%", height: "100%", overflow: "hidden" }}>
      <video ref={setRef} src={url} className={`cropimg ${className}`} style={style} {...videoProps} />
    </span>);
}
window.CroppedVideo = CroppedVideo;

/* ---------------------------------------------------------------------
   Title pictures — every project can hold up to 5 (cross-fade on hover).
   Slot ids: the legacy `still:<id>` is title #1, then `still:<id>:1..4`.
   titleStills() returns the FILLED ones in order (each a {u,s,x,y} crop).
   --------------------------------------------------------------------- */
window.titleStillIds = (id) => [
"still:" + id, "still:" + id + ":1", "still:" + id + ":2", "still:" + id + ":3", "still:" + id + ":4"];

window.titleStills = (map, id) =>
window.titleStillIds(id).map((s) => window.MediaSlots.crop(map, s)).filter(Boolean);

/* CyclingStill — stacks the title pictures and cross-fades between them while
   hovered (~2s each), resting on the first otherwise. One image → static. */
function CyclingStill({ values, alt = "", interval = 3000 }) {
  const { useState, useEffect } = React;
  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);
  const multi = values && values.length > 1;
  const reduced = window.motionReduced && window.motionReduced();
  useEffect(() => {
    if (!hover || !multi || reduced) return undefined;
    const id = setInterval(() => setI((p) => (p + 1) % values.length), interval);
    return () => clearInterval(id);
  }, [hover, multi, reduced, values && values.length, interval]);
  if (!values || !values.length) return null;
  const active = hover && !reduced ? i : 0;
  return (
    <div className="cyc" onMouseEnter={() => multi && setHover(true)} onMouseLeave={() => {setHover(false);setI(0);}}>
      {values.map((v, idx) =>
      <div className="cyc-layer" key={idx} style={{ opacity: idx === active ? 1 : 0 }}>
          <CroppedImg value={v} alt={alt} />
        </div>
      )}
    </div>);

}
window.CyclingStill = CyclingStill;
