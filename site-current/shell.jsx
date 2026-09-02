/* =========================================================================
   shell.jsx — single-page-app router. Renders ONE React root that swaps
   between the main site (window.MainApp) and the Playground
   (window.PlaygroundApp) on hash change — no page reload — so the radio
   (mounted in window.PlayerProvider, above the views) never stops playing.

   Routes:  #playground → Playground   ·   anything else → main site
   Old links keep working: Playground.html redirects here to #playground;
   project deep-links (?p=<id>) live on the main route.
   ========================================================================= */
(function () {
  const { useState, useEffect } = React;

  function Shell() {
    const [route, setRoute] = useState(() => (location.hash.replace("#", "") || "home"));
    useEffect(() => {
      const f = () => setRoute(location.hash.replace("#", "") || "home");
      window.addEventListener("hashchange", f);
      return () => window.removeEventListener("hashchange", f);
    }, []);
    useEffect(() => {
      document.body.classList.toggle("pg-body", route === "playground");
      // jump to top when returning to the main site
      if (route !== "playground") window.scrollTo(0, 0);
    }, [route]);

    const Main = window.MainApp, Play = window.PlaygroundApp;
    const view = route === "playground"
      ? React.createElement(Play)
      : React.createElement(Main);

    return React.createElement(
      window.PlayerProvider, null,
      view,
      React.createElement(window.PlayerBar)
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Shell));
})();
