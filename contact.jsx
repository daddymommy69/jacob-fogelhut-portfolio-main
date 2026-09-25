/* =========================================================================
   contact.jsx — the Contact page (#contact) and window.linkify.

   Contact is its own route, not a mailto: a short form (name, email, what
   it's for, message) plus every profile. The form posts to
   DATA.formEndpoint (a Formspree endpoint) when one is set; with no
   endpoint it falls back to composing a mail so the page is never a dead
   end.

   linkify turns names inside blurbs into links using DATA.links — pairs of
   {name, url} kept in data.js and edited in Link Manager.html. Longest
   names match first so "ESENES X TOMBOGO" beats "ESENES".
   ========================================================================= */
(function () {
  const { useState, useMemo, useEffect } = React;
  const DATA = window.PORTFOLIO_DATA || {};

  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  /* [words](url) written in Copy Deck becomes a highlighted link; plain
     segments still get the name-matching from DATA.links. */
  const MD = /\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g;
  window.plainText = (s) => (s == null ? s : String(s).replace(MD, "$1"));
  window.linkify = function (text) {
    if (!text) return text;
    const s = String(text);
    if (!s.includes("](")) return names(s);
    const out = []; let last = 0, m, k = 0;
    MD.lastIndex = 0;
    while ((m = MD.exec(s))) {
      if (m.index > last) out.push(<React.Fragment key={k++}>{names(s.slice(last, m.index))}</React.Fragment>);
      out.push(<a key={k++} className="inlink hl" href={m[2]} target="_blank" rel="noopener noreferrer">{m[1]}</a>);
      last = m.index + m[0].length;
    }
    if (last < s.length) out.push(<React.Fragment key={k++}>{names(s.slice(last))}</React.Fragment>);
    return out;
  };
  function names(text) {
    const pairs = (DATA.links || []).filter((l) => l && l.name && l.url);
    if (!text || !pairs.length) return text;
    const sorted = [...pairs].sort((a, b) => b.name.length - a.name.length);
    const re = new RegExp("(" + sorted.map((l) => esc(l.name)).join("|") + ")", "g");
    const parts = String(text).split(re);
    if (parts.length < 2) return text;
    return parts.map((p, i) => {
      const hit = sorted.find((l) => l.name === p);
      return hit
        ? <a key={i} className="inlink" href={hit.url} target="_blank" rel="noopener noreferrer">{p}</a>
        : <React.Fragment key={i}>{p}</React.Fragment>;
    });
  }

  const PROFILES = [
    ["instagram", "Instagram", "logos/instagram.svg"],
    ["linkedin", "LinkedIn", "logos/linkedin.svg"],
    ["spotify", "Spotify", "logos/spotify.svg"],
    ["appleMusic", "Apple Music", "logos/apple-music.svg"]
  ];

  function ContactPage() {
    /* Theme lives in the main site's tweak store; the contact route mounts
       outside <App>, so it reads and writes the same key. */
    const [tw, setTweak] = window.useTweaks({ theme: "light", accent: "#9c7a3c" }, "jf-tweaks-main");
    const [sysDark, setSysDark] = useState(() =>
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    useEffect(() => {
      if (!window.matchMedia) return;
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const f = (e) => setSysDark(e.matches);
      mq.addEventListener("change", f);
      return () => mq.removeEventListener("change", f);
    }, []);
    const effTheme = tw.theme === "auto" ? (sysDark ? "dark" : "light") : tw.theme;
    useEffect(() => { document.documentElement.setAttribute("data-theme", effTheme); }, [effTheme]);
    const cycleTheme = () => {
      const order = ["light", "dark", "auto"];
      setTweak("theme", order[(order.indexOf(tw.theme) + 1) % 3]);
    };
    const tLabel = tw.theme === "auto" ? "Auto" : tw.theme === "dark" ? "Dark" : "Light";

    const S = DATA.social || {};
    const endpoint = DATA.formEndpoint || "";
    const [f, setF] = useState({ name: "", email: "", subject: "", message: "" });
    const [status, setStatus] = useState("");            /* "" | sending | sent | error */
    const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));
    const links = useMemo(() => PROFILES.filter(([k]) => S[k]), [S]);

    const submit = async (e) => {
      e.preventDefault();
      if (!f.name || !f.email || !f.message) return;
      if (!endpoint) {
        const body = `${f.message}\n\n— ${f.name} (${f.email})`;
        location.href = `mailto:${DATA.email}?subject=${encodeURIComponent(f.subject || "Hello")}&body=${encodeURIComponent(body)}`;
        setStatus("sent");
        return;
      }
      setStatus("sending");
      try {
        const r = await fetch(endpoint, {
          method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ name: f.name, email: f.email, subject: f.subject, message: f.message })
        });
        if (!r.ok) throw new Error(r.status);
        setStatus("sent");
        setF({ name: "", email: "", subject: "", message: "" });
      } catch (err) { setStatus("error"); }
    };

    return (
      <div className="cpage">
        <header className="site-head cpage-head">
          <div className="wrap head-inner">
            <a className="head-brand cpage-brand" href="#home">{DATA.name}</a>
            <nav className="head-nav">
              <a href="#work">Work</a>
              <a className="nav-exe" href="#playground">jacob_desktop.exe</a>
              <span className="cpage-here mono">Contact</span>
              <button className="theme-btn" onClick={cycleTheme} aria-label="Toggle theme">
                <span className="dot" style={{ background: effTheme === "dark" ? "currentColor" : "transparent" }}></span>
                {tLabel}
              </button>
            </nav>
          </div>
        </header>
        <section className="wrap cpage-body">
          <h1 className="cpage-title" style={{ fontFamily: "JacobMarker" }}>Contact me</h1>
          <div className="cpage-grid">
            <form className="cform" onSubmit={submit}>
              <label className="cf-row">
                <span className="mono">Name</span>
                <input value={f.name} onChange={set("name")} required autoComplete="name" />
              </label>
              <label className="cf-row">
                <span className="mono">Email</span>
                <input type="email" value={f.email} onChange={set("email")} required autoComplete="email" />
              </label>
              <label className="cf-row">
                <span className="mono">Inquiry</span>
                <input value={f.subject} onChange={set("subject")} />
              </label>
              <label className="cf-row">
                <span className="mono">Message</span>
                <textarea rows="6" value={f.message} onChange={set("message")} required></textarea>
              </label>
              <div className="cf-send">
                <button className="cf-btn" type="submit" disabled={status === "sending"}>
                  {status === "sending" ? "Sending…" : "Send"}
                </button>
                {status === "sent" && <span className="cf-note mono">Sent. I'll write back.</span>}
                {status === "error" && <span className="cf-note bad mono">Didn't send — email me instead.</span>}
              </div>
            </form>
            <aside className="cside">
              <a className="cside-mail" href={`mailto:${DATA.email}`}>{DATA.email}</a>
              {S.phone && <a className="cside-mail" href={`tel:${S.phone}`}>{S.phone}</a>}
              <ul className="cside-list">
                {links.map(([k, label, icon]) =>
                  <li key={k}>
                    <a href={S[k]} target="_blank" rel="noopener noreferrer">
                      <img src={icon} alt="" width="18" height="18" />
                      <span>{label}</span>
                      <em className="mono" aria-hidden="true">↗</em>
                    </a>
                  </li>)}
              </ul>
            </aside>
          </div>
        </section>
        <footer className="wrap foot">
          <span className="f-name">{DATA.name}</span>
          <span className="f-year mono">© {new Date().getFullYear()}</span>
        </footer>
      </div>);
  }

  window.ContactPage = ContactPage;
})();
