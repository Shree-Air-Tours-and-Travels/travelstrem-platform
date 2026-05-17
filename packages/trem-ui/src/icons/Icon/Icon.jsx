import React from "react";

const Eye = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 5C7.52 5 3.73 7.94 2.46 12 3.73 16.06 7.52 19 12 19c4.48 0 8.27-2.94 9.54-7C20.27 7.94 16.48 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EyeSlash = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="m3 3 18 18M9.88 9.88A3 3 0 0 0 14.12 14.12M6.5 6.65C4.6 7.9 3.15 9.78 2.46 12 3.73 16.06 7.52 19 12 19c1.99 0 3.84-.58 5.4-1.58M11 5.05c.33-.03.66-.05 1-.05 4.48 0 8.27 2.94 9.54 7-.28.89-.68 1.73-1.19 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Shield = ({ size = 24, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M60 10 100 25v30c0 25-18 47-40 55-22-8-40-30-40-55V25L60 10Z" fill="currentColor" />
    <path d="m48 62 10 10 20-22" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MenuOpen = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MenuClose = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="m16 8-8 8M8 8l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const User = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Settings = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.43 15a1.77 1.77 0 0 0 .36 1.95l.04.04a2.1 2.1 0 0 1-2.97 2.97l-.04-.04a1.77 1.77 0 0 0-1.95-.36 1.77 1.77 0 0 0-1.07 1.62V21a2.1 2.1 0 0 1-4.2 0v-.06a1.77 1.77 0 0 0-1.07-1.62 1.77 1.77 0 0 0-1.95.36l-.04.04a2.1 2.1 0 0 1-2.97-2.97l.04-.04A1.77 1.77 0 0 0 4 14.76a1.77 1.77 0 0 0-1.62-1.07H2.3a2.1 2.1 0 0 1 0-4.2h.06A1.77 1.77 0 0 0 4 8.42a1.77 1.77 0 0 0-.36-1.95l-.04-.04a2.1 2.1 0 0 1 2.97-2.97l.04.04A1.77 1.77 0 0 0 8.56 4a1.77 1.77 0 0 0 1.07-1.62V2.3a2.1 2.1 0 0 1 4.2 0v.06A1.77 1.77 0 0 0 14.9 4a1.77 1.77 0 0 0 1.95-.36l.04-.04a2.1 2.1 0 0 1 2.97 2.97l-.04.04a1.77 1.77 0 0 0-.36 1.95 1.77 1.77 0 0 0 1.62 1.07h.06a2.1 2.1 0 0 1 0 4.2h-.06A1.77 1.77 0 0 0 19.43 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LogOut = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Moon = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Sun = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Bell = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M18 8.8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.7 21a2.5 2.5 0 0 0 4.6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowUpRight = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowLeft = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MessageCircle = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5a8.5 8.5 0 1 1 17 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Share2 = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M18 8a3 3 0 1 0-2.8-4M6 15a3 3 0 1 0 2.8 4M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Star = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="m12 2.4 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.2l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.4Z" />
  </svg>
);

const Plane = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M16 16.5 21 21M3 11l18-8-8 18-2-8-8-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Compass = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="m16 8-2.2 5.8L8 16l2.2-5.8L16 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MapPin = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const BriefcaseBusiness = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9ZM3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2M9 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const X = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="m18 6-12 12M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CircleDot = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

const RefreshCw = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M21 12a9 9 0 0 1-15.4 6.4L3 16M3 21v-5h5M3 12A9 9 0 0 1 18.4 5.6L21 8M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AlertTriangle = ({ size = 20, title, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ICONS = {
  eye: Eye,
  eyeSlash: EyeSlash,
  shield: Shield,
  menuOpen: MenuOpen,
  menuClose: MenuClose,
  user: User,
  settings: Settings,
  logout: LogOut,
  moon: Moon,
  sun: Sun,
  bell: Bell,
  arrowUpRight: ArrowUpRight,
  arrowLeft: ArrowLeft,
  messageCircle: MessageCircle,
  share: Share2,
  star: Star,
  plane: Plane,
  compass: Compass,
  mapPin: MapPin,
  hotel: MapPin,
  map: MapPin,
  navigation: Compass,
  sparkles: Star,
  cloud: Sun,
  calendar: Sun,
  shieldCheck: Shield,
  briefcaseBusiness: BriefcaseBusiness,
  carTaxiFront: Plane,
  x: X,
  circleDot: CircleDot,
  refreshCw: RefreshCw,
  alertTriangle: AlertTriangle,
  externalLink: ArrowUpRight,
  suitcase: BriefcaseBusiness,
  people: User,
  premium: Star,
  badgeCheck: Shield,
  building2: BriefcaseBusiness,
  phoneCall: MessageCircle,
  usersRound: User,
  cloudSun: Sun,
  calendarDays: Sun,
  play: CircleDot,
};

export default function Icon({ name, size = 20, title, ...rest }) {
  const Component = ICONS[name];
  if (!Component) return null;
  return <Component size={size} title={title} {...rest} />;
}
