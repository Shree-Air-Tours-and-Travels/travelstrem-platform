import React from "react";

const Svg = ({ size = 24, viewBox = "0 0 24 24", title, children, ...rest }) => (
  <svg width={size} height={size} viewBox={viewBox} fill="none" aria-hidden={!title} {...rest}>
    {title ? <title>{title}</title> : null}
    {children}
  </svg>
);

const s = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const AlertTriangle = (p) => (
  <Svg {...p}>
    <path
      d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
      {...s}
    />
    <path d="M12 9v4" {...s} />
    <path d="M12 17h.01" {...s} />
  </Svg>
);

const ArrowLeft = (p) => (
  <Svg {...p}>
    <path d="M19 12H5" {...s} />
    <path d="m12 19-7-7 7-7" {...s} />
  </Svg>
);

const ArrowUpRight = (p) => (
  <Svg {...p}>
    <path d="M7 17 17 7" {...s} />
    <path d="M9 7h8v8" {...s} />
  </Svg>
);

const BadgeCheck = (p) => (
  <Svg {...p}>
    <path d="M9 12l2 2 4-4" {...s} />
    <path
      d="M12 2l2.4 2.4 3.4-.7.7 3.4L21 12l-2.5 2.9.7 3.4-3.4.7L12 22l-2.9-2.5-3.4.7-.7-3.4L3 12l2.5-2.9-.7-3.4 3.4-.7L12 2Z"
      {...s}
    />
  </Svg>
);

const Beach = (p) => (
  <Svg {...p}>
    <path d="M2 22h20" {...s} />
    <path d="M6 22c0-4.4 2.7-8.2 6.5-9.8" {...s} />
    <path d="M12 22V2" {...s} />
    <path d="M12 2a8 8 0 0 1 0 6" {...s} />
    <path d="M16 6c0 2.2-1.8 6-4 6" {...s} />
    <path d="M8 10c1.5 0 4-1.5 4-4" {...s} />
  </Svg>
);

const Bell = (p) => (
  <Svg {...p}>
    <path d="M18 8.8A6 6 0 0 0 6 8.8C6 15.8 3 17.8 3 19h18c0-1.2-3-3.2-3-10.2Z" {...s} />
    <path d="M9.7 21a2.5 2.5 0 0 0 4.6 0" {...s} />
  </Svg>
);

const Bookmark = (p) => (
  <Svg {...p}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" {...s} />
  </Svg>
);

const BriefcaseBusiness = (p) => (
  <Svg {...p}>
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...s} />
    <path d="M2 9h20v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9Z" {...s} />
    <path d="M9 13h6" {...s} />
  </Svg>
);

const Home = (p) => (
  <Svg {...p}>
    <path d="m3 11 9-8 9 8" {...s} />
    <path d="M5 10v11h14V10" {...s} />
    <path d="M9 21v-7h6v7" {...s} />
  </Svg>
);

const Building2 = (p) => (
  <Svg {...p}>
    <path d="M2 22h20" {...s} />
    <path d="M4 22V8l4-2v16" {...s} />
    <path d="M8 22V6l4-2v18" {...s} />
    <path d="M12 22V4l4 2v16" {...s} />
    <path d="M16 22v-7l4 2v5" {...s} />
    <path d="M6 12h2M10 12h2M14 12h2" {...s} />
  </Svg>
);

const Bus = (p) => (
  <Svg {...p}>
    <path d="M4 17V7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10" {...s} />
    <path d="M4 17a2 2 0 1 0 4 0" {...s} />
    <path d="M16 17a2 2 0 1 0 4 0" {...s} />
    <path d="M4 13h16" {...s} />
    <path d="M8 7h8" {...s} />
    <path d="M10 10h4" {...s} />
  </Svg>
);

const Calendar = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" {...s} />
    <path d="M16 2v4" {...s} />
    <path d="M8 2v4" {...s} />
    <path d="M3 10h18" {...s} />
  </Svg>
);

const CalendarDays = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" {...s} />
    <path d="M16 2v4" {...s} />
    <path d="M8 2v4" {...s} />
    <path d="M3 10h18" {...s} />
    <circle cx="8" cy="14" r=".75" fill="currentColor" />
    <circle cx="12" cy="14" r=".75" fill="currentColor" />
    <circle cx="16" cy="14" r=".75" fill="currentColor" />
    <circle cx="8" cy="18" r=".75" fill="currentColor" />
    <circle cx="12" cy="18" r=".75" fill="currentColor" />
    <circle cx="16" cy="18" r=".75" fill="currentColor" />
  </Svg>
);

const Camera = (p) => (
  <Svg {...p}>
    <path
      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"
      {...s}
    />
    <circle cx="12" cy="13" r="4" {...s} />
  </Svg>
);

const CarTaxiFront = (p) => (
  <Svg {...p}>
    <path d="M4 17H2v-5l2-3h16l2 3v5h-2" {...s} />
    <path d="M6 17a2 2 0 1 0 4 0" {...s} />
    <path d="M14 17a2 2 0 1 0 4 0" {...s} />
    <path d="M6 9V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" {...s} />
    <path d="M9 9h6" {...s} />
  </Svg>
);

const Check = (p) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" {...s} />
  </Svg>
);

const ChevronDown = (p) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" {...s} />
  </Svg>
);

const ChevronLeft = (p) => (
  <Svg {...p}>
    <path d="m15 18-6-6 6-6" {...s} />
  </Svg>
);

const ChevronRight = (p) => (
  <Svg {...p}>
    <path d="m9 18 6-6-6-6" {...s} />
  </Svg>
);

const CircleDot = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" {...s} />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </Svg>
);

const City = (p) => (
  <Svg {...p}>
    <path d="M2 22h20" {...s} />
    <path d="M4 22V2h6v20" {...s} />
    <path d="M10 22V8h4v14" {...s} />
    <path d="M14 22V4h6v18" {...s} />
    <path d="M6 6h2M6 10h2M6 14h2M12 12h2M16 8h2M16 12h2" {...s} />
  </Svg>
);

const Clock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" {...s} />
    <polyline points="12 6 12 12 16 14" {...s} />
  </Svg>
);

const Download = (p) => (
  <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" {...s} />
    <polyline points="7 10 12 15 17 10" {...s} />
    <line x1="12" y1="15" x2="12" y2="3" {...s} />
  </Svg>
);

const Cloud = (p) => (
  <Svg {...p}>
    <path d="M18 10.7A6 6 0 0 0 7.3 13.3 4 4 0 0 0 8 21h9a5 5 0 0 0 1-9.3Z" {...s} />
  </Svg>
);

const CloudSun = (p) => (
  <Svg {...p}>
    <path d="M12 2v2" {...s} />
    <path d="m4.93 4.93 1.41 1.41" {...s} />
    <path d="M20 12h2" {...s} />
    <path d="M19.07 4.93l-1.41 1.41" {...s} />
    <path d="M15.95 10.7A5 5 0 0 0 7.3 13.3 4 4 0 0 0 8 20h8a4 4 0 0 0-.05-7.3Z" {...s} />
  </Svg>
);

const Compass = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" {...s} />
    <path d="m16 8-2.2 5.8L8 16l2.2-5.8L16 8Z" {...s} />
  </Svg>
);

const Destination = (p) => (
  <Svg {...p}>
    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" {...s} />
    <circle cx="12" cy="10" r="3" {...s} />
    <path d="M12 2v3" {...s} />
    <path d="M12 15v5" {...s} />
  </Svg>
);

const Experiences = (p) => (
  <Svg {...p}>
    <path d="M8 14 3 8l4-3 5 5-4 4Z" {...s} />
    <path d="m6 12-3 3 3 3" {...s} />
    <path d="M8 18h8" {...s} />
    <path d="M21 8l-5 5-3-3 5-5 3 3Z" {...s} />
  </Svg>
);

const Eye = (p) => (
  <Svg {...p}>
    <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" {...s} />
    <path
      d="M12 5c-4.48 0-8.27 2.94-9.54 7 1.27 4.06 5.06 7 9.54 7s8.27-2.94 9.54-7c-1.27-4.06-5.06-7-9.54-7Z"
      {...s}
    />
  </Svg>
);

const EyeSlash = (p) => (
  <Svg {...p}>
    <path d="m3 3 18 18" {...s} />
    <path d="M10.6 10.6a3 3 0 0 0 4.8 4.8" {...s} />
    <path d="M6.5 6.65C4.6 7.9 3.15 9.78 2.46 12c.73 2.06 2.35 3.8 4.54 5" {...s} />
    <path d="M17.54 7.05c1.6 1.05 2.9 2.55 3.54 4.95" {...s} />
    <path d="M11 5.05c.33-.03.66-.05 1-.05 4.48 0 8.27 2.94 9.54 7" {...s} />
  </Svg>
);

const Filter = (p) => (
  <Svg {...p}>
    <path d="M22 3H2l8 9.5V20l4 2v-9.5L22 3Z" {...s} />
  </Svg>
);

const Flight = (p) => (
  <Svg {...p}>
    <path d="M2 16h20" {...s} />
    <path d="M12 2v14" {...s} />
    <path d="m4 10 8-8 8 8" {...s} />
    <path d="M8 22 12 16l4 6H8Z" {...s} />
  </Svg>
);

const Food = (p) => (
  <Svg {...p}>
    <path d="M9 2v6a3 3 0 0 1-6 0V2" {...s} />
    <path d="M15 2v6a3 3 0 0 0 6 0V2" {...s} />
    <path d="M3 16h18" {...s} />
    <path d="M3 22v-6a6 6 0 0 1 12 0v6" {...s} />
    <path d="M15 22H3" {...s} />
  </Svg>
);

const Globe = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" {...s} />
    <path d="M2 12h20" {...s} />
    <path
      d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"
      {...s}
    />
  </Svg>
);

const Guide = (p) => (
  <Svg {...p}>
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" {...s} />
    <path d="M5 22v-2a7 7 0 0 1 14 0v2" {...s} />
    <path d="M18 10l3-3-3-3" {...s} />
    <path d="M21 7H15" {...s} />
  </Svg>
);

const Heart = (p) => (
  <Svg {...p}>
    <path
      d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z"
      {...s}
    />
  </Svg>
);

const Hotel = (p) => (
  <Svg {...p}>
    <path d="M2 22h20" {...s} />
    <path d="M4 22V8l4-2v16" {...s} />
    <path d="M8 22V6l4-2v18" {...s} />
    <path d="M12 22V4l4 2v16" {...s} />
    <path d="M16 22v-5" {...s} />
    <path d="M6 12h2M10 12h2M14 12h2" {...s} />
    <path d="M18 22V2" {...s} />
  </Svg>
);

const Info = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" {...s} />
    <path d="M12 16v-4" {...s} />
    <path d="M12 8h0" {...s} />
  </Svg>
);

const Insurance = (p) => (
  <Svg {...p}>
    <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10Z" {...s} />
    <path d="m9 12 2 2 4-4" {...s} />
  </Svg>
);

const Itinerary = (p) => (
  <Svg {...p}>
    <path d="M8 6h10" {...s} />
    <path d="M8 12h10" {...s} />
    <path d="M8 18h10" {...s} />
    <circle cx="3" cy="6" r=".75" fill="currentColor" />
    <circle cx="3" cy="12" r=".75" fill="currentColor" />
    <circle cx="3" cy="18" r=".75" fill="currentColor" />
  </Svg>
);

const Location = (p) => (
  <Svg {...p}>
    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" {...s} />
    <circle cx="12" cy="10" r="3" {...s} />
    <path d="M12 22v3" {...s} />
  </Svg>
);

const Lock = (p) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" {...s} />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" {...s} />
    <circle cx="12" cy="16" r="1" fill="currentColor" />
  </Svg>
);

const LogOut = (p) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...s} />
    <path d="M16 17l5-5-5-5" {...s} />
    <path d="M21 12H9" {...s} />
  </Svg>
);

const LogIn = (p) => (
  <Svg {...p}>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" {...s} />
    <path d="m10 17 5-5-5-5" {...s} />
    <path d="M15 12H3" {...s} />
  </Svg>
);

const Luggage = (p) => (
  <Svg {...p}>
    <rect x="6" y="6" width="12" height="14" rx="2" {...s} />
    <path d="M10 6V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" {...s} />
    <path d="M6 11h12" {...s} />
    <path d="M6 16h12" {...s} />
  </Svg>
);

const TravelPackage = (p) => (
  <Svg {...p}>
    <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" {...s} />
    <rect x="3" y="7" width="18" height="14" rx="3" {...s} />
    <path d="M8 7v14M16 7v14" {...s} />
    <path d="M14.8 13.2c0 1.9-2.8 4.3-2.8 4.3s-2.8-2.4-2.8-4.3a2.8 2.8 0 1 1 5.6 0Z" {...s} />
    <circle cx="12" cy="13.1" r=".75" fill="currentColor" />
  </Svg>
);

const Management = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="4" height="4" rx="1" {...s} />
    <rect x="17" y="3" width="4" height="4" rx="1" {...s} />
    <rect x="10" y="10" width="4" height="4" rx="1" {...s} />
    <rect x="3" y="17" width="4" height="4" rx="1" {...s} />
    <rect x="17" y="17" width="4" height="4" rx="1" {...s} />
    <path d="M12 3v7" {...s} />
    <path d="M5 10v7" {...s} />
    <path d="M19 10v7" {...s} />
  </Svg>
);

const Map = (p) => (
  <Svg {...p}>
    <path d="M3 7v13l6-3 6 3 6-3V4l-6 3-6-3-6 3Z" {...s} />
    <path d="M9 4v13" {...s} />
    <path d="M15 7v13" {...s} />
  </Svg>
);

const MapPin = (p) => (
  <Svg {...p}>
    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" {...s} />
    <circle cx="12" cy="10" r="3" {...s} />
  </Svg>
);

const MoreVertical = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
  </Svg>
);

const MenuClose = (p) => (
  <Svg {...p}>
    <path d="M18 6 6 18" {...s} />
    <path d="m6 6 12 12" {...s} />
  </Svg>
);

const MenuOpen = (p) => (
  <Svg {...p}>
    <path d="M4 6h16" {...s} />
    <path d="M4 12h16" {...s} />
    <path d="M4 18h16" {...s} />
  </Svg>
);

const MessageCircle = (p) => (
  <Svg {...p}>
    <path
      d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 1 1 17 0Z"
      {...s}
    />
  </Svg>
);

const Moon = (p) => (
  <Svg {...p}>
    <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z" {...s} />
  </Svg>
);

const Minus = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" {...s} />
  </Svg>
);

const Mountain = (p) => (
  <Svg {...p}>
    <path d="m2 22 7-12 5 7 4-6 4 11H2Z" {...s} />
    <circle cx="15" cy="8" r="2" {...s} />
  </Svg>
);

const Navigation = (p) => (
  <Svg {...p}>
    <path d="M12 2 8 22l4-6 4 6L12 2Z" {...s} />
  </Svg>
);

const Passport = (p) => (
  <Svg {...p}>
    <rect x="4" y="2" width="16" height="20" rx="2" {...s} />
    <path d="M9 8h6" {...s} />
    <path d="M9 12h4" {...s} />
    <circle cx="12" cy="16" r="2" {...s} />
  </Svg>
);

const Payment = (p) => (
  <Svg {...p}>
    <rect x="1" y="5" width="22" height="14" rx="2" {...s} />
    <path d="M1 10h22" {...s} />
    <path d="M6 16h4" {...s} />
  </Svg>
);

const People = (p) => (
  <Svg {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" {...s} />
    <circle cx="9" cy="7" r="4" {...s} />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" {...s} />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" {...s} />
  </Svg>
);

const PhoneCall = (p) => (
  <Svg {...p}>
    <path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.8 12.8 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.8 12.8 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"
      {...s}
    />
    <path d="M14 2a6 6 0 0 1 6 6" {...s} />
    <path d="M14 6a2 2 0 0 1 2 2" {...s} />
  </Svg>
);

const Plane = (p) => (
  <Svg {...p}>
    <path d="M22 2 11 13" {...s} />
    <path d="M22 2 15 22l-4-9-9-4 20-7Z" {...s} />
  </Svg>
);

const Play = (p) => (
  <Svg {...p}>
    <path d="m5 3 16 9-16 9V3Z" {...s} />
  </Svg>
);

const Plus = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" {...s} />
    <path d="M12 5v14" {...s} />
  </Svg>
);

const Premium = (p) => (
  <Svg {...p}>
    <path d="M12 2 9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2Z" {...s} />
  </Svg>
);

const RefreshCw = (p) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 0 1-15.4 6.4L3 16" {...s} />
    <path d="M3 21v-5h5" {...s} />
    <path d="M3 12a9 9 0 0 1 15.4-6.4L21 8" {...s} />
    <path d="M21 3v5h-5" {...s} />
  </Svg>
);

const Reservations = (p) => (
  <Svg {...p}>
    <path d="M16 4h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" {...s} />
    <path d="M9 2h6v4H9V2Z" {...s} />
    <path d="m9 13 2 2 4-4" {...s} />
  </Svg>
);

const Route = (p) => (
  <Svg {...p}>
    <circle cx="6" cy="19" r="3" {...s} />
    <circle cx="18" cy="5" r="3" {...s} />
    <path d="M6 16c0-5 4-9 8-9" {...s} />
    <path d="M14 7l3-2-3-2" {...s} />
  </Svg>
);

const Search = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="8" {...s} />
    <path d="m21 21-4.3-4.3" {...s} />
  </Svg>
);

const Settings = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" {...s} />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08Z"
      {...s}
    />
  </Svg>
);

const Share = (p) => (
  <Svg {...p}>
    <circle cx="18" cy="5" r="3" {...s} />
    <circle cx="6" cy="12" r="3" {...s} />
    <circle cx="18" cy="19" r="3" {...s} />
    <path d="M8.59 13.51l6.83 3.98" {...s} />
    <path d="M15.41 6.51l-6.82 3.98" {...s} />
  </Svg>
);

const Shield = (p) => (
  <Svg {...p}>
    <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10Z" {...s} />
  </Svg>
);

const ShieldCheck = (p) => (
  <Svg {...p}>
    <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10Z" {...s} />
    <path d="m9 12 2 2 4-4" {...s} />
  </Svg>
);

const Sparkles = (p) => (
  <Svg {...p}>
    <path d="M12 3v4" {...s} />
    <path d="M12 17v4" {...s} />
    <path d="M3 12h4" {...s} />
    <path d="M17 12h4" {...s} />
    <path d="M5.6 5.6l2.8 2.8" {...s} />
    <path d="M15.6 15.6l2.8 2.8" {...s} />
    <path d="M18.4 5.6l-2.8 2.8" {...s} />
    <path d="M8.4 15.6l-2.8 2.8" {...s} />
  </Svg>
);

const Star = (p) => (
  <Svg {...p}>
    <path
      d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"
      fill="currentColor"
      {...s}
    />
  </Svg>
);

const Suitcase = (p) => (
  <Svg {...p}>
    <rect x="4" y="8" width="16" height="12" rx="2" {...s} />
    <path d="M10 8V6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" {...s} />
    <path d="M4 12h16" {...s} />
    <path d="M9 16h6" {...s} />
  </Svg>
);

const Sun = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="5" {...s} />
    <path d="M12 1v2" {...s} />
    <path d="M12 21v2" {...s} />
    <path d="M4.22 4.22l1.42 1.42" {...s} />
    <path d="M18.36 18.36l1.42 1.42" {...s} />
    <path d="M1 12h2" {...s} />
    <path d="M21 12h2" {...s} />
    <path d="M4.22 19.78l1.42-1.42" {...s} />
    <path d="M18.36 5.64l1.42-1.42" {...s} />
  </Svg>
);

const Support = (p) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 1 1-9-9" {...s} />
    <path d="M21 3v6h-6" {...s} />
    <path d="M12 7v4l2 2" {...s} />
  </Svg>
);

const Taxi = (p) => (
  <Svg {...p}>
    <path d="M2 16h2l1-3h14l1 3h2" {...s} />
    <path d="M6 16a2 2 0 1 0 4 0" {...s} />
    <path d="M14 16a2 2 0 1 0 4 0" {...s} />
    <path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" {...s} />
    <path d="M8 10h8" {...s} />
  </Svg>
);

const Ticket = (p) => (
  <Svg {...p}>
    <path
      d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
      {...s}
    />
    <path d="M13 9v6" {...s} />
  </Svg>
);

const Tours = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="5" {...s} />
    <path d="M3 22v-2a7 7 0 0 1 14 0v2" {...s} />
    <path d="M19 8l2-2-2-2" {...s} />
    <path d="M21 6h-6" {...s} />
  </Svg>
);

const Train = (p) => (
  <Svg {...p}>
    <rect x="3" y="6" width="18" height="12" rx="2" {...s} />
    <path d="M3 12h18" {...s} />
    <path d="M9 18v3" {...s} />
    <path d="M15 18v3" {...s} />
    <path d="M8 9h2M14 9h2" {...s} />
  </Svg>
);

const User = (p) => (
  <Svg {...p}>
    <path d="M20 21a8 8 0 0 0-16 0" {...s} />
    <circle cx="12" cy="7" r="5" {...s} />
  </Svg>
);

const UsersRound = (p) => (
  <Svg {...p}>
    <path d="M18 21a8 8 0 0 0-12 0" {...s} />
    <circle cx="9" cy="7" r="4" {...s} />
    <circle cx="15" cy="7" r="4" {...s} />
  </Svg>
);

const Visa = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" {...s} />
    <path d="M7 12h10" {...s} />
    <path d="M9 9v6" {...s} />
    <path d="M15 9v6" {...s} />
  </Svg>
);

const Wallet = (p) => (
  <Svg {...p}>
    <path d="M21 12v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1" {...s} />
    <path d="M17 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" {...s} />
  </Svg>
);

const Edit = (p) => (
  <Svg {...p}>
    <path d="M12 20h9" {...s} />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" {...s} />
    <path d="m15 5 4 4" {...s} />
  </Svg>
);

const X = (p) => (
  <Svg {...p}>
    <path d="M18 6 6 18" {...s} />
    <path d="M6 6l12 12" {...s} />
  </Svg>
);

const Fallback = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" {...s} />
    <path d="M12 8v4" {...s} />
    <path d="M12 16h.01" {...s} />
  </Svg>
);

const ICONS = {
  alertTriangle: AlertTriangle,
  arrowLeft: ArrowLeft,
  arrowUpRight: ArrowUpRight,
  badgeCheck: BadgeCheck,
  beach: Beach,
  bell: Bell,
  bookmark: Bookmark,
  briefcaseBusiness: BriefcaseBusiness,
  building2: Building2,
  bus: Bus,
  calendar: Calendar,
  calendarDays: CalendarDays,
  camera: Camera,
  carTaxiFront: CarTaxiFront,
  check: Check,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  circleDot: CircleDot,
  city: City,
  clock: Clock,
  cloud: Cloud,
  cloudSun: CloudSun,
  compass: Compass,
  destination: Destination,
  download: Download,
  edit: Edit,
  experiences: Experiences,
  externalLink: ArrowUpRight,
  eye: Eye,
  eyeSlash: EyeSlash,
  filter: Filter,
  flight: Flight,
  food: Food,
  globe: Globe,
  guide: Guide,
  heart: Heart,
  hotel: Hotel,
  home: Home,
  info: Info,
  insurance: Insurance,
  itinerary: Itinerary,
  location: Location,
  lock: Lock,
  login: LogIn,
  logout: LogOut,
  luggage: Luggage,
  management: Management,
  map: Map,
  mapPin: MapPin,
  menuClose: MenuClose,
  moreVertical: MoreVertical,
  menuOpen: MenuOpen,
  messageCircle: MessageCircle,
  moon: Moon,
  minus: Minus,
  mountain: Mountain,
  navigation: Navigation,
  passport: Passport,
  payment: Payment,
  people: People,
  phoneCall: PhoneCall,
  plane: Plane,
  play: Play,
  plus: Plus,
  premium: Premium,
  refreshCw: RefreshCw,
  reservations: Reservations,
  route: Route,
  search: Search,
  settings: Settings,
  share: Share,
  shield: Shield,
  shieldCheck: ShieldCheck,
  sparkles: Sparkles,
  star: Star,
  suitcase: Suitcase,
  sun: Sun,
  support: Support,
  taxi: Taxi,
  ticket: Ticket,
  tours: Tours,
  train: Train,
  travelPackage: TravelPackage,
  user: User,
  usersRound: UsersRound,
  visa: Visa,
  wallet: Wallet,
  x: X,
};

export default function Icon({ name, size = 24, title, ...rest }) {
  const Component = ICONS[name] || Fallback;
  if (!Component) return null;
  return <Component size={size} title={title} {...rest} />;
}
