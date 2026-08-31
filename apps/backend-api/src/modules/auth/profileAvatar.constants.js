export const PROFILE_AVATAR_ICONS = Object.freeze([
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

export const DEFAULT_PROFILE_AVATAR = PROFILE_AVATAR_ICONS[0];

export const normalizeProfileAvatar = (avatar) => {
    const normalized = String(avatar || "").trim();
    return PROFILE_AVATAR_ICONS.includes(normalized) ? normalized : DEFAULT_PROFILE_AVATAR;
};
