/* =========================================================================
   JACOB FOGELHUT — PORTFOLIO DATA
   Real inventory. Media marked {pending:true} await your uploads — they
   render as warm placeholders until you drop the file in /media.
   ========================================================================= */

window.PORTFOLIO_DATA = {
  name: "Jacob Fogelhut",
  email: "jacobfogelhut@gmail.com",

  /* INTRO — the load animation flips through these frames behind the marker
     name, then dissolves into the site. Drop a BATCH of stills into /media and
     list them here (paths or {src}). Any slot left null renders a warm color
     block so the cycle still reads. ~8–14 frames feels best. */
  introFrames: [
    "media/frame-esenes.jpg",
    null, null, null, null, null, null, null, null, null
  ],

  // Hero role line — options compared via Tweaks.
  taglines: [
    "Multimedia Creative",
    "Marketing",
    "Social Media",
    "Fashion",
    "Music",
    "Brands",
    "Content",
    "Campaigns",
    "Events",
    "Videos"
  ],

  /* ----------------------------------------------------------------------
     WORK — grouped by `client` for the Brands view; shown flat for the
     Projects view. media.kind ∈ instagram | video | spotify | image
     Add `still` (an uploaded cover image) to give a piece a static picture
     on the main page; otherwise a warm color block stands in.
     ---------------------------------------------------------------------- */
  work: [
    { id: "esenes-campaign", client: "ESENES", title: "S/S Collection 2025", brands: ["ESENES"],
      role: "Creative direction & production support", tag: "ESENES", tags: ["ESENES", "Campaign", "Fashion"], featured: true, titleAlign: "left",
      still: null, media: { kind: "instagram", src: "https://www.instagram.com/p/DI1q4AKzqeU/" } },

    { id: "esenes-campaign-video", client: "ESENES", title: "Eyeball Mules", brands: ["ESENES"],
      role: "Video content for the campaign", tag: "ESENES", tags: ["ESENES", "Campaign", "Film"], featured: true,
      still: null, media: { kind: "video", src: "media/campaign-video.mp4", pending: true, poster: "media/campaign-poster.jpg" } },

    { id: "esenes-viral", client: "ESENES X TOMBOGO", title: "ESENES X TOMBOGO Christmas Popup", brands: ["ESENES", "TOMBOGO"],
      role: "Planned, coordinated, set up live event, while creating and producing event merch", tag: "ESENES X TOMBOGO", tags: ["ESENES", "TOMBOGO", "Event", "Social"],
      still: null, media: { kind: "instagram", src: "https://www.instagram.com/p/C7PqdQ8JedE/" } },

    { id: "esenes-event", client: "ESENES", title: "HYPEBEAST FLEA", brands: ["ESENES"],
      role: "Full event coordination & execution", tag: "ESENES", tags: ["ESENES", "Event"],
      still: null, media: { kind: "instagram", src: "https://www.instagram.com/p/DXFN-iDGM82/" } },

    { id: "esenes-shoot", client: "ESENES X BRAVEST STUDIOS", title: "Brainiac Mules", brands: ["ESENES", "BRAVEST"],
      role: "On-set production & shoot assisting", tag: "ESENES X BRAVEST STUDIOS", tags: ["ESENES", "BRAVEST", "Campaign", "Production"],
      still: null, media: { kind: "instagram", src: "https://www.instagram.com/p/DH6cmk1p0HA/" } },

    { id: "hyphy-doc", client: "TOMBGOGO", title: "Girbogos Campaign", brands: ["TOMBOGO"],
      role: "Micro-documentary on Bay Area hyphy culture", tag: "TOMBOGO", tags: ["TOMBOGO", "Film", "Documentary"], featured: true,
      still: "media/tombogo-bus.jpg", media: { kind: "video", src: "media/is-hyphy-dead.mp4", pending: true, poster: "media/hyphy-poster.jpg" } },

    { id: "noise-complaints", client: "Noise Complaints", title: "RNB Experience Tour", brands: ["Noise Complaints"],
      role: "Content creation & social media management", tag: "NOISE COMPLAINTS", tags: ["Noise Complaints", "Tour", "Social"],
      still: null, media: { kind: "instagram", src: "https://www.instagram.com/p/DX43DXbvgQD/",
        more: ["https://www.instagram.com/p/DX0IZb5j_ul/", "https://www.instagram.com/p/DX07vUZJizh/"],
        moreLabels: ["Instagram post 2", "Instagram post 3"] } },

    /* JUSTIN PARK / 5A — one campaign entry. The two pieces (the MV + the
       Shady single/album) live together. `embeds` stacks below a gallery of
       the title pictures on the opened project. Title pictures cross-fade on
       hover — drop up to 5 via the Media Manager (still:justin-park-mv,
       still:justin-park-mv:1..4) or the on-page edit layer. */
    { id: "justin-park-mv", client: "JUSTIN PARK / 5A", title: "I Can See The Stars From Here", brands: ["5A", "Justin Park"],
      role: "Working under 5A owner Peter Hong, I helped with the rollout of the label's main artist Justin Park hit album, \"I Can See The Stars From Here\". From marketing to production, anything that needed to be done, I was there to help. 5A was an imprint of Steel Wool, who brought acts such as Anderson .Paak and Tobi Lou to the forefront, and who was partnered with EMPIRE.",
      tag: "JUSTIN PARK / 5A", tags: ["5A", "Justin Park", "Music", "Music Video"], titleAlign: "left",
      still: null, media: { kind: "instagram", src: "https://www.instagram.com/p/CdPQmGpPeMd/" },
      embeds: [
        { kind: "instagram", src: "https://www.instagram.com/p/CdPQmGpPeMd/", label: "'SHADY' MUSIC VIDEO" },
        { kind: "spotify",   src: "https://open.spotify.com/embed/album/59d6GhSOOMRlfYrAc6jfeo", label: "I CAN SEE THE STARS FROM HERE - ALBUM BY JUSTIN PARK.\n5A LABEL, UNDER STEEL WOOL AND EMPIRE", labelAlign: "center" }
      ] },

    { id: "caosmote", client: "CAOS MOTE X ESENES", title: "Complexcon", brands: ["CAOS MOTE", "ESENES"],
      role: "Social content & creative", tag: "CAOS MOTE X ESENES", tags: ["CAOS MOTE", "ESENES", "Event"],
      still: null, media: { kind: "instagram", src: "https://www.instagram.com/caosmote/" } }
  ],

  /* ----------------------------------------------------------------------
     DECKS — covers only; full deck on request (mailto). Drop cover art into
     /media and set `cover` to replace the typeset placeholder.
     ---------------------------------------------------------------------- */
  decks: [
    { id: "esenes-hotboys", client: "ESENES × HOTBOYS", title: "Collaboration Deck",
      note: "Collaboration concept matched to the HOTBOYS aesthetic", cover: null },
    { id: "liz-campos", client: "Liz Campos", title: "Brand Consultation",
      note: "Marketing systems for a fashion brand", cover: null },
    { id: "plus-one", client: "PLUS ONE", title: "Show Pitch Deck",
      note: "Pitch deck to sell a show concept", cover: null }
  ],

  /* ----------------------------------------------------------------------
     PLAYGROUND — a little retro desktop.
     ---------------------------------------------------------------------- */
  playground: {
    // About / readme.txt — verbatim from you.
    about: "just a guy living life.\ni can help your dreams come true.\nlets make your ideas real.\n\nlive laugh love",

    // Apple Music first (set in Playground.html embed); Spotify fallback album.
    appleMusic: "https://embed.music.apple.com/us/playlist/2026/pl.u-gxblvzRt88Kpbp",
    spotify: "https://open.spotify.com/embed/album/59d6GhSOOMRlfYrAc6jfeo",

    /* RADIO — click the radio to cycle these. Each opens the bottom player bar.
       NOTE: web embeds bring their OWN play/shuffle controls and play ~30s
       previews unless the listener is signed in. Swap these 4 for your real
       Spotify/Apple embed URLs (use the …/embed/… form). */
    radio: [
      { name: "FAV SONG '26",   kind: "apple",   embed: "https://embed.music.apple.com/us/playlist/2026/pl.u-gxblvzRt88Kpbp" },
      { name: "SPOTIFY LIKES",  kind: "spotify", embed: "https://open.spotify.com/embed/playlist/37i9dQZF1F5p3rmiWPIYgZ" },
      { name: "DJ SET",         kind: "spotify", embed: "https://open.spotify.com/embed/playlist/6gRvWOkNh2iVvQBjOURGsj" },
      { name: "5A / ALBUM",     kind: "spotify", embed: "https://open.spotify.com/embed/album/59d6GhSOOMRlfYrAc6jfeo" }
    ],

    // Personal projects (live in the "Projects" folder on the desktop).
    projects: [
      { id: "hunters-finds", title: "Hunter's Finds", note: "Food-rating web app I built for friends",
        kind: "web", src: "https://hunters-finds.vercel.app/" },
      { id: "top-dog", title: "Top Dog", note: "Shirt design for friends",
        kind: "image", src: "media/top-dog.png", pending: true }
    ],

    // Gallery (you upload later → placeholders for now).
    galleryCount: 6,

    /* ----------------------------------------------------------------------
       THE FONT — your dad's handwriting, digitized. Shown on the desk as a
       photo of him with the font over it (upload slot "font:cover"); click it
       to open the story panel. EDIT the title + story below in your words.
       The downloadable file is fonts/jacob-custom.otf (offered as
       "Lloyd Fogelhut.otf"). Original-handwriting scan = slot "font:scan".
       ---------------------------------------------------------------------- */
    /* Album names shown in the Media Manager section headers (upload-side
       organization, unchanged). Gallery-facing category labels are separate
       (see galleryCategoryNames) so the desk/gallery can use different names
       than the raw upload sections. */
    albumNames: ["Berlin", "Vietnam", "Food", "Me"],
    galleryCategoryNames: ["Europe", "Asia", "Food", "Me"],

    fontStory: {
      title: "My Dads Handwriting",
      maker: "Lloyd Fogelhut",
      story:
        "inspired by a creator immortalizing her architect dad and my need to create, i found a way i could try to honor my dad as well. Growing up, I thought he had the coolest and most unique handwriting. I loved watching him write me absent excuses for school, and i saw his building drafts as his artwork.\n\n" +
        "scanning actual notes and drafts from his early work and cleaning up each letter in Photoshop, i have made his handwriting into a usable and downloadable font. i want to share it with the world, so please download it below, and i hope you find a fun use with it. if you do, please show me!\n\n" +
        "He started to lose his memory after chemo in 2018, and has slowly been deteriorating. affirming what we already knew, he was diagnosed with mild to moderate alzheimers. my mom said he cracked a joke immediately after the doctor told them the news. thats how he has been living his life for the past 15 years. from two different chemo treatments, to losing his memory, he has stayed positive and has laughed through the process. while he may ask me seven times in a row if i saw my cousin on a trip, each time will have a new joke. Frustrating for him a lot of the time, he will always find the positive in everything and anything.\n\n" +
        "one of my role models, one of my heroes, and my main inspiration for how i live my life. please download, use, and share the ice city architects font.",
      sample: "Abcdefghijklmnopqrstuvwxyz\n0 1 2 3 4 5 6 7 8 9  & ? ! @ #",
      fontFile: "fonts/jacob-custom.otf",
      downloadAs: "Lloyd Fogelhut.otf",
      previewPlaceholder: "type here"
    },

    /* ----------------------------------------------------------------------
       PERSONAL MIXES — your own audio (real files). Send me the mp3s and I'll
       drop them in + point each `src` at the file. Covers upload via the Media
       Manager (slot "mix:<id>:cover"). Single-file DJ sets by default; add a
       `tracks:[{title,src}]` array to any mix for in-mix song skipping.
       ---------------------------------------------------------------------- */
    mixes: [
      { id: "mix-1", title: "103.5 ITS ON THE FLOOR RADIO", src: "media/mixes/mix-1.mp3" },
      { id: "mix-2", title: "KWP 730 AM — DHALEED X DJ FUCKER MORNING INSPIRATION", src: "media/mixes/mix-2.mp3" },
      { id: "mix-4", title: "DJ FUCKER X DHALEED RADIO FRIENDLY", src: "media/mixes/mix-4.mp3" },
      { id: "mix-3", title: "Mix 03", src: null, pending: true }
    ],

    // Recycle Bin easter-egg — scrapped ideas, for the lol.
    trash: [
      "comic-sans-portfolio.psd",
      "live-laugh-love.txt",
      "autoplay-music-on-load.mp4",
      "13-fonts-on-one-page.ai",
      "spinning-3d-logo.gif"
    ]
  }
};

/* group work by client, preserving first-seen order */
window.PORTFOLIO_DATA.brands = (() => {
  const map = new Map();
  window.PORTFOLIO_DATA.work.forEach((w) => {
    if (!map.has(w.client)) map.set(w.client, []);
    map.get(w.client).push(w);
  });
  return [...map.entries()].map(([client, items]) => ({ client, items }));
})();

/* ------------------------------------------------------------------------
   REMOTE_MEDIA — permanent Vercel Blob URLs for slots you've uploaded.
   slots.js falls back to these when there's no locally-dropped (data:image)
   override, so the deployed static site shows real photos with no local
   editing step needed. Re-run this block whenever you add more Blob URLs.
   ------------------------------------------------------------------------ */
window.REMOTE_MEDIA = {
  "still:esenes-campaign": {
    "u": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou%20%284%29.jpg",
    "s": 1,
    "x": 0,
    "y": -6.3
  },
  "still:esenes-campaign:1": {
    "u": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou%20%285%29.jpg",
    "s": 1,
    "x": 0,
    "y": 21.3
  },
  "still:esenes-campaign:2": {
    "u": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou%20%281%29.jpg",
    "s": 1,
    "x": 0,
    "y": 15.2
  },
  "still:esenes-campaign:3": {
    "u": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/SNS%20GUAPDAD/The%20money%201%20.jpg",
    "s": 1,
    "x": 0,
    "y": -26
  },
  "still:esenes-campaign:4": {
    "u": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou.jpg",
    "s": 1,
    "x": 0,
    "y": -26
  },
  "still:esenes-campaign-video": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/EYEBALL%20MULES/SnapInsta.to_438302740_18312275347195620_839705704249114929_n.jpg",
  "still:esenes-viral": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/HOLIDAY%20PARTY/SNSBOGOPARTY4.jpg",
  "still:esenes-event": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/HYPEBEAST%20FLEA/HYPEBEAST%20FLEA%201.jpg",
  "still:esenes-event:1": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/HYPEBEAST%20FLEA/SnapInsta.to_440941534_18312275386195620_4417222009002327521_n.jpg",
  "still:esenes-event:2": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/HYPEBEAST%20FLEA/HYPEBEAST%20FLEA%202.JPG",
  "still:esenes-shoot": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/BRAINIAC%20MULES/ESENES%20X%20BRAVEST%20BRAIN%20MULES.jpg",
  "still:hyphy-doc": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/GIRBOGO/GIRBOGO.jpg",
  "still:noise-complaints": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/RNB%20EXPERIENCE%20NC/NOISE%20COMPLAINTS.jpg",
  "still:noise-complaints:1": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/RNB%20EXPERIENCE%20NC/SACRAMENTO%20TONIGHT%21%20See%20you%20soon%E2%80%A6come%20ready%20%F0%9F%97%A3%EF%B8%8F%20Get%20your%20ticket%20in%20bio%20%F0%9F%92%9BDoors%207-30pm%40reecaps%208p.jpg",
  "still:justin-park-mv": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/JUSTIN%205A/JUSTIN%20PARK%20ICSTSFH.jpeg",
  "still:caosmote": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/COMPLEXCON/403097098_18289466236195620_2842022214363690_n.png",
  "still:caosmote:1": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/COMPLEXCON/402986968_18289466200195620_5719385799644348403_n%202.png",
  "still:caosmote:2": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/COMPLEXCON/SNSMOTE%20COMPLEXCON.png",
  "intro:0": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/COMPLEXCON/402986968_18289466200195620_5719385799644348403_n%202.png",
  "intro:1": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/BRAINIAC%20MULES/ESENES%20X%20BRAVEST%20BRAIN%20MULES.jpg",
  "intro:2": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/HYPEBEAST%20FLEA/HYPEBEAST%20FLEA%20MAIN.png",
  "intro:3": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/RNB%20EXPERIENCE%20NC/NOISE%20COMPLAINTS.jpg",
  "intro:4": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/GIRBOGO/GIRBOGO.jpg",
  "intro:5": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/HOLIDAY%20PARTY/SNSBOGOPARTY4.jpg",
  "intro:6": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou%20%285%29.jpg",
  "intro:7": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/JUSTIN%205A/SHADY%20MV.png",
  "intro:8": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/COMPLEXCON/403097098_18289466236195620_2842022214363690_n.png",
  "intro:9": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou%20%281%29.jpg",
  "intro:10": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/COMPLEXCON/SNSMOTE%20COMPLEXCON.png",
  "intro:11": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/COMPLEXCON/403097098_18289466236195620_2842022214363690_n.png",
  "wall:0": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/COMPUTER%20BG%20PICS/WALLPAPER%201.JPG",
  "wall:1": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/COMPUTER%20BG%20PICS/WALLPAPER%202.JPG",
  "wall:2": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/COMPUTER%20BG%20PICS/WALLPAPER%203.JPG",
  "wall:3": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/VIETNAM/VIETNAM%202.JPG",
  "wall:4": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/COMPUTER%20BG%20PICS/WALLPAPER%205.JPG",
  "wall:5": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/BERLIN/BERLIN5.JPG",
  "alb:0:cover": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/BERLIN/BERLIN%20COVER.JPG",
  "alb:0:0": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/BERLIN/BERLIN%201.JPG",
  "alb:0:1": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/BERLIN/BERLIN%202.JPG",
  "alb:0:2": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/BERLIN/BERLIN%203.JPG",
  "alb:0:3": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/BERLIN/BERLIN%204.JPG",
  "alb:0:4": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/BERLIN/BERLIN5.JPG",
  "alb:1:cover": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/VIETNAM/VIETNAM%20COVER.JPG",
  "alb:1:0": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/VIETNAM/VIETNAM%201.JPG",
  "alb:1:1": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/VIETNAM/VIETNAM%202.JPG",
  "alb:1:2": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/VIETNAM/VIETNAM%203.JPG",
  "alb:1:3": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/VIETNAM/VIETNAM%204.JPG",
  "alb:1:4": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/VIETNAM/VIETNAM%205.JPG",
  "alb:2:cover": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/FOOD/FOOD%20COVER.JPG",
  "alb:2:0": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/FOOD/FOOD%201.JPG",
  "alb:2:1": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/FOOD/IMG_4464.JPG",
  "alb:2:2": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/FOOD/FOOD%203.JPG",
  "alb:2:3": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/FOOD/FOOD%204.JPG",
  "alb:2:4": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/FOOD/FOOD%205.JPG",
  "alb:3:cover": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/WEDDING/WEDDING%20COVER.JPG",
  "alb:3:0": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/WEDDING/WEDDING%202.JPG",
  "alb:3:1": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/WEDDING/EDP_Olivia%26Kevin-1207.png",
  "alb:3:2": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/WEDDING/WEDDING%203.JPG",
  "alb:3:3": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/WEDDING/WEDDING%204.JPG",
  "alb:3:4": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/POLAROIDS/WEDDING/EDP_Olivia%26Kevin-1318.HEIC",
  "font:cover": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/DAD%20FONT/DAD%20FONT%20COVER.png",
  "font:scan": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/DAD%20FONT/DAD%20FONT%202.JPG",
  "gallery:esenes-campaign:0": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou%20%285%29.jpg",
  "gallery:esenes-campaign:1": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou%20%284%29.jpg",
  "gallery:esenes-campaign:2": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou.jpg",
  "gallery:esenes-campaign:3": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/SNS%20GUAPDAD/The%20money%201%20.jpg",
  "gallery:esenes-campaign:4": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou%20%281%29.jpg",
  "gallery:esenes-campaign-video:0": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/HOLIDAY%20PARTY/SNSBOGOPARTY4.jpg",
  "gallery:esenes-campaign-video:1": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/HOLIDAY%20PARTY/SNSBOGOPARTY2.jpg",
  "gallery:esenes-event:0": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/HYPEBEAST%20FLEA/HYPEBEAST%20FLEA%201.jpg",
  "gallery:esenes-event:1": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/HYPEBEAST%20FLEA/HYPEBEAST%20FLEA%202.JPG",
  "gallery:esenes-event:2": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/HYPEBEAST%20FLEA/HYPEBEAST%20FLEA%20MAIN.png",
  "gallery:caosmote:0": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/COMPLEXCON/403097098_18289466236195620_2842022214363690_n.png",
  "gallery:caosmote:1": "https://j9jjnlvirhb1j0tp.public.blob.vercel-storage.com/assets/COMPLEXCON/402986968_18289466200195620_5719385799644348403_n%202.png"
};
