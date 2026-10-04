export const ACCOUNT_AVATAR_ICONS = Object.freeze([
  "user",
  "compass",
  "map",
  "globe",
  "plane",
  "train",
  "bus",
  "taxi",
  "hotel",
  "destination",
  "beach",
  "mountain",
  "camera",
  "heart",
  "star",
  "sun",
  "moon",
  "sparkles",
]);

export const DEFAULT_ACCOUNT_AVATAR = ACCOUNT_AVATAR_ICONS[0];

export const isAccountAvatarIcon = (avatar) => ACCOUNT_AVATAR_ICONS.includes(avatar);

export const isRemoteAccountAvatar = (avatar) => /^https?:\/\//i.test(String(avatar || ""));

export const resolveAccountAvatar = (avatar) => {
  const normalized = String(avatar || "").trim();
  return isAccountAvatarIcon(normalized) ? normalized : DEFAULT_ACCOUNT_AVATAR;
};
