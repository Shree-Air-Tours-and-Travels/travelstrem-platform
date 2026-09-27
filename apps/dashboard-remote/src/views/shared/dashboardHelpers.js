export const ACTIVITY_ICONS = {
  partner: "building2",
  support: "support",
  enquiry: "messageCircle",
  trip: "mountain",
};
export const PLATFORM_ROWS = ["activeProducts", "activePartners", "activeAgents", "activeMembers"];

export const labelFor = (labels, ref, fallback = "") => labels?.[ref] || fallback;

export const timeOfDay = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
};

export const firstNameOf = (user) =>
  String(user?.name || "")
    .trim()
    .split(/\s+/)[0] || "";

const numberFormats = new Map();
export const formatNumber = (value, locale) => {
  if (!numberFormats.has(locale)) numberFormats.set(locale, new Intl.NumberFormat(locale));
  return numberFormats.get(locale).format(Number(value) || 0);
};

export const formatTimestamp = (value, { locale, fallback = "" } = {}) => {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

const trimStat = (stat) =>
  stat.value == null || stat.value === ""
    ? null
    : { id: stat.id, label: stat.label, value: stat.value };

export const buildStats = (stats) => stats.map(trimStat).filter(Boolean);

