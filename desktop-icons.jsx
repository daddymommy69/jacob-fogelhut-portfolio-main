/* =========================================================================
   desktop-icons.jsx — the desktop's icon artwork + window-control marks.
   Drawn on one 48px grid with banded fills and 1px outlines so they sit in
   the same pixel idiom as the chrome. Exported on window for the other
   Babel scopes.
   ========================================================================= */
(function () {
  const { useState } = React;
  const S = ({ children, s = 44, x, y }) => <svg viewBox="0 0 48 48" width={s} height={s} x={x} y={y} aria-hidden="true">{children}</svg>;

  /* aged bitmap icons: drawn at 32px and left for the browser to upscale soft,
     so they read as low-res early-2000s app art rather than fresh vectors */
  const Bmp = (src) => ({ s }) => <S s={s}><image href={src} x="0" y="0" width="48" height="48" /></S>;
  const Paint = Bmp("media/icon-paint.png"), Photoshop = Bmp("media/icon-photoshop.png");
  const Folder = Bmp("media/icon-folder.png");
  const Web = Bmp("media/icon-web.png");
  const Radio = Bmp("media/icon-radio.png");
  const Photos = Bmp("media/icon-photos.png");
  const Deck = Bmp("media/icon-deck.png");
  const Book = Bmp("media/icon-book.png");
  const Letter = Bmp("media/icon-letter.png");
  const Bin = Bmp("media/icon-bin.png");
  const Note = Bmp("media/icon-note.png");
  const Img = Bmp("media/icon-img.png");

  /* The font icon is Jacob's own cover photograph, not a drawn glyph — it sits
     in a thin white snapshot border so it reads as a picture next to them.
     Hosted on R2, so it works locally and live without living in the repo. */
  const FONT_ICON = "https://pub-0c4f005a66f14c8394bc1abf2fcf0d25.r2.dev/assets/DAD%20FONT/DAD%20FONT%20COVER.png";
  const Font = ({ s = 44 }) => (
    <span className="dk-photoic" style={{ width: s, height: s }}><img src={FONT_ICON} alt="" /></span>);
  const Headphones = Bmp("media/icon-ipod.png");
  const Mail = ({ s }) => <S s={s}><rect x="5" y="12" width="38" height="25" fill="#fff" stroke="#5b6470" strokeWidth="1.5"/><path d="M5 13l19 14 19-14" fill="none" stroke="#c9440f" strokeWidth="2"/></S>;
  const Link = ({ s }) => <S s={s}><circle cx="24" cy="24" r="17" fill="#2f7fd1" stroke="#123f8a" strokeWidth="1.5"/><path d="M16 24h16M24 16v16" stroke="#fff" strokeWidth="2.4"/></S>;
  const Power = ({ s }) => <S s={s}><circle cx="24" cy="24" r="17" fill="#c9440f" stroke="#7d2708" strokeWidth="1.5"/><path d="M24 13v13" stroke="#fff" strokeWidth="3.4"/><path d="M15 21a11 11 0 1 0 18 0" fill="none" stroke="#fff" strokeWidth="3"/></S>;
  const Home = ({ s }) => <S s={s}><path d="M24 8 6 24h6v16h10V29h4v11h10V24h6z" fill="#f2c24c" stroke="#8a6410" strokeWidth="1.5"/></S>;

  /* folder carrying a big badge of what's inside; the badge breaks past the
     folder's edge on purpose so the three folders read apart at a glance */
  const FolderOf = (Badge) => ({ s = 44 }) => <svg viewBox="0 0 48 48" width={s} height={s} overflow="visible" aria-hidden="true">
    <image href="media/icon-folder.png" x="-1" y="-2" width="48" height="48" />
    <g transform="translate(22 20) scale(.66)"><Badge s={48} /></g>
  </svg>;
  const FolderDesign = FolderOf(Photoshop), FolderDecks = FolderOf(Deck), FolderWeb = FolderOf(Web);

  const Mark = {
    min: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 11h8"/></svg>,
    close: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5"/></svg>
  };

  window.DeskIcons = { FolderDesign, FolderDecks, FolderWeb, Folder, Web, Radio, Headphones, Photos, Paint, Deck, Book, Letter, Font, Bin, Note, Img, Mail, Link, Power, Home, Mark };
})();
