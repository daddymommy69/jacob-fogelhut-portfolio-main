/* =========================================================================
   info-store.js — per-project EDITABLE metadata + hover video.

   Stores workspace edits (tags, title, role, brands, hover/project video) so
   Jacob can change them from the on-page ✎ editor without touching data.js.
   Same bridge rules as image-slot.js: writes go through window.omelette
   .writeFile and are allowlisted to *.state.json basenames — so on the
   published GitHub Pages build this is READ-ONLY (visitors just see whatever
   was committed). Two files:
     • proj-info.state.json          — the small map { id: {tags,title,role,brands,video} }
     • projvid-<id>.state.json        — a DROPPED short clip's bytes (data URL), kept
                                        out of the small map so it never bloats.
   Video `type`:  file (a name in /media) · mp4 (direct URL) · youtube · instagram · drop
   Only file / mp4 / drop can do the muted hover-loop; youtube/instagram play
   on the opened project page only.
   ========================================================================= */
(function () {
  const INFO_FILE = "proj-info.state.json";
  const ORDER_FILE = "proj-order.state.json";
  const vidFile = (id) => "projvid-" + String(id).replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".state.json";
  // Dropped clips are stored as Blobs in IndexedDB (below), NOT as base64 in a
  // .state.json file — a big clip's data URL would blow past the host write
  // ceiling and silently fail. 100MB cap; IDB + object URLs handle it and
  // survive refresh / browser close.
  const MAX_DROP_BYTES = 104_857_600; // 100MB

  // ── Dropped-video storage (IndexedDB, Blob-based) ─────────────────────────
  const VID_DB = "proj-videos", VID_STORE = "clips";
  let vdbP = null;
  function vdb() {
    if (vdbP) return vdbP;
    vdbP = new Promise((resolve) => {
      let req; try { req = indexedDB.open(VID_DB, 1); } catch (e) { resolve(null); return; }
      req.onupgradeneeded = () => { try { req.result.createObjectStore(VID_STORE); } catch (e) {} };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
    return vdbP;
  }
  function vidPut(id, blob) {
    return vdb().then((db) => new Promise((res) => {
      if (!db) { res(false); return; }
      try {
        const tx = db.transaction(VID_STORE, "readwrite");
        const st = tx.objectStore(VID_STORE);
        if (blob) st.put(blob, id); else st.delete(id);
        tx.oncomplete = () => res(true);
        tx.onerror = () => res(false);
      } catch (e) { res(false); }
    }));
  }
  function vidGet(id) {
    return vdb().then((db) => new Promise((res) => {
      if (!db) { res(null); return; }
      try { const rq = db.transaction(VID_STORE, "readonly").objectStore(VID_STORE).get(id); rq.onsuccess = () => res(rq.result || null); rq.onerror = () => res(null); }
      catch (e) { res(null); }
    }));
  }

  const subs = new Set();
  let info = {};            // id -> {tags?, title?, role?, brands?, video?}
  let vids = {};            // id -> playable URL (object URL from IDB blob, or legacy data URL)
  let order = null;         // WORKSPACE-set master project order (array of ids), or null = data.js order
  let loaded = false, loadP = null;

  const notify = () => subs.forEach((fn) => fn());
  const writer = () => window.omelette && window.omelette.writeFile;

  function load() {
    if (loadP) return loadP;
    loadP = Promise.all([
      fetch(INFO_FILE).then((r) => (r.ok ? r.json() : null)).then((m) => { if (m && typeof m === "object") info = m; }).catch(() => {}),
      fetch(ORDER_FILE).then((r) => (r.ok ? r.json() : null)).then((arr) => { if (Array.isArray(arr) && arr.length) order = arr; }).catch(() => {})
    ])
      .then(() => {
        // hydrate every dropped clip across all projects from IndexedDB
        // (Blob → object URL). Keys are `id::vid`; fall back to the legacy
        // bare-`id` key and the old committed data-URL shard for a migrated v0.
        const tasks = [];
        Object.keys(info).forEach((id) => {
          normVideos(id).forEach((v) => {
            if (v.type !== "drop") return;
            const key = id + "::" + v.vid;
            tasks.push(vidGet(key).then((blob) => {
              if (blob) { vids[key] = URL.createObjectURL(blob); return undefined; }
              return vidGet(id).then((b2) => {
                if (b2) { vids[key] = URL.createObjectURL(b2); return undefined; }
                return fetch(vidFile(id)).then((r) => (r.ok ? r.json() : null)).then((d) => {
                  if (d && d.u) vids[key] = d.u;
                }).catch(() => {});
              });
            }).catch(() => {}));
          });
        });
        return Promise.all(tasks);
      })
      .catch(() => {})
      .then(() => { loaded = true; notify(); });
    return loadP;
  }

  let saving = false, dirty = false;
  function saveInfo() {
    const w = writer(); if (!w) return;
    if (saving) { dirty = true; return; }
    saving = true;
    Promise.resolve(w(INFO_FILE, JSON.stringify(info))).catch(() => {})
      .then(() => { saving = false; if (dirty) { dirty = false; saveInfo(); } });
  }
  function saveVid(id) {
    const w = writer(); if (!w || !id) return;
    Promise.resolve(w(vidFile(id), JSON.stringify(vids[id] ? { u: vids[id] } : {}))).catch(() => {});
  }

  // ── Master project order (drives the main list + every derived listing —
  // tag galleries, brand groupings — since they all filter from DATA.work in
  // this order). WORKSPACE-ONLY write; visitors just see whatever was
  // committed to proj-order.state.json.
  function getOrder() { return order; }
  function orderedWork(work) {
    if (!order || !order.length) return work;
    const byId = new Map(work.map((w) => [w.id, w]));
    const out = order.map((id) => byId.get(id)).filter(Boolean);
    work.forEach((w) => { if (!out.includes(w)) out.push(w); }); // new items not yet in the stored order
    return out;
  }
  function setOrder(ids) {
    order = ids && ids.length ? ids : null;
    notify();
    const w = writer(); if (!w) return;
    Promise.resolve(w(ORDER_FILE, JSON.stringify(order || []))).catch(() => {});
  }

  function get(id) { return info[id] || null; }

  // shallow-merge a patch into info[id]; pass null value on a key to clear it
  function set(id, patch) {
    if (!id) return;
    const cur = { ...(info[id] || {}) };
    for (const k in patch) {
      const v = patch[k];
      if (v == null || (Array.isArray(v) && v.length === 0) || v === "") delete cur[k];
      else cur[k] = v;
    }
    if (Object.keys(cur).length) info[id] = cur; else delete info[id];
    notify();
    if (loaded) saveInfo(); else load().then(saveInfo);
  }

  // set/replace the whole video config. `videos` is the array; `extra` may
  // carry { cover, coverMode }. Clears the legacy single `video` key.
  function setVideos(id, videos, extra) {
    const patch = { videos: videos && videos.length ? videos : null, video: null };
    if (extra && "cover" in extra) patch.cover = extra.cover || null;
    if (extra && "coverMode" in extra) patch.coverMode = extra.coverMode || null;
    set(id, patch);
  }
  // legacy single-video setter (kept for back-compat): wraps into the array.
  function setVideo(id, video) {
    if (!video) { setVideos(id, [], { cover: null }); return; }
    setVideos(id, [{ vid: "v0", ...video }], { cover: "v0", coverMode: "video" });
  }

  // normalized videos[] for a project, migrating a legacy single `video`.
  function normVideos(id) {
    const o = info[id]; if (!o) return [];
    if (Array.isArray(o.videos)) return o.videos.filter(Boolean);
    if (o.video) return [{ vid: "v0", ...o.video }];
    return [];
  }
  function coverVid(id) {
    const o = info[id] || {}; const vs = normVideos(id);
    if (!vs.length) return null;
    return vs.find((v) => v.vid === o.cover) || vs[0];
  }
  // 'video' shows the cover clip on the card; 'pictures' cross-fades the
  // title pictures. Defaults to 'video' when a playable cover exists.
  function coverMode(id) {
    const o = info[id] || {};
    if (o.coverMode === "video" || o.coverMode === "pictures") return o.coverMode;
    const c = coverVid(id);
    return c && (c.type === "drop" || c.type === "file" || c.type === "mp4") ? "video" : "pictures";
  }

  // store a dropped clip for a specific video (keyed id::vid). Accepts a
  // File/Blob → IndexedDB; returns {ok} or {ok:false,reason}.
  function setDropClip(id, vid, blob) {
    const key = id + "::" + vid;
    if (!blob) {
      if (vids[key]) { try { URL.revokeObjectURL(vids[key]); } catch (e) {} }
      delete vids[key]; vidPut(key, null); notify(); return { ok: true };
    }
    if (blob.size > MAX_DROP_BYTES) return { ok: false, reason: "too-big" };
    if (vids[key]) { try { URL.revokeObjectURL(vids[key]); } catch (e) {} }
    vids[key] = URL.createObjectURL(blob);
    vidPut(key, blob);
    notify();
    return { ok: true };
  }
  // legacy single-drop setter (migrated video gets vid 'v0').
  function setDrop(id, blob) { return setDropClip(id, "v0", blob); }

  // resolve the playable url for a specific video object.
  function videoUrlFor(id, v) {
    if (!v) return null;
    if (v.type === "drop") return vids[id + "::" + v.vid] || null;
    return v.src || null;
  }
  // legacy: resolve the COVER video's url.
  function videoUrl(id) { return videoUrlFor(id, coverVid(id)); }

  window.ProjInfo = {
    load, ready: () => loaded,
    get, set, setVideo, setDrop, videoUrl,
    setVideos, setDropClip, videoUrlFor, normVideos, coverVid, coverMode,
    getOrder, orderedWork, setOrder,
    all: () => info,
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); },
    vidFile, MAX_DROP_BYTES,
    editable: () => !!writer()
  };

  /* React hook — re-renders on any info/video change (kick a load once). */
  window.useProjInfo = function () {
    const [, force] = React.useReducer((n) => n + 1, 0);
    React.useEffect(() => {
      load();
      return window.ProjInfo.subscribe(force);
    }, []);
    return window.ProjInfo;
  };

  /* Merge a data.js work item with its workspace overrides. Always returns a
     tags[] array (deduped, case-insensitive) so the UI never doubles chips. */
  window.resolveItem = function (item) {
    const o = info[item.id] || {};
    const rawTags = (o.tags && o.tags.length ? o.tags
      : item.tags && item.tags.length ? item.tags
      : [item.client, item.tag]).filter(Boolean);
    const seen = new Set(), tags = [];
    rawTags.forEach((t) => { const k = String(t).trim().toLowerCase(); if (t && !seen.has(k)) { seen.add(k); tags.push(String(t).trim()); } });
    return {
      ...item,
      title: o.title || item.title,
      role: o.role || item.role,
      brands: o.brands && o.brands.length ? o.brands : (item.brands || []),
      tags,
      video: o.video || null
    };
  };

  /* Every distinct tag across all work (resolved), with counts. */
  window.allTags = function () {
    const map = new Map();
    (window.PORTFOLIO_DATA.work || []).forEach((w) => {
      window.resolveItem(w).tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1));
    });
    return [...map.entries()].map(([tag, count]) => ({ tag, count }));
  };
})();
