export const slugifyTourTitle = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getTourRef = (tour = {}) => {
  const textValue = (value) => {
    if (value == null) return "";
    if (["string", "number", "boolean"].includes(typeof value)) {
      const text = String(value).trim();
      return text === "[object Object]" ? "" : text;
    }
    if (Array.isArray(value)) return value.map(textValue).find(Boolean) || "";
    if (typeof value === "object") {
      return (
        textValue(
          value.slug ??
            value.tourRef ??
            value.value ??
            value.label ??
            value.name ??
            value.title ??
            value.en ??
            value.default ??
            value._id ??
            value.id,
        ) || ""
      );
    }
    return "";
  };

  const hrefTail = textValue(tour?.href || tour?.path)
    .split("/")
    .filter(Boolean)
    .pop();

  return (
    textValue(tour?.slug) ||
    textValue(tour?.tourRef) ||
    textValue(hrefTail) ||
    slugifyTourTitle(textValue(tour?.title) || textValue(tour?.name)) ||
    textValue(tour?._id) ||
    textValue(tour?.id)
  );
};
