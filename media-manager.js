/* =========================================================================
   media-manager.js — builds the drag-and-drop organizing surface.
   Reads DATA (data.js), emits a labeled <image-slot> for every media slot in
   the project. Slot ids MUST match the consumers in slots.js / app.jsx /
   playground.jsx:
     still:<id> · poster:<id> · intro:<n> · wall:<n> · gallery:<n>
   ========================================================================= */
(function () {
  const DATA = window.PORTFOLIO_DATA || {};
  const work = DATA.work || [];
  const PG = DATA.playground || {};
  const root = document.getElementById("mm-root");

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  // one labeled slot card
  function card(id, labelHTML, { height = 180, shape = "rounded", radius = 8 } = {}) {
    const c = el("div", "mm-card");
    const slot = document.createElement("image-slot");
    slot.id = id;
    slot.setAttribute("shape", shape);
    slot.setAttribute("radius", String(radius));
    slot.setAttribute("placeholder", "Drop photo");
    slot.style.height = height + "px";
    const label = el("div", "mm-label", labelHTML);
    c.appendChild(slot);
    c.appendChild(label);
    return c;
  }

  function section(title, hint, gridClass, cards) {
    if (!cards.length) return;
    const sec = el("section", "mm-section");
    const head = el("div", "mm-sec-head");
    head.appendChild(el("h2", null, title));
    head.appendChild(el("span", "mm-hint", hint));
    sec.appendChild(head);
    const grid = el("div", "mm-grid " + gridClass);
    cards.forEach((c) => grid.appendChild(c));
    sec.appendChild(grid);
    root.appendChild(sec);
    return grid;
  }

  // Title-picture slot ids for a project (keep in sync with media-ui.jsx).
  const titleIds = (id) => ["still:" + id, "still:" + id + ":1", "still:" + id + ":2", "still:" + id + ":3", "still:" + id + ":4"];

  // Make a grid of cards reorderable: a ⠿ grip on each card pointer-drags to
  // shuffle the PHOTOS between the fixed slot ids (MediaStore.reorder); the
  // slots re-render in place, so no DOM reshuffle is needed.
  function makeReorderable(grid, ids) {
    const cards = [...grid.children];
    const nearest = (x, y) => {
      let best = 0, bd = Infinity;
      [...grid.children].forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    };
    cards.forEach((c, from) => {
      c.classList.add("mm-reord");
      const grip = el("span", "mm-grip", "\u283F");
      grip.title = "Drag to reorder";
      grip.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        c.classList.add("dragging");
        const move = (ev) => {
          const to = nearest(ev.clientX, ev.clientY);
          [...grid.children].forEach((k, i) => k.classList.toggle("drop-target", i === to && i !== from));
        };
        const up = (ev) => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          c.classList.remove("dragging");
          [...grid.children].forEach((k) => k.classList.remove("drop-target"));
          const to = nearest(ev.clientX, ev.clientY);
          if (to !== from && window.MediaStore && window.MediaStore.reorder)
            window.MediaStore.reorder(ids, from, to);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      });
      c.appendChild(grip);
    });
  }

  // 1 ── Title pictures (up to 5 per project, cross-fade on hover) -----------
  const tsec = el("section", "mm-section");
  const thead = el("div", "mm-sec-head");
  thead.appendChild(el("h2", null, "Title pictures"));
  thead.appendChild(el("span", "mm-hint", work.length + " pieces · up to 5 each · cross-fade on hover · drag ⠿ to reorder"));
  tsec.appendChild(thead);
  work.forEach((w) => {
    const grp = el("div", "mm-proj");
    grp.appendChild(el("div", "mm-proj-h", `<b>${w.title}</b><span>${w.client}</span>`));
    const grid = el("div", "mm-grid wide");
    const ids = titleIds(w.id);
    ids.forEach((id, i) => grid.appendChild(card(id, `<b>Title ${i + 1}</b>`, { height: 150 })));
    grp.appendChild(grid);
    tsec.appendChild(grp);
    makeReorderable(grid, ids);
  });
  root.appendChild(tsec);

  // 2 ── Video posters ----------------------------------------------------
  const videos = work.filter((w) => w.media && w.media.kind === "video");
  section(
    "Video posters", videos.length + " videos", "wide",
    videos.map((w) =>
    card("poster:" + w.id, `<b>${w.title}</b><span>poster frame</span>`, { height: 180 })
    )
  );

  // 3 ── Intro photo-cycle ------------------------------------------------
  const INTRO_N = 12;
  section(
    "Intro photo-cycle", INTRO_N + " frames · plays on load", "square",
    Array.from({ length: INTRO_N }, (_, i) =>
    card("intro:" + i, `<b>Frame ${i + 1}</b>`, { height: 150 })
    )
  );

  // 4 ── XP desktop wallpapers -------------------------------------------
  const WALL_N = 6;
  section(
    "XP wallpapers", WALL_N + " slots · one shown at random", "banner",
    Array.from({ length: WALL_N }, (_, i) =>
    card("wall:" + i, `<b>Wallpaper ${i + 1}</b>`, { height: 168 })
    )
  );

  // 5 ── Playground albums (1 cover + 5 photos each) ---------------------
  // Slot ids: alb:<a>:cover  and  alb:<a>:0..4  — consumed in playground.jsx.
  const ALBUMS = 4;
  const albumNames = PG.albumNames || [];
  for (let a = 0; a < ALBUMS; a++) {
    const name = albumNames[a] || ("Album " + (a + 1));
    const cards = [
    card("alb:" + a + ":cover", `<b>${name}</b><span>cover \u00b7 shows on the desk</span>`, { height: 170, shape: "rounded", radius: 3 })];
    for (let p = 0; p < 5; p++) {
      cards.push(card("alb:" + a + ":" + p, `<b>Photo ${p + 1}</b>`, { height: 150, shape: "rounded", radius: 3 }));
    }
    section(name, "1 cover + 5 photos", "square", cards);
  }

  // 6 ── Desk cutouts (real object photos, transparent PNG) -----------------
  // Slot ids: cutout:radio · cutout:headphones — in playground.jsx.
  // (cutout:computer removed — My Computer is now a fixed icon, not a photo cutout.)
  section(
    "Desk cutouts", "transparent PNGs · swap the drawings", "wide",
    [
    card("cutout:radio", `<b>Radio</b><span>your radio, cut out</span>`, { height: 190, shape: "rect", radius: 2 }),
    card("cutout:headphones", `<b>Headphones</b><span>drops into the collage</span>`, { height: 190, shape: "rect", radius: 2 })]
  );

  // 6b ── The font story (#4) -------------------------------------------------
  // Slot ids: font:cover (dad photo w/ font overlay) · font:scan (handwriting).
  const fs = PG.fontStory || {};
  section(
    fs.title || "The font", "your dad's photo + the original handwriting scan", "wide",
    [
    card("font:cover", `<b>Dad + font photo</b><span>shows on the desk · blurred behind the story</span>`, { height: 190, shape: "rect", radius: 2 }),
    card("font:scan", `<b>Handwriting scan</b><span>original, beside the digitized font</span>`, { height: 190, shape: "rect", radius: 2 })]
  );

  // 6c ── Personal mix covers -------------------------------------------------
  // Slot ids: mix:<id>:cover — consumed by the player. (Audio files come from
  // Jacob directly; these are just the cover images.)
  const mixes = (window.PORTFOLIO_DATA.playground && window.PORTFOLIO_DATA.playground.mixes) || [];
  if (mixes.length) {
    section(
      "Mix covers", "cover art for your personal mixes", "square",
      mixes.map((m) => card("mix:" + m.id + ":cover", `<b>${m.title}</b><span>cover art</span>`, { height: 160, shape: "rounded", radius: 4 }))
    );
  }

  // 6d ── Upload your own radio mixes (real shared files, size-capped) -----
  // Appends to the playlists list the radio reads (window.AudioStore).
  // Full-length mixes: send the file directly like mix-1/mix-2 in data.js —
  // no size limit that way, it just skips this in-browser upload step.
  (function audioUploadSection() {
    if (!window.AudioStore) return;
    const sec = el("section", "mm-section");
    const head = el("div", "mm-sec-head");
    head.appendChild(el("h2", null, "Upload your own mixes"));
    head.appendChild(el("span", "mm-hint", "real files, shown for everyone \u00b7 mp3/m4a/wav/ogg \u00b7 up to 75MB each"));
    sec.appendChild(head);

    const drop = el("div", "mm-audio-drop");
    drop.innerHTML =
    '<div class="mm-audio-drop-inner">' +
    '<div class="mm-audio-ic">\u266A</div>' +
    '<div class="mm-audio-cap">Drop an audio file, or click to browse</div>' +
    '<input class="mm-audio-title" type="text" placeholder="Track title (e.g. \u2018Summer 2026 mix\u2019)" />' +
    '<input class="mm-audio-file" type="file" accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/x-m4a,audio/aac" hidden />' +
    '<div class="mm-audio-status"></div>' +
    '</div>';
    sec.appendChild(drop);

    const list = el("div", "mm-audio-list");
    sec.appendChild(list);
    root.appendChild(sec);

    const fileInput = drop.querySelector(".mm-audio-file");
    const titleInput = drop.querySelector(".mm-audio-title");
    const status = drop.querySelector(".mm-audio-status");
    const inner = drop.querySelector(".mm-audio-drop-inner");

    function setStatus(msg, isErr) {
      status.textContent = msg || "";
      status.style.color = isErr ? "#c0392b" : "";
    }

    async function handleFile(f) {
      if (!f) return;
      const title = titleInput.value.trim();
      setStatus("uploading\u2026");
      try {
        await window.AudioStore.add(f, title);
        setStatus("added \u2713");
        titleInput.value = "";
        setTimeout(() => setStatus(""), 2200);
      } catch (err) {
        setStatus((err && err.message) || "couldn't add that file", true);
      }
    }

    inner.addEventListener("click", (e) => {
      if (e.target === titleInput) return;
      fileInput.click();
    });
    fileInput.addEventListener("change", () => { handleFile(fileInput.files[0]); fileInput.value = ""; });
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
    drop.addEventListener("drop", (e) => { const f = e.dataTransfer.files && e.dataTransfer.files[0]; handleFile(f); });

    function renderList() {
      list.innerHTML = "";
      const items = window.AudioStore.list();
      if (!items.length) { list.appendChild(el("div", "mm-audio-empty", "no uploads yet")); return; }
      items.forEach((it) => {
        const row = el("div", "mm-audio-row");
        row.innerHTML =
        '<div class="mm-audio-row-title">' + (it.title || "Untitled") + "</div>" +
        '<div class="mm-audio-row-size">' + (it.size / 1024 / 1024).toFixed(1) + " MB</div>" +
        '<audio controls preload="none" src="' + window.AudioStore.urlFor(it.id) + '"></audio>' +
        '<button class="mm-audio-remove" title="Remove">\u2715</button>';
        row.querySelector(".mm-audio-remove").addEventListener("click", () => window.AudioStore.remove(it.id));
        list.appendChild(row);
      });
    }
    window.AudioStore.load().then(renderList);
    window.AudioStore.subscribe(renderList);
  })();

  // 7 ── Project galleries (extra images shown on the full-page open) ------
  // Slot ids: gallery:<projectId>:0..5 — consumed in app.jsx ProjectPage.
  for (const w of work) {
    const ids = Array.from({ length: 6 }, (_, i) => "gallery:" + w.id + ":" + i);
    const grid = section(
      "Gallery — " + w.title, "up to 6 extra images · drag ⠿ to reorder · " + w.client, "square",
      ids.map((id, i) => card(id, `<b>Image ${i + 1}</b>`, { height: 150, shape: "rounded", radius: 4 }))
    );
    if (grid) makeReorderable(grid, ids);
  }

  // footer status
  const foot = document.getElementById("mm-foot");
  const totalSlots = root.querySelectorAll("image-slot").length;
  foot.textContent = totalSlots + " slots · drops save automatically to the project";
})();
