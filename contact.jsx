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
  const { useState, useMemo } = React;
  const DATA = window.PORTFOLIO_DATA || {};

  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  window.linkify = function (text) {
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
  };

  const PROFILES = [
    ["instagram", "Instagram", "logos/instagram.svg"],
    ["linkedin", "LinkedIn", "logos/linkedin.svg"],
    ["spotify", "Spotify", "logos/spotify.svg"],
    ["appleMusic", "Apple Music", "logos/apple-music.svg"]
  ];

  function ContactPage() {
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
        <header className="cpage-head wrap">
          <a className="cpage-back mono" href="#home">← {DATA.name}</a>
          <span className="mono cpage-kicker">Contact</span>
        </header>
        <section className="wrap cpage-body">
          <h1 className="cpage-title" style={{ fontFamily: "JacobMarker" }}>Let's work</h1>
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
                <span className="mono">What it's for</span>
                <input value={f.subject} onChange={set("subject")} placeholder="campaign, event, video, anything" />
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
                      <em className="mono">↗</em>
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
