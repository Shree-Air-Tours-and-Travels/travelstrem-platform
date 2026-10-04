import tokens from "./motion-sass.js";
export const motion = {
  duration: Object.fromEntries(Object.entries(tokens).filter(([key]) => key.startsWith("duration-")).map(([key, value]) => [key.slice(9), value])),
  easing: { standard: tokens["ease-standard"], linear: tokens["ease-linear"] },
};
