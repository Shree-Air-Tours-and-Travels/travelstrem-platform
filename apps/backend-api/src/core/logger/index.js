import { redact } from "./redact.js";
const logger = {
    info: (...args) => console.info(...args.map((value) => redact(value))),
    warn: (...args) => console.warn(...args.map((value) => redact(value))),
    error: (...args) => console.error(...args.map((value) => redact(value))),
    debug: (...args) => console.debug(...args.map((value) => redact(value))),
};

export default logger;
