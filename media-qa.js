/* =========================================================================
   media-qa.js — Photo Quality Check
   Reads the project sidecar (.image-slots.state.json), decodes every photo,
   reports resolution + approx file size, and flags low-quality ones so Jacob
   knows exactly which to re-upload. Pure read-only — never writes.

   Slot id conventions mirror media-manager.js / slots.js:
     still:<id> · poster:<id> · intro:<n> · wall:<n> · alb:<a>:cover|<n> ·
     cutout:computer|radio
   ========================================================================= */
(function () {
  const DATA = window.PORTFOLIO_DATA || {};
  const work = DATA.work || [];
  const root = document.getElementById("qa-root");
  const footEl = document.getElementById("qa-foot");
  const sumEl = document.getElementById("qa-summary");

  const workTitle = (id) => {
    const w = work.find((x) => x.id === id);
    return w ? w.title : id;
  };

  // quality thresholds (longest edge in px)
  function grade(maxDim, kb) {
    if (maxDim >= 1400 && kb >= 60) return "good";
    if (maxDim >= 900) return "ok";
    return "low";
  }
  const GRADE_LABEL = { good: "Sharp", ok: "OK", low: "Low — re-up", empty: "Empty" };

  function bytesOfDataUrl(u) {
    // base64 payload length → bytes
    const i = u.indexOf(",");
    const b64 = i >= 0 ? u.slice(i + 1) : u;
    const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
    return Math.max(0, Math.floor(b64.length * 3 / 4) - pad);
  }

  function decode(u) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => res({ w: 0, h: 0 });
      img.src = u;
    });
  }

  // build the slot manifest we expect, in display order, grouped by section
  function buildPlan() {
    const groups = [];
    groups.push({
      title: "Work stills", hint: "project title pictures",
      slots: work.map((w) => ({ id: "still:" + w.id, name: w.title }))
    });
    const videos = work.filter((w) => w.media && w.media.kind === "video");
    if (videos.length) groups.push({
      title: "Video posters", hint: "poster frames",
      slots: videos.map((w) => ({ id: "poster:" + w.id, name: w.title }))
    });
    groups.push({
      title: "Intro photo-cycle", hint: "plays on load",
      slots: Array.from({ length: 12 }, (_, i) => ({ id: "intro:" + i, name: "Frame " + (i + 1) }))
    });
    groups.push({
      title: "XP wallpapers", hint: "computer background",
      slots: Array.from({ length: 6 }, (_, i) => ({ id: "wall:" + i, name: "Wallpaper " + (i + 1) }))
    });
    for (let a = 0; a < 4; a++) {
      const slots = [{ id: "alb:" + a + ":cover", name: "Cover" }];
      for (let p = 0; p < 10; p++) slots.push({ id: "alb:" + a + ":" + p, name: "Photo " + (p + 1) });
      groups.push({ title: "Album " + (a + 1), hint: "polaroids", slots });
    }
    groups.push({
      title: "Desk cutouts", hint: "object photos",
      slots: [{ id: "cutout:computer", name: "Computer" }, { id: "cutout:radio", name: "Radio" }]
    });
    return groups;
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  async function run() {
    // Sharded store: read the index (crops + presence), then each photo's own
    // shard file. Falls back to the legacy single sidecar if the index is absent.
    const fileFor = (id) =>
    "slot-" + String(id).replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".state.json";
    let map = {};
    try {
      const ir = await fetch(".image-slots.index.state.json", { cache: "no-store" });
      if (ir.ok) {
        const idx = await ir.json();
        const ids = Object.keys(idx || {});
        await Promise.all(ids.map(async (id) => {
          const c = idx[id] || {};
          map[id] = { s: c.s || 1, x: c.x || 0, y: c.y || 0 };
          try {
            const sr = await fetch(fileFor(id), { cache: "no-store" });
            if (sr.ok) {const d = await sr.json();if (d && d.u) map[id].u = d.u;}
          } catch (e) {}
        }));
      } else {
        const r = await fetch(".image-slots.state.json", { cache: "no-store" });
        if (r.ok) map = await r.json();
      }
    } catch (e) {}
    map = map && typeof map === "object" ? map : {};

    const plan = buildPlan();
    const tally = { good: 0, ok: 0, low: 0, empty: 0 };

    for (const g of plan) {
      const sec = el("section", "qa-section");
      const head = el("div", "qa-sec-head");
      head.appendChild(el("h2", null, g.title));
      head.appendChild(el("span", "qa-hint", g.hint));
      sec.appendChild(head);
      const grid = el("div", "qa-grid");

      for (const s of g.slots) {
        const raw = map[s.id];
        const u = !raw ? null : typeof raw === "string" ? raw : raw.u;
        const has = u && /^data:image\//.test(u);

        const card = el("div", "qa-card");
        const thumb = el("div", "qa-thumb");
        const meta = el("div", "qa-meta");
        meta.appendChild(el("div", "qa-name", s.name));
        meta.appendChild(el("div", "qa-id", s.id));

        if (!has) {
          tally.empty++;
          thumb.appendChild(el("span", "qa-badge empty", GRADE_LABEL.empty));
          thumb.appendChild(el("span", "qa-empty", "no photo"));
          meta.appendChild(el("div", "qa-dims", "—"));
        } else {
          const kb = Math.round(bytesOfDataUrl(u) / 1024);
          const dim = await decode(u);
          const maxDim = Math.max(dim.w, dim.h);
          const gr = grade(maxDim, kb);
          tally[gr]++;
          if (gr === "low") card.classList.add("flag-low");
          const im = new Image(); im.src = u; im.alt = s.name;
          thumb.appendChild(im);
          thumb.appendChild(el("span", "qa-badge " + gr, GRADE_LABEL[gr]));
          meta.appendChild(el("div", "qa-dims",
            `${dim.w}\u202f×\u202f${dim.h}<span class="sep">·</span>${kb}\u202fKB`));
        }
        card.appendChild(thumb);
        card.appendChild(meta);
        grid.appendChild(card);
      }
      sec.appendChild(grid);
      root.appendChild(sec);
    }

    // summary
    const chips = [
      ["good", "sharp"], ["ok", "ok"], ["low", "re-upload"], ["empty", "empty"]
    ].map(([k, lbl]) => {
      const c = el("div", "qa-stat");
      c.appendChild(el("span", "dot " + k));
      c.appendChild(el("span", null, `${tally[k]} ${lbl}`));
      return c;
    });
    chips.forEach((c) => sumEl.appendChild(c));

    const total = tally.good + tally.ok + tally.low;
    footEl.textContent = `${total} photos scanned · ${tally.low} need a better re-upload · read-only`;
  }

  run();
})();
