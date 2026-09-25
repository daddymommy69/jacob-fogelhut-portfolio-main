/* =========================================================================
   shell.jsx — single-page-app router. Renders ONE React root that swaps
   between the main site (window.MainApp) and the Playground
   (window.PlaygroundApp) on hash change — no page reload — so the radio
   (mounted in window.PlayerProvider, above the views) never stops playing.

   Routes:  #playground → Playground   ·   #contact → Contact   ·
            anything else → main site
   Old links keep working: Playground.html redirects here to #playground;
   project deep-links (?p=<id>) live on the main route.
   ========================================================================= */
(function () {
  const { useState, useEffect } = React;

  function Shell() {
    const [route, setRoute] = useState(() => (location.hash.replace("#", "") || "home"));
    const prevRoute = React.useRef(route);
    useEffect(() => {
      const f = () => {
        const next = location.hash.replace("#", "") || "home";
        /* Back to portfolio from the desktop replays the intro photo sequence.
           Set here (before the main view renders), not in an effect. */
        if (prevRoute.current === "playground" && next !== "playground" && next !== "contact") window.__introShown = false;
        setRoute(next);
      };
      window.addEventListener("hashchange", f);
      return () => window.removeEventListener("hashchange", f);
    }, []);
    useEffect(() => {
      document.body.classList.toggle("pg-body", route === "playground");
      /* Leaving the main view counts as having seen the intro, so coming back
         from Contact never replays it. Coming back from the desktop ("Back to
         portfolio") DOES replay it — the photo sequence is the way back in. */
      prevRoute.current = route;
      if (route !== "home" && route !== "") window.__introShown = true;
      if (route === "playground") return;
      /* #work lands on the work list (the contact page links to it); every
         other main-site route starts at the top. The section only exists
         after the main view mounts, so this waits a frame. */
      if (route === "work") {
        const go = () => {
          const el = document.getElementById("work");
          if (el) window.scrollTo(0, Math.max(0, el.offsetTop - 70));
        };
        requestAnimationFrame(() => setTimeout(go, 60));
        return;
      }
      /* The swap can land before the new view is laid out, and the browser
         then restores the old offset — so re-assert next frame. */
      window.scrollTo(0, 0);
      requestAnimationFrame(() => window.scrollTo(0, 0));
    }, [route]);

    const Main = window.MainApp, Play = window.PlaygroundApp, Contact = window.ContactPage;
    const view = route === "playground"
      ? React.createElement(Play)
      : route === "contact" && Contact
        ? React.createElement(Contact)
        : React.createElement(Main);

    return React.createElement(
      window.PlayerProvider, null,
      view,
      React.createElement(window.PlayerBar)
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Shell));
})();
