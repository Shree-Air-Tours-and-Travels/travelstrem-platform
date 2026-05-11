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

const ICONS = {
  eye: Eye,
  eyeSlash: EyeSlash,
  shield: Shield,
  menuOpen: MenuOpen,
  menuClose: MenuClose,
};

export default function Icon({ name, size = 20, title, ...rest }) {
  const Component = ICONS[name];
  if (!Component) return null;
  return <Component size={size} title={title} {...rest} />;
}
