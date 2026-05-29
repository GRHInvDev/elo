/* Ícones minimalistas (estilo Lucide), stroke currentColor */
const Ic = ({ d, size = 18, sw = 2, fill = "none", children, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {d ? <path d={d} /> : children}
  </svg>
);

// elo brand glyph (chain link, rotated like favicon)
const EloGlyph = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(-45deg)" }}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const I = {
  dash: (p) => <Ic {...p} children={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>} />,
  reserve: (p) => <Ic {...p} children={<><circle cx="11" cy="11" r="7"/><path d="m9 11 2 2 4-4"/></>} />,
  mega: (p) => <Ic {...p} d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />,
  file: (p) => <Ic {...p} children={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>} />,
  bulb: (p) => <Ic {...p} children={<><path d="M9 18h6M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/></>} />,
  form: (p) => <Ic {...p} children={<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h2M7 13h2M13 9h4M13 13h4"/></>} />,
  cart: (p) => <Ic {...p} children={<><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></>} />,
  phone: (p) => <Ic {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />,
  admin: (p) => <Ic {...p} children={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m7 10 2 2-2 2M13 14h4"/></>} />,
  spark: (p) => <Ic {...p} d="M12 3l1.5 5L19 9.5 13.5 11 12 16l-1.5-5L5 9.5 10.5 8 12 3z" />,
  sun: (p) => <Ic {...p} children={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>} />,
  moon: (p) => <Ic {...p} d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />,
  menu: (p) => <Ic {...p} children={<><path d="M3 6h18M3 12h18M3 18h18"/></>} />,
  chev: (p) => <Ic {...p} d="m9 6 6 6-6 6" />,
  chevDown: (p) => <Ic {...p} d="m6 9 6 6 6-6" />,
  eye: (p) => <Ic {...p} children={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>} />,
  edit: (p) => <Ic {...p} children={<><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></>} />,
  plus: (p) => <Ic {...p} children={<><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></>} />,
  search: (p) => <Ic {...p} children={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>} />,
  msg: (p) => <Ic {...p} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  tag: (p) => <Ic {...p} children={<><path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.2"/></>} />,
  filter: (p) => <Ic {...p} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />,
  clock: (p) => <Ic {...p} children={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>} />,
  user: (p) => <Ic {...p} children={<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>} />,
  users: (p) => <Ic {...p} children={<><circle cx="9" cy="8" r="3.5"/><path d="M2.5 21a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M22 21a6 6 0 0 0-4-5.65"/></>} />,
  check: (p) => <Ic {...p} d="M20 6 9 17l-5-5" />,
  checkCircle: (p) => <Ic {...p} children={<><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/></>} />,
  arrowRight: (p) => <Ic {...p} d="M5 12h14M13 5l7 7-7 7" />,
  layout: (p) => <Ic {...p} children={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>} />,
  board: (p) => <Ic {...p} children={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/></>} />,
  list: (p) => <Ic {...p} children={<><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>} />,
  send: (p) => <Ic {...p} d="m22 2-7 20-4-9-9-4 20-7z" />,
  alert: (p) => <Ic {...p} children={<><path d="M12 2 2 20h20L12 2z"/><path d="M12 9v4M12 17h.01"/></>} />,
  inbox: (p) => <Ic {...p} children={<><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>} />,
  bolt: (p) => <Ic {...p} d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  paperclip: (p) => <Ic {...p} d="M21.44 11.05 12.25 20.24a5 5 0 0 1-7.07-7.07l9.19-9.19a3 3 0 0 1 4.24 4.24l-9.2 9.19a1 1 0 0 1-1.41-1.41l8.49-8.49" />,
  more: (p) => <Ic {...p} children={<><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>} />,
  settings: (p) => <Ic {...p} children={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>} />,
  hash: (p) => <Ic {...p} children={<><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></>} />,
  calendar: (p) => <Ic {...p} children={<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>} />,
  trend: (p) => <Ic {...p} children={<><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></>} />,
};

Object.assign(window, { Ic, I, EloGlyph });
