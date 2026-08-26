import React from "react";

const Svg = ({ size = 24, viewBox = "0 0 24 24", title, children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden={title ? undefined : true}
    role={title ? "img" : undefined}
    focusable="false"
    {...rest}
  >
    {title ? <title>{title}</title> : null}
    {children}
  </svg>
);

const s = {
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  vectorEffect: "non-scaling-stroke",
};

const tone = {
  fill: "currentColor",
  opacity: 0.1,
  stroke: "none",
};

const solid = {
  fill: "currentColor",
  stroke: "none",
};

/* -------------------------------------------------------------------------- */
/*                                   GENERAL                                  */
/* -------------------------------------------------------------------------- */

const AlertTriangle = (p) => (
  <Svg {...p}>
    <path d="M12 2.8 22 20.2H2L12 2.8Z" {...tone} />
    <path
      d="M10.3 3.9 1.9 18.1A2 2 0 0 0 3.6 21h16.8a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z"
      {...s}
    />
    <path d="M12 8.3v5.4" {...s} />
    <circle cx="12" cy="17.4" r="1" {...solid} />
  </Svg>
);

const ArrowLeft = (p) => (
  <Svg {...p}>
    <path d="M20 12H5" {...s} />
    <path d="m11 5-7 7 7 7" {...s} />
    <path d="M5 12h4" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" opacity=".12" />
  </Svg>
);

const ArrowUpRight = (p) => (
  <Svg {...p}>
    <path d="M7 17 17.5 6.5" {...s} />
    <path d="M9.5 6.5h8v8" {...s} />
    <circle cx="17.5" cy="6.5" r="2.4" {...tone} />
  </Svg>
);

const BadgeCheck = (p) => (
  <Svg {...p}>
    <path
      d="m12 2.5 2.5 2 3.2-.2.8 3.1 2.6 1.9-1.2 3 1.2 3-2.6 1.9-.8 3.1-3.2-.2-2.5 2-2.5-2-3.2.2-.8-3.1-2.6-1.9 1.2-3-1.2-3 2.6-1.9.8-3.1 3.2.2 2.5-2Z"
      {...tone}
    />
    <path
      d="m12 2.5 2.5 2 3.2-.2.8 3.1 2.6 1.9-1.2 3 1.2 3-2.6 1.9-.8 3.1-3.2-.2-2.5 2-2.5-2-3.2.2-.8-3.1-2.6-1.9 1.2-3-1.2-3 2.6-1.9.8-3.1 3.2.2 2.5-2Z"
      {...s}
    />
    <path d="m8.7 12.3 2.2 2.2 4.7-5" {...s} />
  </Svg>
);

const Bell = (p) => (
  <Svg {...p}>
    <path d="M5 10a7 7 0 0 1 14 0v3.5c0 1.6.6 3.1 1.7 4.3H3.3A6.4 6.4 0 0 0 5 13.5V10Z" {...tone} />
    <path d="M5 10a7 7 0 0 1 14 0v3.5c0 1.6.6 3.1 1.7 4.3H3.3A6.4 6.4 0 0 0 5 13.5V10Z" {...s} />
    <path d="M9.2 20.2a3.1 3.1 0 0 0 5.6 0" {...s} />
    <path d="M12 3V1.8" {...s} />
  </Svg>
);

const Bookmark = (p) => (
  <Svg {...p}>
    <path d="M6 3.5h12v17L12 17l-6 3.5v-17Z" {...tone} />
    <path d="M6 3.5h12a1.5 1.5 0 0 1 1.5 1.5v16.3L12 17l-7.5 4.3V5A1.5 1.5 0 0 1 6 3.5Z" {...s} />
  </Svg>
);

const BriefcaseBusiness = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="7" width="19" height="14" rx="3" {...tone} />
    <rect x="2.5" y="7" width="19" height="14" rx="3" {...s} />
    <path d="M8.5 7V5.2A2.2 2.2 0 0 1 10.7 3h2.6a2.2 2.2 0 0 1 2.2 2.2V7" {...s} />
    <path d="M2.8 11.5c2.8 1.8 5.9 2.7 9.2 2.7s6.4-.9 9.2-2.7" {...s} />
    <rect
      x="10"
      y="12.4"
      width="4"
      height="3"
      rx="1"
      fill="currentColor"
      opacity=".2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </Svg>
);

const Home = (p) => (
  <Svg {...p}>
    <path d="m3 10.7 9-7.5 9 7.5v10H3v-10Z" {...tone} />
    <path d="m2.8 11 9.2-7.8 9.2 7.8" {...s} />
    <path d="M5 9.6V21h14V9.6" {...s} />
    <path d="M9.2 21v-6.8h5.6V21" {...s} />
    <path d="M16.8 6V3.8" {...s} />
  </Svg>
);

const Building2 = (p) => (
  <Svg {...p}>
    <path d="M4 21V6.5L12 3v18" {...tone} />
    <path d="M4 21V6.5L12 3v18M12 7l8 3.2V21M2 21h20" {...s} />
    <path d="M7 9h2M7 13h2M7 17h2M15 12h2M15 16h2" {...s} />
    <path d="M15 21v-2h2v2" {...s} />
  </Svg>
);

const Bus = (p) => (
  <Svg {...p}>
    <rect x="4" y="3" width="16" height="16" rx="4" {...tone} />
    <rect x="4" y="3" width="16" height="16" rx="4" {...s} />
    <path d="M7 7h10M4 12.5h16M8 16h.01M16 16h.01" {...s} />
    <path d="M7 19v2M17 19v2" {...s} />
    <path d="M8 3V2h8v1" {...s} />
  </Svg>
);

const Calendar = (p) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="17" rx="3" {...tone} />
    <rect x="3" y="4.5" width="18" height="17" rx="3" {...s} />
    <path d="M7.5 2.5v4M16.5 2.5v4M3 9.5h18" {...s} />
    <path d="M8 13h3M13 13h3M8 17h3" {...s} />
  </Svg>
);

const CalendarDays = (p) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="17" rx="3" {...tone} />
    <rect x="3" y="4.5" width="18" height="17" rx="3" {...s} />
    <path d="M7.5 2.5v4M16.5 2.5v4M3 9.5h18" {...s} />

    {[8, 12, 16].map((x) => (
      <circle key={`a-${x}`} cx={x} cy="13.5" r=".85" {...solid} />
    ))}

    {[8, 12, 16].map((x) => (
      <circle key={`b-${x}`} cx={x} cy="17.5" r=".85" {...solid} />
    ))}
  </Svg>
);

const Camera = (p) => (
  <Svg {...p}>
    <path
      d="M4 6.5h3l1.8-2.5h6.4L17 6.5h3A2.5 2.5 0 0 1 22.5 9v9A2.5 2.5 0 0 1 20 20.5H4A2.5 2.5 0 0 1 1.5 18V9A2.5 2.5 0 0 1 4 6.5Z"
      {...tone}
    />
    <path
      d="M4 6.5h3l1.8-2.5h6.4L17 6.5h3A2.5 2.5 0 0 1 22.5 9v9A2.5 2.5 0 0 1 20 20.5H4A2.5 2.5 0 0 1 1.5 18V9A2.5 2.5 0 0 1 4 6.5Z"
      {...s}
    />
    <circle cx="12" cy="13.5" r="4" {...s} />
    <circle cx="12" cy="13.5" r="1.4" {...tone} />
    <circle cx="18.5" cy="9.5" r=".8" {...solid} />
  </Svg>
);

const CarTaxiFront = (p) => (
  <Svg {...p}>
    <path d="m5 9 1.3-3A2 2 0 0 1 8.1 4.8h7.8A2 2 0 0 1 17.7 6L19 9l2 2v7H3v-7l2-2Z" {...tone} />
    <path d="m5 9 1.3-3A2 2 0 0 1 8.1 4.8h7.8A2 2 0 0 1 17.7 6L19 9l2 2v7H3v-7l2-2Z" {...s} />
    <path d="M5 9h14M7 13h2M15 13h2M6 18v2M18 18v2" {...s} />
    <path d="M9 4.8V3h6v1.8" {...s} />
  </Svg>
);

const Check = (p) => (
  <Svg {...p}>
    <path d="m4 12.5 5 5 11-11" {...s} />
    <path
      d="m8.8 17.3 11-11"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      opacity=".1"
    />
  </Svg>
);

const ChevronDown = (p) => (
  <Svg {...p}>
    <path d="m6.5 9.5 5.5 5 5.5-5" {...s} />
  </Svg>
);

const ChevronLeft = (p) => (
  <Svg {...p}>
    <path d="m14.5 6.5-5.5 5.5 5.5 5.5" {...s} />
  </Svg>
);

const ChevronRight = (p) => (
  <Svg {...p}>
    <path d="m9.5 6.5 5.5 5.5-5.5 5.5" {...s} />
  </Svg>
);

const CircleDot = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.5" {...tone} />
    <circle cx="12" cy="12" r="9.5" {...s} />
    <circle cx="12" cy="12" r="2.7" {...solid} />
  </Svg>
);

const City = (p) => (
  <Svg {...p}>
    <path d="M3 21V7l6-3v17M9 21V10l6-3v14M15 21V5l6 3v13" {...tone} />
    <path d="M2 21h20M3 21V7l6-3v17M9 21V10l6-3v14M15 21V5l6 3v13" {...s} />
    <path d="M6 9h.01M6 13h.01M6 17h.01M12 12h.01M12 16h.01M18 10h.01M18 14h.01M18 18h.01" {...s} />
  </Svg>
);

const Clock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.5" {...tone} />
    <circle cx="12" cy="12" r="9.5" {...s} />
    <path d="M12 6.7v5.6l3.8 2.2" {...s} />
    <circle cx="12" cy="12" r="1" {...solid} />
  </Svg>
);

const Download = (p) => (
  <Svg {...p}>
    <path d="M12 3v12" {...s} />
    <path d="m7.5 10.8 4.5 4.5 4.5-4.5" {...s} />
    <path d="M4 15.5v3A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-3" {...s} />
    <path d="M8 18h8" stroke="currentColor" strokeWidth="3" opacity=".1" />
  </Svg>
);

const Cloud = (p) => (
  <Svg {...p}>
    <path d="M7 19.5h10.2a4.3 4.3 0 0 0 .6-8.6A6.3 6.3 0 0 0 5.7 9.7 5 5 0 0 0 7 19.5Z" {...tone} />
    <path d="M7 19.5h10.2a4.3 4.3 0 0 0 .6-8.6A6.3 6.3 0 0 0 5.7 9.7 5 5 0 0 0 7 19.5Z" {...s} />
  </Svg>
);

const CloudSun = (p) => (
  <Svg {...p}>
    <circle cx="15.8" cy="7.2" r="3.6" {...tone} />
    <circle cx="15.8" cy="7.2" r="3.6" {...s} />

    <path d="M15.8 1.5v1.3M20.5 2.8l-.9 1M22 7.2h-1.3M20.5 11.6l-.9-1" {...s} />

    <path
      d="M6.8 20h9.3a3.9 3.9 0 0 0 .4-7.8 5.5 5.5 0 0 0-10.7-1.1A4.5 4.5 0 0 0 6.8 20Z"
      {...tone}
    />
    <path
      d="M6.8 20h9.3a3.9 3.9 0 0 0 .4-7.8 5.5 5.5 0 0 0-10.7-1.1A4.5 4.5 0 0 0 6.8 20Z"
      {...s}
    />
  </Svg>
);

const Compass = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.5" {...tone} />
    <circle cx="12" cy="12" r="9.5" {...s} />

    <path d="m15.8 8.2-2.2 5.4-5.4 2.2 2.2-5.4 5.4-2.2Z" {...s} />

    <circle cx="12" cy="12" r="1.2" {...solid} />

    <path d="M12 2.5v1.4M12 20.1v1.4M2.5 12h1.4M20.1 12h1.4" {...s} />
  </Svg>
);

/* -------------------------------------------------------------------------- */
/*                                   TRAVEL                                   */
/* -------------------------------------------------------------------------- */

const Beach = (p) => (
  <Svg {...p}>
    <circle cx="18.5" cy="5" r="2.2" {...tone} />

    <path d="M2.5 20.5c3.8-1.7 7.2-1.7 10.4 0 2.8 1.5 5.6 1.5 8.6 0" {...s} />

    <path d="M11.8 19.2 14 8.3" {...s} />

    <path
      d="M5.8 9.4c2.4-3.2 5.5-4.7 9.3-4.4 2.5.2 4.4 1.3 5.8 3.4-2.6-.5-4.7.1-6.3 1.8-1.6-1.6-3.5-1.9-5.7-.9-1.1.5-2.1.5-3.1.1Z"
      {...tone}
    />

    <path
      d="M5.8 9.4c2.4-3.2 5.5-4.7 9.3-4.4 2.5.2 4.4 1.3 5.8 3.4-2.6-.5-4.7.1-6.3 1.8-1.6-1.6-3.5-1.9-5.7-.9-1.1.5-2.1.5-3.1.1Z"
      {...s}
    />
  </Svg>
);

const Destination = (p) => (
  <Svg {...p}>
    <path
      d="M12 2.5a7.5 7.5 0 0 0-7.5 7.5c0 5.5 7.5 11.5 7.5 11.5s7.5-6 7.5-11.5A7.5 7.5 0 0 0 12 2.5Z"
      {...tone}
    />
    <path
      d="M12 2.5a7.5 7.5 0 0 0-7.5 7.5c0 5.5 7.5 11.5 7.5 11.5s7.5-6 7.5-11.5A7.5 7.5 0 0 0 12 2.5Z"
      {...s}
    />

    <circle cx="12" cy="10" r="2.7" {...s} />
    <path d="M12 7.3v5.4M9.3 10h5.4" {...s} opacity=".5" />
  </Svg>
);

const Experiences = (p) => (
  <Svg {...p}>
    <path d="M12 3.2 14 8l4.8 2-4.8 2-2 4.8-2-4.8-4.8-2 4.8-2 2-4.8Z" {...tone} />

    <path d="M12 3.2 14 8l4.8 2-4.8 2-2 4.8-2-4.8-4.8-2 4.8-2 2-4.8Z" {...s} />

    <path
      d="m18.5 15 .8 2 .2.5 1.2.5 2 .8-2 .8-.5.2-.5 1.2-.8 2-.8-2-.2-.5-1.2-.5-2-.8 2-.8.5-.2.5-1.2.8-2Z"
      {...s}
    />

    <circle cx="5" cy="18.5" r="1.3" {...tone} />
  </Svg>
);

const Flight = (p) => (
  <Svg {...p}>
    <path
      d="m3 14.5 7.3-2.8V5.2a2 2 0 0 1 4 0v5l5.9-2.3c.8-.3 1.6.1 1.9.9.2.7-.1 1.4-.7 1.8l-7.1 4.3v4.3l2.6 1.7v1.2l-4.6-1-4.6 1v-1.2l2.6-1.7v-2.7L3 16.3v-1.8Z"
      {...tone}
    />
    <path
      d="m3 14.5 7.3-2.8V5.2a2 2 0 0 1 4 0v5l5.9-2.3c.8-.3 1.6.1 1.9.9.2.7-.1 1.4-.7 1.8l-7.1 4.3v4.3l2.6 1.7v1.2l-4.6-1-4.6 1v-1.2l2.6-1.7v-2.7L3 16.3v-1.8Z"
      {...s}
    />
  </Svg>
);

const Plane = (p) => (
  <Svg {...p}>
    <path d="M21 3 3.5 9.3l7.2 3 3 7.2L21 3Z" {...tone} />
    <path d="M21 3 3.5 9.3l7.2 3 3 7.2L21 3Z" {...s} />
    <path d="m10.7 12.3 4.5-4.5" {...s} />
  </Svg>
);

const Food = (p) => (
  <Svg {...p}>
    <path d="M5 2.5v7M8 2.5v7M2 2.5v4a3 3 0 0 0 6 0" {...s} />
    <path d="M5 9.5V21" {...s} />

    <path d="M15 21V8.5c0-3.6 2-6 4.5-6v10H15" {...tone} />
    <path d="M15 21V8.5c0-3.6 2-6 4.5-6v10H15" {...s} />
  </Svg>
);

const Globe = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.5" {...tone} />
    <circle cx="12" cy="12" r="9.5" {...s} />

    <path
      d="M2.5 12h19M12 2.5c2.4 2.6 3.7 5.8 3.7 9.5S14.4 18.9 12 21.5M12 2.5C9.6 5.1 8.3 8.3 8.3 12s1.3 6.9 3.7 9.5"
      {...s}
    />

    <path d="M4.5 7.2h15M4.5 16.8h15" {...s} opacity=".35" />
  </Svg>
);

const Guide = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="7" r="3.5" {...tone} />
    <circle cx="9" cy="7" r="3.5" {...s} />

    <path d="M3.5 21v-1.5A5.5 5.5 0 0 1 9 14a5.7 5.7 0 0 1 3.7 1.4" {...s} />

    <path d="M15 9h6M18.5 5.5 22 9l-3.5 3.5" {...s} />

    <circle cx="16" cy="18" r="3.5" {...tone} />
    <path d="m14.7 18 1 1 1.8-2" {...s} />
  </Svg>
);

const Hotel = (p) => (
  <Svg {...p}>
    <path d="M4 21V5h16v16" {...tone} />
    <path d="M3 21h18M4 21V5h16v16M8 5V3h8v2" {...s} />

    <path d="M7.5 9h2M14.5 9h2M7.5 13h2M14.5 13h2M9 21v-4h6v4" {...s} />
  </Svg>
);

const Insurance = (p) => (
  <Svg {...p}>
    <path d="M12 2.5 20 5.8v5.5c0 5.1-3.3 8.2-8 10.2-4.7-2-8-5.1-8-10.2V5.8l8-3.3Z" {...tone} />
    <path d="M12 2.5 20 5.8v5.5c0 5.1-3.3 8.2-8 10.2-4.7-2-8-5.1-8-10.2V5.8l8-3.3Z" {...s} />

    <path d="m8.5 12 2.3 2.3 4.7-5" {...s} />
  </Svg>
);

const Itinerary = (p) => (
  <Svg {...p}>
    <path d="M6 5h14M6 12h14M6 19h14" {...s} />

    <circle cx="3" cy="5" r="1.3" {...tone} />
    <circle cx="3" cy="5" r="1.3" {...s} />

    <circle cx="3" cy="12" r="1.3" {...tone} />
    <circle cx="3" cy="12" r="1.3" {...s} />

    <circle cx="3" cy="19" r="1.3" {...tone} />
    <circle cx="3" cy="19" r="1.3" {...s} />

    <path d="M10 8h7M10 15h5" {...s} opacity=".35" />
  </Svg>
);

const Location = (p) => (
  <Svg {...p}>
    <path
      d="M12 2.5a7.2 7.2 0 0 0-7.2 7.2C4.8 15 12 21.5 12 21.5S19.2 15 19.2 9.7A7.2 7.2 0 0 0 12 2.5Z"
      {...tone}
    />
    <path
      d="M12 2.5a7.2 7.2 0 0 0-7.2 7.2C4.8 15 12 21.5 12 21.5S19.2 15 19.2 9.7A7.2 7.2 0 0 0 12 2.5Z"
      {...s}
    />

    <circle cx="12" cy="9.7" r="2.5" {...s} />
  </Svg>
);

const Luggage = (p) => (
  <Svg {...p}>
    <rect x="5" y="6" width="14" height="14" rx="3" {...tone} />
    <rect x="5" y="6" width="14" height="14" rx="3" {...s} />

    <path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6M9 10v6M15 10v6" {...s} />

    <circle cx="8" cy="21.5" r=".8" {...solid} />
    <circle cx="16" cy="21.5" r=".8" {...solid} />
  </Svg>
);

const TravelPackage = (p) => (
  <Svg {...p}>
    <rect x="3" y="7" width="18" height="14" rx="3" {...tone} />
    <rect x="3" y="7" width="18" height="14" rx="3" {...s} />

    <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7M8 7v14M16 7v14" {...s} />

    <path
      d="M12 10.5a2.7 2.7 0 0 0-2.7 2.7c0 2 2.7 4.4 2.7 4.4s2.7-2.4 2.7-4.4a2.7 2.7 0 0 0-2.7-2.7Z"
      {...s}
    />

    <circle cx="12" cy="13.2" r=".8" {...solid} />
  </Svg>
);

const Map = (p) => (
  <Svg {...p}>
    <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20V6.5Z" {...tone} />
    <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20V6.5Z" {...s} />

    <path d="M9 4v13.5M15 6.5V20" {...s} />
    <path d="m5.5 10 1.5-.6M17 14.8l1.5-.6" {...s} opacity=".45" />
  </Svg>
);

const MapPin = (p) => (
  <Svg {...p}>
    <path
      d="M12 2.5a7.2 7.2 0 0 0-7.2 7.2C4.8 15 12 21.5 12 21.5S19.2 15 19.2 9.7A7.2 7.2 0 0 0 12 2.5Z"
      {...tone}
    />
    <path
      d="M12 2.5a7.2 7.2 0 0 0-7.2 7.2C4.8 15 12 21.5 12 21.5S19.2 15 19.2 9.7A7.2 7.2 0 0 0 12 2.5Z"
      {...s}
    />

    <circle cx="12" cy="9.7" r="2.3" {...solid} opacity=".22" />
    <circle cx="12" cy="9.7" r="2.3" {...s} />
  </Svg>
);

const Mountain = (p) => (
  <Svg {...p}>
    <path d="m2.5 20.5 6.7-11.3 3.3 5 3-4.7 6 11H2.5Z" {...tone} />
    <path d="m2.5 20.5 6.7-11.3 3.3 5 3-4.7 6 11H2.5Z" {...s} />

    <path d="m7.6 11.9 1.6 1.8 1.5-1.4M14.3 11.4l1.2 1.4 1.2-1" {...s} />

    <circle cx="17.5" cy="5" r="2" {...tone} />
    <circle cx="17.5" cy="5" r="2" {...s} />
  </Svg>
);

const Navigation = (p) => (
  <Svg {...p}>
    <path d="M20.5 3.5 14 21l-2.8-8.2L3 10l17.5-6.5Z" {...tone} />
    <path d="M20.5 3.5 14 21l-2.8-8.2L3 10l17.5-6.5Z" {...s} />

    <path d="m11.2 12.8 4-4" {...s} />
  </Svg>
);

const Passport = (p) => (
  <Svg {...p}>
    <rect x="4" y="2.5" width="16" height="19" rx="2.5" {...tone} />
    <rect x="4" y="2.5" width="16" height="19" rx="2.5" {...s} />

    <circle cx="12" cy="11" r="4" {...s} />

    <path
      d="M8 11h8M12 7c1.2 1.1 1.8 2.4 1.8 4s-.6 2.9-1.8 4M12 7c-1.2 1.1-1.8 2.4-1.8 4s.6 2.9 1.8 4M8 18h8"
      {...s}
    />
  </Svg>
);

const Route = (p) => (
  <Svg {...p}>
    <circle cx="6" cy="18" r="3" {...tone} />
    <circle cx="6" cy="18" r="3" {...s} />

    <circle cx="18" cy="6" r="3" {...tone} />
    <circle cx="18" cy="6" r="3" {...s} />

    <path d="M8.8 17c4.6-.6 1.8-6.9 6.3-8.4" {...s} />
    <path d="m13.1 6.9 2.7 1.2-1.1 2.8" {...s} />
  </Svg>
);

const Suitcase = (p) => (
  <Svg {...p}>
    <rect x="3" y="7" width="18" height="13" rx="3" {...tone} />
    <rect x="3" y="7" width="18" height="13" rx="3" {...s} />

    <path d="M9 7V5.2A2.2 2.2 0 0 1 11.2 3h1.6A2.2 2.2 0 0 1 15 5.2V7M8 7v13M16 7v13" {...s} />

    <path d="M10 13h4" {...s} />
  </Svg>
);

const Taxi = (p) => (
  <Svg {...p}>
    <path d="m5 9 1.3-3A2 2 0 0 1 8.1 4.8h7.8A2 2 0 0 1 17.7 6L19 9l2 2v7H3v-7l2-2Z" {...tone} />

    <path d="m5 9 1.3-3A2 2 0 0 1 8.1 4.8h7.8A2 2 0 0 1 17.7 6L19 9l2 2v7H3v-7l2-2Z" {...s} />

    <path d="M5 9h14M7 13h2M15 13h2M6 18v2M18 18v2M9 4.8V3h6v1.8" {...s} />

    <path d="M10 3h4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".1" />
  </Svg>
);

const Ticket = (p) => (
  <Svg {...p}>
    <path d="M3 5.5h18v4a3 3 0 0 0 0 5v4H3v-4a3 3 0 0 0 0-5v-4Z" {...tone} />

    <path d="M3 5.5h18v4a3 3 0 0 0 0 5v4H3v-4a3 3 0 0 0 0-5v-4Z" {...s} />

    <path d="M13.5 8.5v2M13.5 13.5v2" {...s} />
    <path d="M7 10.5h3" {...s} />
  </Svg>
);

const Tours = (p) => (
  <Svg {...p}>
    <path d="M4 19c2-5 4.4-7.5 7.2-7.5 2.3 0 3.8 1.1 4.6 3.2.6 1.7 1.8 2.6 3.7 2.6" {...s} />

    <circle cx="5" cy="19" r="2.5" {...tone} />
    <circle cx="5" cy="19" r="2.5" {...s} />

    <path d="M16 4.5h4.5v6H16l-2 2v-10l2 2Z" {...tone} />

    <path d="M14 12.5v-10l2 2h4.5v6H16l-2 2Z" {...s} />

    <circle cx="19.5" cy="17.3" r="1.4" {...solid} opacity=".25" />
  </Svg>
);

const Train = (p) => (
  <Svg {...p}>
    <rect x="4" y="3" width="16" height="15" rx="4" {...tone} />
    <rect x="4" y="3" width="16" height="15" rx="4" {...s} />

    <path d="M7 7h10M4 12h16M8 15h.01M16 15h.01M8 18l-2 3M16 18l2 3M8 21h8" {...s} />
  </Svg>
);

const Visa = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" {...tone} />
    <rect x="3" y="4" width="18" height="16" rx="2.5" {...s} />

    <circle cx="9" cy="11" r="3" {...s} />

    <path
      d="M6 11h6M9 8c.8.8 1.2 1.8 1.2 3S9.8 13.2 9 14M9 8c-.8.8-1.2 1.8-1.2 3S8.2 13.2 9 14M14.5 9h3M14.5 13h3M6 17h11.5"
      {...s}
    />
  </Svg>
);

/* -------------------------------------------------------------------------- */
/*                              ACTION / INTERFACE                            */
/* -------------------------------------------------------------------------- */

const Eye = (p) => (
  <Svg {...p}>
    <path d="M2.5 12s3.4-6.2 9.5-6.2 9.5 6.2 9.5 6.2-3.4 6.2-9.5 6.2S2.5 12 2.5 12Z" {...tone} />
    <path d="M2.5 12s3.4-6.2 9.5-6.2 9.5 6.2 9.5 6.2-3.4 6.2-9.5 6.2S2.5 12 2.5 12Z" {...s} />

    <circle cx="12" cy="12" r="3" {...s} />
    <circle cx="12" cy="12" r="1" {...solid} />
  </Svg>
);

const EyeSlash = (p) => (
  <Svg {...p}>
    <path d="M4.7 6.8C3.3 8 2.5 9.5 2.5 12c0 0 3.4 6.2 9.5 6.2 1.5 0 2.9-.4 4.1-1" {...s} />

    <path d="M8.2 5.9c1.1-.5 2.4-.8 3.8-.8 6.1 0 9.5 6.9 9.5 6.9a13 13 0 0 1-2.1 3" {...s} />

    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" {...s} />
    <path d="M3 3l18 18" {...s} />
  </Svg>
);

const Filter = (p) => (
  <Svg {...p}>
    <path d="M3 4h18l-7 8v6.5l-4 2V12L3 4Z" {...tone} />
    <path d="M3 4h18l-7 8v6.5l-4 2V12L3 4Z" {...s} />
    <path d="M8 8h8" {...s} opacity=".45" />
  </Svg>
);

const Heart = (p) => (
  <Svg {...p}>
    <path
      d="M12 21s-8.5-5.2-8.5-11.2A4.8 4.8 0 0 1 12 6.7a4.8 4.8 0 0 1 8.5 3.1C20.5 15.8 12 21 12 21Z"
      {...tone}
    />
    <path
      d="M12 21s-8.5-5.2-8.5-11.2A4.8 4.8 0 0 1 12 6.7a4.8 4.8 0 0 1 8.5 3.1C20.5 15.8 12 21 12 21Z"
      {...s}
    />
  </Svg>
);

const Info = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.5" {...tone} />
    <circle cx="12" cy="12" r="9.5" {...s} />

    <path d="M12 10.5v6" {...s} />
    <circle cx="12" cy="7.4" r="1" {...solid} />
  </Svg>
);

const Lock = (p) => (
  <Svg {...p}>
    <rect x="4.5" y="10" width="15" height="11" rx="2.5" {...tone} />
    <rect x="4.5" y="10" width="15" height="11" rx="2.5" {...s} />

    <path d="M8 10V7a4 4 0 0 1 8 0v3" {...s} />

    <circle cx="12" cy="15.3" r="1.2" {...solid} />
    <path d="M12 16.5v1.5" {...s} />
  </Svg>
);

const LogOut = (p) => (
  <Svg {...p}>
    <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" {...s} />
    <path d="M14 8l4 4-4 4M18 12H9" {...s} />
    <circle cx="18" cy="12" r="3" {...tone} />
  </Svg>
);

const LogIn = (p) => (
  <Svg {...p}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" {...s} />
    <path d="m10 8 4 4-4 4M14 12H5" {...s} />
    <circle cx="6" cy="12" r="3" {...tone} />
  </Svg>
);

const Management = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="5" height="5" rx="1.5" {...tone} />
    <rect x="16" y="3" width="5" height="5" rx="1.5" {...tone} />
    <rect x="9.5" y="16" width="5" height="5" rx="1.5" {...tone} />

    <rect x="3" y="3" width="5" height="5" rx="1.5" {...s} />
    <rect x="16" y="3" width="5" height="5" rx="1.5" {...s} />
    <rect x="9.5" y="16" width="5" height="5" rx="1.5" {...s} />

    <path d="M5.5 8v3.5h13V8M12 11.5V16" {...s} />

    <circle cx="12" cy="11.5" r="1.2" {...solid} />
  </Svg>
);

const MoreVertical = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="5" r="1.5" {...solid} />
    <circle cx="12" cy="12" r="1.5" {...solid} />
    <circle cx="12" cy="19" r="1.5" {...solid} />
  </Svg>
);

const MenuClose = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" {...tone} />
    <path d="m6 6 12 12M18 6 6 18" {...s} />
  </Svg>
);

const MenuOpen = (p) => (
  <Svg {...p}>
    <path d="M4 6.5h16M4 12h12M4 17.5h16" {...s} />
    <circle cx="19" cy="12" r="1" {...solid} />
  </Svg>
);

const MessageCircle = (p) => (
  <Svg {...p}>
    <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2-5.2A8.5 8.5 0 1 1 21 11.5Z" {...tone} />

    <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2-5.2A8.5 8.5 0 1 1 21 11.5Z" {...s} />

    <circle cx="8.5" cy="11.5" r=".8" {...solid} />
    <circle cx="12" cy="11.5" r=".8" {...solid} />
    <circle cx="15.5" cy="11.5" r=".8" {...solid} />
  </Svg>
);

const Moon = (p) => (
  <Svg {...p}>
    <path d="M20.5 14.2A8.8 8.8 0 1 1 9.8 3.5a7.2 7.2 0 0 0 10.7 10.7Z" {...tone} />
    <path d="M20.5 14.2A8.8 8.8 0 1 1 9.8 3.5a7.2 7.2 0 0 0 10.7 10.7Z" {...s} />

    <circle cx="17.8" cy="5.2" r="1" {...solid} opacity=".45" />
  </Svg>
);

const Minus = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" {...s} />
  </Svg>
);

const Plus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" {...s} />
  </Svg>
);

const Play = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.5" {...tone} />

    <path d="m9.5 8 7 4-7 4V8Z" {...solid} opacity=".8" />

    <circle cx="12" cy="12" r="9.5" {...s} />
  </Svg>
);

const Search = (p) => (
  <Svg {...p}>
    <circle cx="10.8" cy="10.8" r="7.3" {...tone} />
    <circle cx="10.8" cy="10.8" r="7.3" {...s} />

    <path d="m16.2 16.2 4.3 4.3" {...s} />

    <path d="M7.5 8.5a4.2 4.2 0 0 1 3.5-1.9" {...s} opacity=".45" />
  </Svg>
);

const Settings = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.2" {...tone} />
    <circle cx="12" cy="12" r="3.2" {...s} />

    <path
      d="M19.2 13.8a7.6 7.6 0 0 0 0-3.6l2-1.5-2-3.4-2.5 1a8.2 8.2 0 0 0-3.1-1.8L13.3 2H9.4l-.4 2.5a8.2 8.2 0 0 0-3.1 1.8l-2.4-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3.6l-2 1.5 2 3.4 2.4-1A8.2 8.2 0 0 0 9 19.5l.4 2.5h3.9l.3-2.5a8.2 8.2 0 0 0 3.1-1.8l2.5 1 2-3.4-2-1.5Z"
      {...s}
    />
  </Svg>
);

const Share = (p) => (
  <Svg {...p}>
    <circle cx="18" cy="5" r="3" {...tone} />
    <circle cx="6" cy="12" r="3" {...tone} />
    <circle cx="18" cy="19" r="3" {...tone} />

    <circle cx="18" cy="5" r="3" {...s} />
    <circle cx="6" cy="12" r="3" {...s} />
    <circle cx="18" cy="19" r="3" {...s} />

    <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" {...s} />
  </Svg>
);

const Edit = (p) => (
  <Svg {...p}>
    <path d="M4 20h4l11.5-11.5a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5 4 20Z" {...tone} />
    <path d="M4 20h4l11.5-11.5a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5 4 20Z" {...s} />

    <path d="m14.5 6.5 3 3M3 21h18" {...s} />
  </Svg>
);

const RefreshCw = (p) => (
  <Svg {...p}>
    <path d="M20 7.5A8 8 0 0 0 5.3 5.3L3 7.5" {...s} />

    <path d="M3 3v4.5h4.5" {...s} />

    <path d="M4 16.5a8 8 0 0 0 14.7 2.2L21 16.5" {...s} />

    <path d="M21 21v-4.5h-4.5" {...s} />

    <circle cx="12" cy="12" r="3" {...tone} />
  </Svg>
);

const X = (p) => (
  <Svg {...p}>
    <path d="M18 6 6 18M6 6l12 12" {...s} />
  </Svg>
);

/* -------------------------------------------------------------------------- */
/*                              PEOPLE / ACCOUNT                              */
/* -------------------------------------------------------------------------- */

const People = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" {...tone} />
    <circle cx="9" cy="8" r="3.5" {...s} />

    <path d="M2.5 21v-1A6.5 6.5 0 0 1 9 13.5a6.5 6.5 0 0 1 6.5 6.5v1" {...s} />

    <path d="M16 5a3 3 0 0 1 0 6M17.5 14.5A5.5 5.5 0 0 1 21.5 20v1" {...s} />
  </Svg>
);

const User = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="7.5" r="4" {...tone} />
    <circle cx="12" cy="7.5" r="4" {...s} />

    <path d="M4 21a8 8 0 0 1 16 0" {...s} />

    <path d="M8 17.5c1.1.5 2.5.8 4 .8s2.9-.3 4-.8" {...s} opacity=".35" />
  </Svg>
);

const UsersRound = (p) => (
  <Svg {...p}>
    <circle cx="8.5" cy="8" r="3.5" {...tone} />
    <circle cx="8.5" cy="8" r="3.5" {...s} />

    <circle cx="16.5" cy="8" r="3" {...tone} />
    <circle cx="16.5" cy="8" r="3" {...s} />

    <path d="M2.5 21a6 6 0 0 1 12 0M13.5 16a5 5 0 0 1 8 4v1" {...s} />
  </Svg>
);

const PhoneCall = (p) => (
  <Svg {...p}>
    <path
      d="M6.6 3.3 9 7.6 7.3 9.3a15.5 15.5 0 0 0 7.4 7.4l1.7-1.7 4.3 2.4-.8 3.1a2 2 0 0 1-2 1.5C9.2 21.3 2.7 14.8 2 6.1a2 2 0 0 1 1.5-2l3.1-.8Z"
      {...tone}
    />

    <path
      d="M6.6 3.3 9 7.6 7.3 9.3a15.5 15.5 0 0 0 7.4 7.4l1.7-1.7 4.3 2.4-.8 3.1a2 2 0 0 1-2 1.5C9.2 21.3 2.7 14.8 2 6.1a2 2 0 0 1 1.5-2l3.1-.8Z"
      {...s}
    />

    <path d="M14.5 3.5a6 6 0 0 1 6 6M14.5 7a2.5 2.5 0 0 1 2.5 2.5" {...s} />
  </Svg>
);

/* -------------------------------------------------------------------------- */
/*                              BOOKING / PAYMENT                             */
/* -------------------------------------------------------------------------- */

const Payment = (p) => (
  <Svg {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2.5" {...tone} />
    <rect x="2" y="5" width="20" height="14" rx="2.5" {...s} />

    <path d="M2 9.5h20" {...s} />

    <path d="M6 15h5M17.5 14h.01" {...s} />

    <rect x="15" y="12.5" width="4" height="3" rx=".8" {...tone} />
  </Svg>
);

const Wallet = (p) => (
  <Svg {...p}>
    <path
      d="M4 6h14a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7.5A3.5 3.5 0 0 1 5.5 4H17"
      {...tone}
    />
    <path
      d="M4 6h14a3 3 0 0 1 3 3v9a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7.5A3.5 3.5 0 0 1 5.5 4H17"
      {...s}
    />

    <path d="M21 11h-5a2.5 2.5 0 0 0 0 5h5" {...s} />

    <circle cx="16" cy="13.5" r=".9" {...solid} />
  </Svg>
);

const Reservations = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="17" rx="3" {...tone} />
    <rect x="3" y="4" width="18" height="17" rx="3" {...s} />

    <path d="M8 2.5v3M16 2.5v3M3 9h18" {...s} />
    <path d="m8 15 2.2 2.2 5-5.2" {...s} />
  </Svg>
);

/* -------------------------------------------------------------------------- */
/*                              SECURITY / STATUS                             */
/* -------------------------------------------------------------------------- */

const Shield = (p) => (
  <Svg {...p}>
    <path d="M12 2.5 20 5.8v5.5c0 5.1-3.3 8.2-8 10.2-4.7-2-8-5.1-8-10.2V5.8l8-3.3Z" {...tone} />

    <path d="M12 2.5 20 5.8v5.5c0 5.1-3.3 8.2-8 10.2-4.7-2-8-5.1-8-10.2V5.8l8-3.3Z" {...s} />

    <path d="M12 6.5v10" {...s} opacity=".35" />
  </Svg>
);

const ShieldCheck = (p) => (
  <Svg {...p}>
    <path d="M12 2.5 20 5.8v5.5c0 5.1-3.3 8.2-8 10.2-4.7-2-8-5.1-8-10.2V5.8l8-3.3Z" {...tone} />

    <path d="M12 2.5 20 5.8v5.5c0 5.1-3.3 8.2-8 10.2-4.7-2-8-5.1-8-10.2V5.8l8-3.3Z" {...s} />

    <path d="m8.6 12 2.2 2.2 4.8-5" {...s} />
  </Svg>
);

const Premium = (p) => (
  <Svg {...p}>
    <path d="M3.5 9 7 4.5 12 8l5-3.5L20.5 9 18 19H6L3.5 9Z" {...tone} />

    <path d="M3.5 9 7 4.5 12 8l5-3.5L20.5 9 18 19H6L3.5 9Z" {...s} />

    <path d="M7 14h10M8 22h8" {...s} />
    <circle cx="12" cy="11" r="1.2" {...solid} />
  </Svg>
);

const Sparkles = (p) => (
  <Svg {...p}>
    <path d="M11.5 2.5 13 7l4.5 1.5L13 10l-1.5 4.5L10 10 5.5 8.5 10 7l1.5-4.5Z" {...tone} />

    <path d="M11.5 2.5 13 7l4.5 1.5L13 10l-1.5 4.5L10 10 5.5 8.5 10 7l1.5-4.5Z" {...s} />

    <path
      d="M18.5 13.5 19.4 16l2.6.9-2.6.9-.9 2.7-.9-2.7-2.6-.9 2.6-.9.9-2.5ZM5 14.5l.6 1.8 1.9.7-1.9.7L5 19.5l-.6-1.8-1.9-.7 1.9-.7.6-1.8Z"
      {...s}
    />
  </Svg>
);

const Star = (p) => (
  <Svg {...p}>
    <path
      d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9L12 2.8Z"
      {...tone}
    />

    <path
      d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9L12 2.8Z"
      {...s}
    />
  </Svg>
);

/* -------------------------------------------------------------------------- */
/*                                   WEATHER                                  */
/* -------------------------------------------------------------------------- */

const Sun = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4.5" {...tone} />
    <circle cx="12" cy="12" r="4.5" {...s} />

    <path
      d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
      {...s}
    />
  </Svg>
);

/* -------------------------------------------------------------------------- */
/*                              SUPPORT / FALLBACK                            */
/* -------------------------------------------------------------------------- */

const Support = (p) => (
  <Svg {...p}>
    <path d="M4 13v-2a8 8 0 0 1 16 0v2" {...s} />

    <rect x="2.5" y="12" width="4" height="6" rx="2" {...tone} />
    <rect x="2.5" y="12" width="4" height="6" rx="2" {...s} />

    <rect x="17.5" y="12" width="4" height="6" rx="2" {...tone} />
    <rect x="17.5" y="12" width="4" height="6" rx="2" {...s} />

    <path d="M19.5 18v.5A2.5 2.5 0 0 1 17 21h-3" {...s} />

    <circle cx="12.5" cy="21" r="1" {...solid} />
  </Svg>
);

const Fallback = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.5" {...tone} />
    <circle cx="12" cy="12" r="9.5" {...s} />

    <path d="M9.7 9a2.5 2.5 0 1 1 4.5 1.5c-.8 1-2.2 1.2-2.2 3" {...s} />

    <circle cx="12" cy="17.5" r="1" {...solid} />
  </Svg>
);

/* -------------------------------------------------------------------------- */
/*                                ICON REGISTRY                               */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                   EXPORT                                   */
/* -------------------------------------------------------------------------- */

export default function Icon({ name, size = 24, title, ...rest }) {
  const Component = ICONS[name] || Fallback;

  return <Component size={size} title={title} {...rest} />;
}
