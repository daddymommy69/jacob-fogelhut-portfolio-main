/* =========================================================================
   slots.js — shared media-slot reader
   Storage is SHARDED: the Media Manager (<image-slot>) writes each photo into
   its OWN file `slot-<id>.state.json`, plus a tiny index
   `.image-slots.index.state.json` holding only crop {s,x,y} + which ids are
   filled. This removes the single-file size ceiling, so the library can hold
   many high-res photos. The live site + Playground read through this helper,
   which rebuilds the same flat {id -> {u,s,x,y}} map the consumers expect.

   Slot id conventions (keep in sync with media-manager.js):
     still:<pieceId>     work-list thumbnail for a project
     poster:<pieceId>    poster frame for a video piece
     intro:<n>           intro photo-cycle frame
     wall:<n>            XP desktop wallpaper (cycle mode picks one at random)
     gallery:<n>         Playground polaroid pile
     alb:<a>:cover|<n>   Playground album photos
     cutout:computer|radio  desk object cutouts
   ========================================================================= */
window.MediaSlots = (function () {
  const INDEX_FILE = ".image-slots.index.state.json";
  const fileFor = (id) =>
  "slot-" + String(id).replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".state.json";
  let cache = null, p = null;
  function load() {
    if (p) return p;
    // When image-slot.js is on the page it owns the live, writable store —
    // share it so an inline drop / reorder reflects on the site immediately.
    const MS = window.MediaStore;
    if (MS && MS.load) {
      p = Promise.resolve(MS.load()).then(() => {cache = MS.all();return cache;});
      return p;
    }
    p = fetch(INDEX_FILE, { cache: "no-store" }).
    then((r) => r.ok ? r.json() : null).
    then((idx) => {
      const map = {};
      if (!idx || typeof idx !== "object") {cache = map;return map;}
      // Seed crops from the index, then hydrate each photo from its shard.
      const ids = Object.keys(idx);
      ids.forEach((id) => {const c = idx[id] || {};map[id] = { s: c.s || 1, x: c.x || 0, y: c.y || 0 };});
      return Promise.all(ids.map((id) =>
      fetch(fileFor(id), { cache: "no-store" }).
      then((r) => r.ok ? r.json() : null).
      then((d) => {if (d && d.u && map[id]) map[id].u = d.u;}).
      catch(() => {})
      )).then(() => {cache = map;return map;});
    }).
    catch(() => {cache = {};return cache;});
    return p;
  }
  function url(map, id) {
    const v = map && map[id];
    const u = v && (typeof v === "string" ? v : v.u);
    if (u && /^(data:image\/|https?:\/\/)/.test(u)) return u;
    const r = window.REMOTE_MEDIA && window.REMOTE_MEDIA[id];
    if (!r) return null;
    return typeof r === "string" ? r : r.u;
  }
  // full reframe record {u,s,x,y} for a slot (s=scale, x/y=pan in frame-%).
  // Pre-reframe sidecars stored a bare data-URL string; normalize either shape.
  function crop(map, id) {
    const v = map && map[id];
    const o = v && (typeof v === "string" ? { u: v } : v);
    if (o && o.u && /^(data:image\/|https?:\/\/)/.test(o.u)) return { u: o.u, s: o.s || 1, x: o.x || 0, y: o.y || 0 };
    const r = window.REMOTE_MEDIA && window.REMOTE_MEDIA[id];
    if (!r) return null;
    const ro = typeof r === "string" ? { u: r } : r;
    return { u: ro.u, s: ro.s || 1, x: ro.x || 0, y: ro.y || 0 };
  }
  // collect every filled url under a prefix (e.g. "intro:" / "wall:" / "gallery:")
  function collect(map, prefix, max = 40) {
    const out = [];
    for (let i = 0; i < max; i++) {
      const u = url(map, prefix + i);
      if (u) out.push(u);
    }
    return out;
  }
  // same, but each entry is a {u,s,x,y} reframe record
  function collectCrops(map, prefix, max = 40) {
    const out = [];
    for (let i = 0; i < max; i++) {
      const c = crop(map, prefix + i);
      if (c) out.push(c);
    }
    return out;
  }
  return { load, url, crop, collect, collectCrops,
    // live snapshot of the shared store (for the React hook's re-render)
    snapshot: () => window.MediaStore ? window.MediaStore.all() : cache || {} };
})();

/* React hook (used by app.jsx + playground.jsx). Safe to call even though
   React is loaded after this file — the hook body only runs at render time.
   Subscribes to the shared write store so inline drops/reorders re-render. */
window.useMediaSlots = function useMediaSlots() {
  const { useState, useEffect } = React;
  const [map, setMap] = useState({});
  useEffect(() => {
    let on = true;
    const sync = () => {if (on) setMap({ ...window.MediaSlots.snapshot() });};
    window.MediaSlots.load().then(sync);
    let unsub;
    if (window.MediaStore && window.MediaStore.subscribe) unsub = window.MediaStore.subscribe(sync);
    return () => {on = false;if (unsub) unsub();};
  }, []);
  return map;
};
