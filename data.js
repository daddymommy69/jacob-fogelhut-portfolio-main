/* =========================================================================
   JACOB FOGELHUT — PORTFOLIO DATA
   Real inventory. Media marked {pending:true} await your uploads — they
   render as warm placeholders until you drop the file in /media.
   ========================================================================= */

window.PORTFOLIO_DATA = {
  name: "Jacob Fogelhut",
  email: "jacobfogelhut@gmail.com",

  /* Contact form target. Paste a Formspree endpoint (https://formspree.io/f/xxxx)
     and messages land in your inbox; left empty the form composes a mail
     instead, so it always works. */
  formEndpoint: "https://formspree.io/f/xqpaqrgj",

  /* ----------------------------------------------------------------------
     LINKS — names that become clickable wherever they appear in a blurb or
     role line. Edited in Link Manager.html. Longest name wins, so
     "ESENES X TOMBOGO" is matched before "ESENES".
     ---------------------------------------------------------------------- */
  links: [/*LINKS-BEGIN*/
  /*LINKS-END*/],

  /* Links in the desktop's Start menu. Empty entries are simply not shown —
     fill in the ones you want listed. */
  social: {
    instagram: "https://www.instagram.com/11010101010110111011111011o/",
    spotify: "https://open.spotify.com/user/zhvgozwd7lug07mvvcnkd4kg0?si=7687076f132741f8",
    appleMusic: "https://music.apple.com/profile/lildicklongdick",
    linkedin: "https://www.linkedin.com/in/jacob-fogelhut/",
    phone: ""
  },

  /* INTRO — the load animation flips through these frames behind the marker
     name, then dissolves into the site. Drop a BATCH of stills into /media and
     list them here (paths or {src}). Any slot left null renders a warm color
     block so the cycle still reads. ~8–14 frames feels best. */
  introFrames: [
    "media/frame-esenes.jpg",
    null, null, null, null, null, null, null, null, null
  ],

  // Hero role line — the fixed claim under the name.
  tagline: "Multimedia creative | I make things and help make things",

  // Contact section — heading and button label.
  contactHeading: "Let's work",
  contactCta: "Get in touch",

  // Kept as alternates (Tweaks can still cycle or pin any one of these).
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
      role: "ESENES' Spring/Summer 2025 collection- head to toe. Hyphy inspired campaign for the loud product drop with Oakland's own Guapdad4000 as the main model. Helped with campaign direction and production, from ideation to execution, including an amazing photoshoot with Pinkbox Studios. Digital marketing efforts concluded over 1.5+ million impressions and 40k+ likes on Instagram throughout the campaign.", tag: "ESENES", tags: ["ESENES", "Campaign", "Fashion"], featured: true, titleAlign: "left",
      still: null, media: { kind: "instagram", src: "https://www.instagram.com/p/DI1q4AKzqeU/",
        more: ["https://www.instagram.com/reel/DH6cmk1p0HA/"],
        moreLabels: [""] } },

    { id: "esenes-campaign-video", client: "ESENES", title: "Eyeball Mules", brands: ["ESENES"],
      role: "Video content and marketing efforts resulted in a viral video with 200k+ likes on Instagram as well several million impressions, creating a statement piece for the brand.", tag: "ESENES", tags: ["ESENES", "Campaign", "Film"], featured: true,
      still: null, media: { kind: "video", src: "media/campaign-video.mp4", pending: true, poster: "media/campaign-poster.jpg" } },

    { id: "esenes-viral", client: "ESENES X TOMBOGO", title: "ESENES X TOMBOGO Christmas Popup", brands: ["ESENES", "TOMBOGO"],
      role: "Planned, coordinated, set up live holiday event, between ESENES/TOMBOGO and 3319 Marché in Oakland, CA. Produced and planned event while creating and producing event merch.", tag: "ESENES X TOMBOGO", tags: ["ESENES", "TOMBOGO", "Event", "Social"],
      still: null, media: { kind: "instagram", src: "https://www.instagram.com/p/C7PqdQ8JedE/" } },

    { id: "esenes-event", client: "ESENES", title: "HYPEBEAST FLEA", brands: ["ESENES"],
      role: "Full event coordination & execution. Managed the booth for the duration of the event, resulting in $10k+ in sales in two days, a 4x increase on projections", tag: "ESENES", tags: ["ESENES", "Event"],
      still: null, media: { kind: "instagram", src: "https://www.instagram.com/p/DXFN-iDGM82/" } },

    { id: "esenes-shoot", client: "ESENES X BRAVEST STUDIOS", title: "Brainiac Mules", brands: ["ESENES", "BRAVEST"],
      role: "Brand production assistant for campaign shoot as well as marketing campaign efforts. Filmed & directed by Pinkbox Studios, starring Jay305", tag: "ESENES X BRAVEST STUDIOS", tags: ["ESENES", "BRAVEST", "Campaign", "Production"],
      still: null, media: { kind: "instagram", src: "https://www.instagram.com/reel/C33NswCJ6F4/" } },

    { id: "hyphy-doc", client: "TOMBGOGO", title: "Girbogos Campaign", brands: ["TOMBOGO"],
      role: "Campaign shoot production help as well as content creation. Created multiple videos, including a BTS quickshot video for post release campaign efforts, as well as a microdocumentary of the shoot. Bay area centered and for the Girbogos, directly influenced by Girbaud denim, which was a key piece of fashion for the Hyphy era in the Bay Area. Video includes conversations with superstar Bay Area Creatives, such a P-LO, Karri, Jahlil Nzinga of Nzinga Studios, Nef The Pharaoh, Jay Anthony, etc.", tag: "TOMBOGO", tags: ["TOMBOGO", "Film", "Documentary"], featured: true,
      still: "media/tombogo-bus.jpg", media: { kind: "video", src: "media/is-hyphy-dead.mp4", pending: true, poster: "media/hyphy-poster.jpg" } },

    { id: "noise-complaints", client: "Noise Complaints", title: "RNB Experience Tour", brands: ["Noise Complaints"],
      role: "Content creation & social media management for the California leg of Noise Complaints' RnB Experience tour. live posted social media, created photo & video content.", tag: "NOISE COMPLAINTS", tags: ["Noise Complaints", "Tour", "Social"],
      still: null, media: { kind: "instagram", src: "https://www.instagram.com/p/DX0IZb5j_ul/" } },

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
      role: "Helped produce, set up, and manage ESENES/ CAOS MOTE booth for complexcon. Assisted with art direction. Social content & creative", tag: "CAOS MOTE X ESENES", tags: ["CAOS MOTE", "ESENES", "Event"],
      still: null, media: { kind: "instagram", src: "https://www.instagram.com/caosmote/" } }
  ],

  /* ----------------------------------------------------------------------
     DECKS — covers only; full deck on request (mailto). Drop cover art into
     /media and set `cover` to replace the typeset placeholder.
     ---------------------------------------------------------------------- */
  decks: [
    { id: "esenes-hotboys", client: "ESENES × HOTBOYS", title: "Collaboration Deck",
      note: "Pitch for collaboration HOTBOYS in Bay Area, CA. Agreed to do their in house merch, uniform, and a food product on their menu.", cover: null },
    { id: "liz-campos", client: "Liz Campos", title: "Brand Consultation",
      note: "Pitch deck for helping develop marketing systems for a fashion brand based in Mexico City.", cover: null },
    { id: "plus-one", client: "PLUS ONE", title: "Show Pitch Deck",
      note: "Pitch deck to sell a show concept to creatives", cover: null }
  ],

  /* ----------------------------------------------------------------------
     EXTRA TAGS — tags for everything that isn't a work project (decks,
     playground projects, mixes, radio stations, photo albums, the font).
     Nothing here is displayed on its own item; these only surface when a
     tag page is opened. Edited through Tag Manager.html.
     Keys: deck:<id> · pg:<id> · mix:<id> · radio:<index> · album:<index> · font
     ---------------------------------------------------------------------- */
  extraTags: {
  },

  /* ----------------------------------------------------------------------
     BLURBS — a line of context for each playground piece. Written in
     Copy Deck v2.html. Same key scheme as extraTags, plus app:<id> for the
     desk apps themselves.
     Keys: app:<id> · radio:<index> · mix:<id> · album:<index> · font
     ---------------------------------------------------------------------- */
  blurbs: {
    "app:radio": "Various concept mixes/tapes I created or helped create for fun. One fake radio station with adverts and all, one classic mixtape DJ inspired, as the likes of a DJ Drama/Scream/Don Cannon style tape, one mix created to DJ a wedding. Last mix is a concept tape about an alien coming to Earth. Fun stuff here",
    "app:listening": "Random Playlists including my favorite releases of 2026 and Spotify likes. Come pick my brain",
    "app:photos": "Photos from wherever I was. Bad quality iPhone pics are in the moment and professional shots are from my fans AKA wedding Photographers. Come see a slice of my life.",
    "app:guestbook": "Write something down.  I read every one of them, I swear",
    "app:paint": "Draw something. Save downloads it as a PNG.",
    "app:letter": "Type a note and it comes out in my handwriting.",
    "font": "A typeface drawn from my dad's handwriting."
  },

  /* ----------------------------------------------------------------------
     KRINKY — the playground assistant. He reads the blurbs above, and
     these are his own lines. Edited in Copy Deck v2.html → Krinky.
     greeting  first arrival ever    returning every visit after that
     idle      unprompted, after 20s
     open      you opened a window  click     you clicked him
     fallback  item has no blurb    reaction  follows one of your blurbs
     music     a mix is playing     viz       you changed the visualizer
     watch     idle "watch this" line, linked to a random entry in videos
     ---------------------------------------------------------------------- */
  krinky: {
    greeting: [
      "Hi. I'm Krinky. I live here."
    ],
    returning: [
      "its me krinky again",
      "lets a krinky dinky time",
      "im gonna go krinko mode",
      "my krinkometer is busting",
      "krinky is so back",
      "you again. krinktastic.",
      "i never left. krinkily.",
      "full krink ahead"
    ],
    idle: [
      "Still here. No pressure.",
      "You can open things, by the way.",
      "I counted the icons again. Nine.",
      "This is the part where I say something useful.",
      "Take your time. I have nowhere to be. Literally.",
      "Sometimes I just stand here and buffer."
    ],
    open: [
      "Bold choice.",
      "Ah, this one. Good. Fine. Sure.",
      "I helped with this. I didn't.",
      "Careful, it's load-bearing.",
      "There it is. The thing you clicked.",
      "Drag it, resize it, whatever. Windows are free."
    ],
    click: [
      "Ow.",
      "Yes? I have no additional information.",
      "That's my face.",
      "Please. Not in front of the icons.",
      "You clicked the help. The help is me. This is it.",
      "Again? Okay. Again."
    ],
    fallback: [
      "He hasn't written anything for this one yet.",
      "No notes on this. Draw your own conclusions.",
      "This one speaks for itself. It has to.",
      "I had a line for this. It's gone.",
      "Unlabeled. Mysterious. Probably fine.",
      "I'm told the work speaks. Loudly, allegedly."
    ],
    reaction: [
      "...anyway.",
      "That's the pitch.",
      "I think that's the whole thing, yeah.",
      "He wrote that himself. You can tell.",
      "Wild stuff. Truly.",
      "Take from that what you will."
    ],
    music: [
      "This part's good. Turn it up.",
      "I feel this one in my center hole.",
      "Music's on. Everything's better now. Statistically.",
      "I'd dance but I'm a cursor.",
      "Somebody made this. On purpose.",
      "Volume's a slider. Just saying."
    ],
    viz: [
      "Different shapes. Same music.",
      "Ooh. Do that again.",
      "That's my favourite one. They're all my favourite one.",
      "Now it's a graph. Now it's art.",
      "I preferred the last one. No I didn't.",
      "Keep clicking. Something's bound to happen."
    ],
    /* watch: an idle line; the words in [brackets] link to a random video below */
    watch: [
      "you should watch [this video]"
    ],
    videos: []
  },

  /* ----------------------------------------------------------------------
     PLAYGROUND — a little retro desktop.
     ---------------------------------------------------------------------- */
  playground: {
    // About / readme.txt — verbatim from you.
    about: "just a guy living life.\ni have ideas and i try to make them real\nwhat are your dreams\n\nlive laugh love",

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
      { id: "mix-1", title: "103.5 ITS ON THE FLOOR RADIO", src: "assets/RADIO%20MIXES/103.5%20ITS%20ON%20THE%20FLOOR%201.2.mp3" },
      { id: "mix-4", title: "KWP 730 AM — DHALEED X DJ FUCKER MORNING INSPIRATION", src: "assets/RADIO%20MIXES/DJ%20FUCKER%20X%20DHALEED%20RADIO%20FRIENDLY.mp3" },
      { id: "mix-3", title: "98.1 THE HEARTBEAT LOVERS HOUR", src: "assets/RADIO%20MIXES/FIRST%20MIX.mp3" }
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
   MEDIA HOSTING
   Every entry in REMOTE_MEDIA below is a PATH, not a full URL — the host
   lives in MEDIA_BASE alone. Moving providers is therefore a one-line edit
   here rather than 74 find-and-replaces, and nothing else in the codebase
   knows or cares who is serving the files.

   Cloudflare R2, once the bucket has public access enabled:
     • r2.dev subdomain →  https://pub-<hash>.r2.dev
     • custom domain    →  https://media.yourdomain.com   (preferred: r2.dev
       is rate-limited by Cloudflare and not meant for production traffic)

   Keep the folder structure identical when you re-upload (assets/FOLDER/FILE)
   and every path below keeps working untouched.

   An entry may still be a full https:// URL — anything starting with http is
   left alone — so you can mix hosts during a migration.
   ------------------------------------------------------------------------ */
window.MEDIA_BASE = "https://pub-0c4f005a66f14c8394bc1abf2fcf0d25.r2.dev";

window.REMOTE_MEDIA = {
  "still:esenes-campaign": {
    "u": "assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou%20(4).jpg",
    "s": 1,
    "x": 0,
    "y": -6.3
  },
  "still:esenes-campaign:1": {
    "u": "assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou%20(5).jpg",
    "s": 1,
    "x": 0,
    "y": 21.3
  },
  "still:esenes-campaign:2": {
    "u": "assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou%20(1).jpg",
    "s": 1,
    "x": 0,
    "y": 15.2
  },
  "still:esenes-campaign:3": {
    "u": "assets/SNS%20GUAPDAD/The%20money%201%20.jpg",
    "s": 1,
    "x": 0,
    "y": -26
  },
  "still:esenes-campaign:4": {
    "u": "assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou.jpg",
    "s": 1,
    "x": 0,
    "y": -26
  },
  "still:esenes-campaign-video": "assets/EYEBALL%20MULES/SnapInsta.to_438302740_18312275347195620_839705704249114929_n.jpg",
  "still:esenes-viral": "assets/HOLIDAY%20PARTY/SNSBOGOPARTY4.jpg",
  "still:esenes-event": "assets/HYPEBEAST%20FLEA/HYPEBEAST%20FLEA%201.jpg",
  "still:esenes-event:1": "assets/HYPEBEAST%20FLEA/SnapInsta.to_440941534_18312275386195620_4417222009002327521_n.jpg",
  "still:esenes-event:2": "assets/HYPEBEAST%20FLEA/HYPEBEAST%20FLEA%202.JPG",
  "still:esenes-shoot": "assets/BRAINIAC%20MULES/ESENES%20X%20BRAVEST%20BRAIN%20MULES.jpg",
  "still:hyphy-doc": "assets/GIRBOGO/GIRBOGO.jpg",
  "still:noise-complaints": "assets/RNB%20EXPERIENCE%20NC/NOISE%20COMPLAINTS.jpg",
  "still:noise-complaints:1": "assets/RNB%20EXPERIENCE%20NC/SACRAMENTO%20TONIGHT!%20See%20you%20soon%E2%80%A6come%20ready%20%F0%9F%97%A3%EF%B8%8F%20Get%20your%20ticket%20in%20bio%20%F0%9F%92%9BDoors%207-30pm%40reecaps%208p.jpg",
  "still:justin-park-mv": "assets/JUSTIN%205A/JUSTIN%20PARK%20ICSTSFH.jpeg",
  "still:caosmote": "assets/COMPLEXCON/403097098_18289466236195620_2842022214363690_n.png",
  "still:caosmote:1": "assets/COMPLEXCON/402986968_18289466200195620_5719385799644348403_n%202.png",
  "still:caosmote:2": "assets/COMPLEXCON/SNSMOTE%20COMPLEXCON.png",
  "intro:0": "assets/COMPLEXCON/SNSMOTE%20COMPLEXCON.png",
  "intro:1": "assets/BRAINIAC%20MULES/ESENES%20X%20BRAVEST%20BRAIN%20MULES.jpg",
  "intro:2": "assets/HYPEBEAST%20FLEA/HYPEBEAST%20FLEA%20MAIN.png",
  "intro:3": "assets/RNB%20EXPERIENCE%20NC/NOISE%20COMPLAINTS.jpg",
  "intro:4": "assets/GIRBOGO/GIRBOGO.jpg",
  "intro:5": "assets/HOLIDAY%20PARTY/SNSBOGOPARTY4.jpg",
  "intro:6": "assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou%20(5).jpg",
  "intro:7": "assets/JUSTIN%205A/SHADY%20MV.png",
  "intro:8": "assets/COMPLEXCON/403097098_18289466236195620_2842022214363690_n.png",
  "intro:9": "assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou%20(1).jpg",
  "intro:10": "assets/HYPEBEAST%20FLEA/HYPEBEAST%20FLEA%202.JPG",
  "intro:11": "assets/HYPEBEAST%20FLEA/HYPEBEAST%20FLEA%201.jpg",
  "wall:0": "assets/POLAROIDS/COMPUTER%20BG%20PICS/WALLPAPER%201.JPG",
  "wall:1": "assets/POLAROIDS/COMPUTER%20BG%20PICS/WALLPAPER%202.JPG",
  "wall:2": "assets/POLAROIDS/COMPUTER%20BG%20PICS/WALLPAPER%203.JPG",
  "wall:3": "assets/POLAROIDS/VIETNAM/VIETNAM%202.JPG",
  "wall:4": "assets/POLAROIDS/COMPUTER%20BG%20PICS/WALLPAPER%205.JPG",
  "wall:5": "assets/POLAROIDS/BERLIN/BERLIN5.JPG",
  "alb:0:cover": "assets/POLAROIDS/BERLIN/BERLIN%20COVER.JPG",
  "alb:0:0": "assets/POLAROIDS/BERLIN/BERLIN%201.JPG",
  "alb:0:1": "assets/POLAROIDS/BERLIN/BERLIN%202.JPG",
  "alb:0:2": "assets/POLAROIDS/BERLIN/BERLIN%203.JPG",
  "alb:0:3": "assets/POLAROIDS/BERLIN/BERLIN%204.JPG",
  "alb:0:4": "assets/POLAROIDS/BERLIN/BERLIN5.JPG",
  "alb:1:cover": "assets/POLAROIDS/VIETNAM/VIETNAM%20COVER.JPG",
  "alb:1:0": "assets/POLAROIDS/VIETNAM/VIETNAM%201.JPG",
  "alb:1:1": "assets/POLAROIDS/VIETNAM/VIETNAM%202.JPG",
  "alb:1:2": "assets/POLAROIDS/VIETNAM/VIETNAM%203.JPG",
  "alb:1:3": "assets/POLAROIDS/VIETNAM/VIETNAM%204.JPG",
  "alb:1:4": "assets/POLAROIDS/VIETNAM/VIETNAM%205.JPG",
  "alb:2:cover": "assets/POLAROIDS/FOOD/FOOD%20COVER.JPG",
  "alb:2:0": "assets/POLAROIDS/FOOD/FOOD%201.JPG",
  "alb:2:1": "assets/POLAROIDS/FOOD/IMG_4464.JPG",
  "alb:2:2": "assets/POLAROIDS/FOOD/FOOD%203.JPG",
  "alb:2:3": "assets/POLAROIDS/FOOD/FOOD%204.JPG",
  "alb:2:4": "assets/POLAROIDS/FOOD/FOOD%205.JPG",
  "alb:3:cover": "assets/POLAROIDS/WEDDING/WEDDING%20COVER.JPG",
  "alb:3:0": "assets/POLAROIDS/WEDDING/WEDDING%202.JPG",
  "alb:3:1": "assets/POLAROIDS/WEDDING/EDP_Olivia%26Kevin-1207.png",
  "alb:3:2": "assets/POLAROIDS/WEDDING/WEDDING%203.JPG",
  "alb:3:3": "assets/POLAROIDS/WEDDING/WEDDING%204.JPG",
  "alb:3:4": "assets/POLAROIDS/WEDDING/EDP_Olivia%26Kevin-1318.png",
  "font:cover": "assets/DAD%20FONT/DAD%20FONT%20COVER.png",
  "font:scan": "assets/DAD%20FONT/DAD%20FONT%202.JPG",
  "gallery:esenes-campaign:0": "assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou%20(5).jpg",
  "gallery:esenes-campaign:1": "assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou%20(4).jpg",
  "gallery:esenes-campaign:2": "assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou.jpg",
  "gallery:esenes-campaign:3": "assets/SNS%20GUAPDAD/The%20money%201%20.jpg",
  "gallery:esenes-campaign:4": "assets/SNS%20GUAPDAD/The%20money%20already%20printed.%20So%20buckle%20up%20n%20get%20that%20%F0%9F%92%A9%20my%20beloveds.%20Who%20need%20a%20belt%20thoTo%20show%20ou%20(1).jpg",
  "gallery:esenes-event:0": "assets/HYPEBEAST%20FLEA/HYPEBEAST%20FLEA%201.jpg",
  "gallery:esenes-event:1": "assets/HYPEBEAST%20FLEA/HYPEBEAST%20FLEA%202.JPG",
  "gallery:esenes-event:2": "assets/HYPEBEAST%20FLEA/HYPEBEAST%20FLEA%20MAIN.png",
  "gallery:caosmote:0": "assets/COMPLEXCON/403097098_18289466236195620_2842022214363690_n.png",
  "gallery:caosmote:1": "assets/COMPLEXCON/402986968_18289466200195620_5719385799644348403_n%202.png",
  "gallery:esenes-viral:0": "assets/HOLIDAY%20PARTY/SNSBOGOPARTY4.jpg",
  "gallery:esenes-viral:1": "assets/HOLIDAY%20PARTY/SNSBOGOPARTY2.jpg",
  "gallery:esenes-viral:2": "assets/HOLIDAY%20PARTY/SNSBOGOPARTY3.jpg",
  "gallery:esenes-viral:3": "assets/HOLIDAY%20PARTY/SNS%20X%20BOGO%20CHRISTMAS%20PARTY.jpg",
  "gallery:esenes-event:3": "assets/HYPEBEAST%20FLEA/SnapInsta.to_440941534_18312275386195620_4417222009002327521_n.jpg",
  "gallery:noise-complaints:0": "assets/RNB%20EXPERIENCE%20NC/NOISE%20COMPLAINTS.jpg",
  "gallery:noise-complaints:1": "assets/RNB%20EXPERIENCE%20NC/SACRAMENTO%20TONIGHT!%20See%20you%20soon%E2%80%A6come%20ready%20%F0%9F%97%A3%EF%B8%8F%20Get%20your%20ticket%20in%20bio%20%F0%9F%92%9BDoors%207-30pm%40reecaps%208p.jpg",
  "gallery:noise-complaints:2": "assets/RNB%20EXPERIENCE%20NC/SACRAMENTO%20TONIGHT!%20See%20you%20soon%E2%80%A6come%20ready%20%F0%9F%97%A3%EF%B8%8F%20Get%20your%20ticket%20in%20bio%20%F0%9F%92%9BDoors%207-30pm%40reecaps%208p%20(1).jpg"
};
