import tokens from "./typography-sass.js";
const value = key => tokens[key].replace(/ !default$/, "");
export const typography = {
  fontFamily: { primary: value("font-primary"), secondary: value("font-primary") },
  fontSize: Object.fromEntries(["xs", "sm", "md", "lg", "xl", "xxl", "xxxl"].map(key => [key, value(`font-size-${key}`)])),
  fontWeight: Object.fromEntries(["light", "regular", "medium", "semibold", "bold", "extrabold", "black"].map(key => [key, Number(value(`font-${key}`))])),
  lineHeight: Object.fromEntries(["xs", "sm", "md", "lg"].map(key => [key, Number(value(`line-height-${key}`))])),
  rootFontSize: Object.fromEntries(["desktop", "tablet", "mobile"].map(key => [key, value(`root-font-size-${key}`)])),
};
