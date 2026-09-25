/* =========================================================================
   krinky-art.jsx — the three Krinkys. Big eyes, two buck teeth, drawn as
   flat SVG so they sit next to the desktop's other hand-drawn icons.

   Everything is posed from props rather than CSS transitions: the engine
   ticks at 12fps and passes `frame`, so blinks, bobs and spins land on
   whole frames and stay deliberately un-smooth.
   ========================================================================= */
(function () {
  const INK = "#123f8a";

  /* eyes + teeth, shared by all three so the face reads the same */
  function Face({ cx = 32, cy = 26, r = 8, gap = 9, closed, look = 0, teeth = true, tw = 6, pupil = 0.42 }) {
    const l = cx - gap, rr = cx + gap;
    if (closed) return (
      <g>
        <path d={`M${l - r + 2} ${cy}q${r - 2} 4 ${2 * r - 4} 0`} fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        <path d={`M${rr - r + 2} ${cy}q${r - 2} 4 ${2 * r - 4} 0`} fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        {teeth && <FaceMouth cx={cx} top={cy + r} w={tw} />}
      </g>);
    return (
      <g>
        <ellipse cx={l} cy={cy} rx={r} ry={r} fill="#fff" stroke={INK} strokeWidth="1.6" />
        <ellipse cx={rr} cy={cy} rx={r} ry={r} fill="#fff" stroke={INK} strokeWidth="1.6" />
        <circle cx={l + look} cy={cy + 1} r={r * pupil} fill={INK} />
        <circle cx={rr + look} cy={cy + 1} r={r * pupil} fill={INK} />
        {teeth && <FaceMouth cx={cx} top={cy + r + 1} w={tw} />}
      </g>);
  }
  /* Teeth tuck up under a curved smile: they're drawn taller than they show
     and clipped to the area below the curve, so their tops follow the smile
     instead of poking above it as two square corners. */
  const Mouth = ({ id, cx, w, gap, x0, x1, y0, sag, bottom, sw = 2 }) => {
    const d = `M${x0} ${y0}q${(x1 - x0) / 2} ${2 * sag} ${x1 - x0} 0`;
    return (
      <g>
        <defs><clipPath id={id}><path d={d + `V${bottom + 4}H${x0}z`} /></clipPath></defs>
        <g clipPath={`url(#${id})`}>
          <rect x={cx - w - gap} y={y0 - 2} width={w} height={bottom - y0 + 2} rx="1" fill="#fffdf3" stroke={INK} strokeWidth="1.4" />
          <rect x={cx + gap} y={y0 - 2} width={w} height={bottom - y0 + 2} rx="1" fill="#fffdf3" stroke={INK} strokeWidth="1.4" />
        </g>
        <path d={d} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
      </g>);
  };
  const FaceMouth = ({ cx, top, w, gap = 0.5 }) =>
    <Mouth id="krm-c" cx={cx} w={w} gap={gap} x0={cx - w - gap - 2.5} x1={cx + w + gap + 2.5} y0={top - 2} sag={3} bottom={top + w * 1.5} sw={1.8} />;

  /* The arrow is drawn fatter than a real cursor so both eyes and the teeth
     fit inside the silhouette — a true-proportion arrow is too thin and the
     face spills out the sides. */
  const Cursor = ({ closed, look }) => (
    <g>
      <path d="M10 4 10 50 22 39 30 58 40 54 32 38 48 38z" fill="#2f7fd1" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 8 12 32 20 26z" fill="#5da3e8" />
      <Face cx={21} cy={28} r={6} gap={6} closed={closed} look={look} tw={6} pupil={0.34} />
    </g>);

  const Disc = ({ closed, look }) => (
    <g transform="translate(32,32) scale(.8) translate(-32,-32)">
      <circle cx="32" cy="32" r="21.6" fill="#dfe8f2" stroke={INK} strokeWidth="2" />
      <circle cx="32" cy="32" r="21.6" fill="url(#kr-sheen)" opacity=".55" />
      <circle cx="32" cy="32" r="3.6" fill="#f4f7fb" stroke={INK} strokeWidth="1.2" />
      <circle cx="32" cy="32" r="1.4" fill="#cbd6e2" stroke={INK} strokeWidth="1" />
      <Face cx={32} cy={18} r={14.4} gap={14} closed={closed} look={look} teeth={false} pupil={0.26} />
      <Mouth id="krm-d" cx={32} w={9} gap={1.2} x0={13} x1={51} y0={38} sag={12} bottom={60.25} sw={2.6} />
    </g>);

  const Player = ({ closed, look }) => (
    <g>
      <path d="M8 46 56 46 56 22 8 22z" fill="#c7ced6" stroke={INK} strokeWidth="2" />
      <path d="M8 22 14 10 50 10 56 22z" fill="#e2e8ef" stroke={INK} strokeWidth="2" />
      <circle cx="32" cy="17" r="6" fill="#dfe8f2" stroke={INK} strokeWidth="1.4" />
      <circle cx="32" cy="17" r="1.8" fill={INK} />
      <rect x="12" y="49" width="14" height="4" rx="2" fill="#9aa8b6" stroke={INK} strokeWidth="1.2" />
      <Face cx={32} cy={31} r={8.5} gap={9.5} closed={closed} look={look} teeth={false} pupil={0.34} />
      <Mouth id="krm-p" cx={32} w={7.5} gap={0} x0={22} x1={42} y0={39} sag={3.5} bottom={52.25} sw={1.8} />
    </g>);

  const CAST = { cursor: Cursor, disc: Disc, player: Player };

  /* state → pose. No transitions: each frame is a discrete pose. */
  function KrinkyArt({ kind = "cursor", state = "idle", frame = 0, facing = 1, spin = false, size = 72 }) {
    const Body = CAST[kind] || Cursor;
    const blink = state === "sleep" || (frame % 48 === 0 || frame % 48 === 1);
    const bob = state === "walk" ? (frame % 2 ? -2 : 1) : (frame % 12 < 6 ? 0 : -1);
    const look = state === "walk" ? facing * 2 : 0;
    let t = `translate(${32},${32 + bob}) scale(${facing},1)`;
    if (state === "squash") t += " scale(1.25,.42) translate(0,34)";
    if (state === "sun") t += " rotate(78)";
    if (state === "stuck") t += ` rotate(${frame % 2 ? -9 : 9})`;
    if (state === "trip") t += ` rotate(${(frame * 30) % 360})`;
    if (spin) t += ` rotate(${(frame * 30) % 360})`;
    t += " translate(-32,-32)";
    return (
      <svg className="kr-svg" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="kr-sheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff9ec4" /><stop offset="35%" stopColor="#9ed7ff" />
            <stop offset="65%" stopColor="#c9ffd0" /><stop offset="100%" stopColor="#ffe9a0" />
          </linearGradient>
        </defs>
        <g transform={t}><Body closed={blink} look={look} /></g>
      </svg>);
  }

  window.KrinkyArt = KrinkyArt;
  window.KRINKY_KINDS = ["cursor", "disc", "player"];
})();
