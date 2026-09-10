import { customAlphabet } from "nanoid";

const randomLetters = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 2);
const randomDigits = customAlphabet("0123456789", 4);

export const createReadableReference = (prefix) =>
    `${String(prefix || "").toUpperCase()}-${randomLetters()}-${randomDigits()}`;
