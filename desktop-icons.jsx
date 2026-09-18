/* =========================================================================
   desktop-icons.jsx — the desktop's icon artwork + window-control marks.
   Drawn on one 48px grid with banded fills and 1px outlines so they sit in
   the same pixel idiom as the chrome. Exported on window for the other
   Babel scopes.
   ========================================================================= */
(function () {
  const S = ({ children, s = 44 }) => <svg viewBox="0 0 48 48" width={s} height={s} aria-hidden="true">{children}</svg>;

  const Folder = ({ s }) => <S s={s}>
    <path d="M5 13c0-1.7 1.3-3 3-3h11l4 4h17c1.7 0 3 1.3 3 3v22c0 1.7-1.3 3-3 3H8c-1.7 0-3-1.3-3-3z" fill="#fdc44f" stroke="#8a5c07" strokeWidth="1.5"/>
    <path d="M5 20h38v6H5z" fill="#ffe08a"/><path d="M5 32h38v5H5z" fill="#e39a17"/>
  </S>;
  const Web = ({ s }) => <S s={s}>
    <circle cx="24" cy="24" r="18" fill="#2f7fd1" stroke="#123f8a" strokeWidth="1.5"/>
    <path d="M6 19h36M6 29h36" stroke="#cfe6ff" strokeWidth="1.5"/>
    <ellipse cx="24" cy="24" rx="9" ry="18" fill="none" stroke="#cfe6ff" strokeWidth="1.5"/>
    <path d="M10 12h28v4H10z" fill="#8fd0ff" opacity=".35"/>
  </S>;
  const Radio = ({ s }) => <S s={s}>
    <path d="M9 16 30 7" stroke="#9aa4ad" strokeWidth="2"/>
    <rect x="5" y="16" width="38" height="26" fill="#2f7fd1" stroke="#0f4685" strokeWidth="1.5"/>
    <rect x="5" y="16" width="38" height="5" fill="#8fd0ff"/>
    <rect x="10" y="24" width="14" height="14" fill="#0d2c4d"/><rect x="14" y="28" width="6" height="6" fill="#8fd0ff"/>
    <rect x="28" y="24" width="11" height="4" fill="#e8f4ff"/><rect x="28" y="31" width="11" height="7" fill="#0d2c4d"/>
  </S>;
  const Photos = ({ s }) => <S s={s}>
    <rect x="6" y="14" width="28" height="26" fill="#fff" stroke="#8d8d8d" strokeWidth="1.5"/>
    <rect x="13" y="9" width="29" height="27" fill="#fff" stroke="#7d7d7d" strokeWidth="1.5"/>
    <rect x="16" y="12" width="23" height="16" fill="#3f7fb5"/>
    <path d="M16 28l7-7 5 5 4-3 7 5v0H16z" fill="#7fb069"/>
    <rect x="32" y="14" width="5" height="5" fill="#ffe08a"/>
  </S>;
  const Paint = ({ s }) => <S s={s}>
    <path d="M24 8c-9 0-17 7-17 15 0 6 5 8 9 8 3 0 4 2 4 4 0 3 2 5 5 5 9 0 17-7 17-16S33 8 24 8z" fill="#f2efe6" stroke="#6f6a5b" strokeWidth="1.5"/>
    <rect x="13" y="16" width="6" height="6" fill="#e03b3b"/><rect x="22" y="12" width="6" height="6" fill="#2f7fd1"/>
    <rect x="30" y="18" width="6" height="6" fill="#f0c31e"/><rect x="30" y="27" width="6" height="6" fill="#3aa64a"/>
  </S>;
  const Deck = ({ s }) => <S s={s}>
    <rect x="6" y="9" width="36" height="26" fill="#f4f4f4" stroke="#5b6470" strokeWidth="1.5"/>
    <rect x="10" y="13" width="18" height="4" fill="#2f6fb5"/><rect x="10" y="20" width="24" height="3" fill="#a9b0b8"/><rect x="10" y="26" width="20" height="3" fill="#a9b0b8"/>
    <path d="M20 35h8v4h7l-11 7-11-7h7z" fill="#8a9199" stroke="#5b6470" strokeWidth="1.2"/>
  </S>;
  const Book = ({ s }) => <S s={s}>
    <rect x="8" y="8" width="32" height="34" fill="#f2c24c" stroke="#8a6410" strokeWidth="1.5"/>
    <rect x="8" y="8" width="7" height="34" fill="#c9440f"/>
    <rect x="19" y="16" width="16" height="2.6" fill="#8a6410"/><rect x="19" y="22" width="16" height="2.6" fill="#8a6410"/><rect x="19" y="28" width="11" height="2.6" fill="#8a6410"/>
  </S>;
  const Letter = ({ s }) => <S s={s}>
    <rect x="6" y="12" width="36" height="24" fill="#fff" stroke="#5b6470" strokeWidth="1.5"/>
    <path d="M6 13l18 13 18-13" fill="none" stroke="#5b6470" strokeWidth="1.5"/>
    <rect x="31" y="27" width="13" height="13" fill="#3aa64a" stroke="#1d6b2c" strokeWidth="1.2"/>
    <path d="M34 33.5l3 3 5-6" stroke="#fff" strokeWidth="2" fill="none"/>
  </S>;
  /* The font icon is Jacob's own cover photograph, not a drawn glyph — it sits
     in a thin white snapshot border so it reads as a picture next to them. */
  const Font = ({ s = 44 }) => <span className="dk-photoic" style={{ width: s, height: s }}><img src="media/font-icon.png" alt="" /></span>;
  const Headphones = ({ s }) => <S s={s}>
    <path d="M10 30v-5a14 14 0 0 1 28 0v5" fill="none" stroke="#5c3560" strokeWidth="3.4"/>
    <rect x="5" y="28" width="11" height="15" rx="2" fill="#7a4a80" stroke="#3d2242" strokeWidth="1.5"/>
    <rect x="32" y="28" width="11" height="15" rx="2" fill="#7a4a80" stroke="#3d2242" strokeWidth="1.5"/>
    <rect x="7" y="31" width="7" height="9" fill="#d8bfe0"/><rect x="34" y="31" width="7" height="9" fill="#d8bfe0"/>
  </S>;
  const Bin = ({ s }) => <S s={s}>
    <ellipse cx="24" cy="15" rx="11" ry="3.4" fill="#dfe4e8" stroke="#5b6470" strokeWidth="1.4"/>
    <path d="M13 15h22l-2.5 27h-17z" fill="#c2c8ce" stroke="#5b6470" strokeWidth="1.4"/>
    <path d="M19 21l1.4 17M24 21v17M29 21l-1.4 17" stroke="#7d858e" strokeWidth="1.6"/>
  </S>;
  const Note = ({ s }) => <S s={s}>
    <path d="M12 6h17l8 8v28H12z" fill="#fff" stroke="#5b6470" strokeWidth="1.5"/>
    <path d="M29 6v8h8" fill="#dfe3e8" stroke="#5b6470" strokeWidth="1.2"/>
    <rect x="17" y="20" width="14" height="2.4" fill="#5b7fb0"/><rect x="17" y="26" width="14" height="2.4" fill="#5b7fb0"/><rect x="17" y="32" width="10" height="2.4" fill="#5b7fb0"/>
  </S>;
  const Img = ({ s }) => <S s={s}>
    <rect x="6" y="9" width="36" height="30" fill="#fff" stroke="#5b6470" strokeWidth="1.5"/>
    <rect x="12" y="14" width="6" height="6" fill="#f6c14b"/>
    <path d="M9 35l10-11 7 7 6-5 7 9z" fill="#7cc26a" stroke="#3f8a2e" strokeWidth="1.2"/>
  </S>;
  const Mail = ({ s }) => <S s={s}><rect x="5" y="12" width="38" height="25" fill="#fff" stroke="#5b6470" strokeWidth="1.5"/><path d="M5 13l19 14 19-14" fill="none" stroke="#c9440f" strokeWidth="2"/></S>;
  const Link = ({ s }) => <S s={s}><circle cx="24" cy="24" r="17" fill="#2f7fd1" stroke="#123f8a" strokeWidth="1.5"/><path d="M16 24h16M24 16v16" stroke="#fff" strokeWidth="2.4"/></S>;
  const Power = ({ s }) => <S s={s}><circle cx="24" cy="24" r="17" fill="#c9440f" stroke="#7d2708" strokeWidth="1.5"/><path d="M24 13v13" stroke="#fff" strokeWidth="3.4"/><path d="M15 21a11 11 0 1 0 18 0" fill="none" stroke="#fff" strokeWidth="3"/></S>;
  const Home = ({ s }) => <S s={s}><path d="M24 8 6 24h6v16h10V29h4v11h10V24h6z" fill="#f2c24c" stroke="#8a6410" strokeWidth="1.5"/></S>;

  const Mark = {
    min: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 11h8"/></svg>,
    close: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5"/></svg>
  };

  window.DeskIcons = { Folder, Web, Radio, Headphones, Photos, Paint, Deck, Book, Letter, Font, Bin, Note, Img, Mail, Link, Power, Home, Mark };
})();
