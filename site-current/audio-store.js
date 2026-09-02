/* =========================================================================
   audio-store.js — real, shared audio uploads (mirrors image-slot.js's
   sharded-file pattern, but for short audio files instead of photos).

   Each upload is written as a REAL project file via window.omelette.writeFile
   (same as photos) so it ships with the site and plays for every visitor —
   not just the uploader's own browser. Because a state.json write has a
   fairly low per-file size ceiling, uploads are capped at a modest size
   (a short mix/edit/demo, not a full 45-minute set). For full-length mixes,
   send the file directly (like mix-1/mix-2 in data.js) — no size limit that
   way, it just skips the in-browser upload step.

   Storage:
     .audio-uploads.index.state.json   { [id]: {title, size, addedAt} }
     upload-audio-<id>.state.json      { u: "data:audio/...;base64,..." }

   Exposes window.AudioStore: load/add/remove/list/urlFor/subscribe/ready.
   Outside the workspace (no omelette bridge) `add` rejects — read-only,
   same convention as every other store in this project.
   ========================================================================= */
(() => {
  const INDEX_FILE = '.audio-uploads.index.state.json';
  const fileFor = (id) => 'upload-audio-' + id + '.state.json';
  const MAX_BYTES = 75 * 1024 * 1024; // 75MB
  const ACCEPT = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/aac', 'audio/webm'];

  let index = {};   // id -> {title, size, addedAt}
  let data = {};    // id -> data: URL (hydrated lazily)
  const subs = new Set();
  let loaded = false;
  let loadP = null;

  function notify() { subs.forEach((fn) => fn()); }

  function load() {
    if (loadP) return loadP;
    loadP = fetch(INDEX_FILE, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((idx) => {
        if (idx && typeof idx === 'object') index = idx;
        const ids = Object.keys(index);
        return Promise.all(ids.map((id) =>
          fetch(fileFor(id), { cache: 'no-store' })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d && d.u) { data[id] = d.u; notify(); } })
            .catch(() => {})
        ));
      })
      .catch(() => {})
      .then(() => { loaded = true; notify(); });
    return loadP;
  }

  function saveIndex() {
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return Promise.resolve();
    return Promise.resolve(w(INDEX_FILE, JSON.stringify(index))).catch(() => {});
  }
  function saveShard(id) {
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return Promise.resolve();
    return Promise.resolve(w(fileFor(id), JSON.stringify(data[id] ? { u: data[id] } : {}))).catch(() => {});
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error('could not read that file'));
      r.readAsDataURL(file);
    });
  }

  async function add(file, title) {
    if (!(window.omelette && window.omelette.writeFile)) throw new Error('uploads only save from the workspace');
    if (!file) throw new Error('no file');
    if (ACCEPT.indexOf(file.type) < 0) throw new Error('use mp3, m4a, wav, ogg, or aac');
    if (file.size > MAX_BYTES) {
      throw new Error('keep it under ' + (MAX_BYTES / 1024 / 1024).toFixed(0) + 'MB \u2014 for anything bigger, send the file directly and it\u2019ll be added with no size limit');
    }
    await load();
    const id = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const url = await fileToDataUrl(file);
    data[id] = url;
    index[id] = { title: (title || file.name.replace(/\.[^.]+$/, '')), size: file.size, addedAt: Date.now() };
    notify();
    await Promise.all([saveIndex(), saveShard(id)]);
    return id;
  }

  function remove(id) {
    delete index[id];
    delete data[id];
    notify();
    saveIndex();
    const w = window.omelette && window.omelette.writeFile;
    if (w) Promise.resolve(w(fileFor(id), '{}')).catch(() => {});
  }

  function list() {
    return Object.keys(index)
      .map((id) => ({ id, ...index[id] }))
      .sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
  }
  function urlFor(id) { return data[id] || null; }

  window.AudioStore = {
    load, add, remove, list, urlFor,
    ready: () => loaded,
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); }
  };
})();
