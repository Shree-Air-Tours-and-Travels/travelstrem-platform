import jwt from "jsonwebtoken";
import config from "../../config/index.js";

const getAccessSecret = () => (config.JWT && config.JWT.accessSecret) || process.env.JWT_SECRET;

export function verifyAccessToken(token) {
    return jwt.verify(token, getAccessSecret());
}

export function signAccessToken(payload, options = {}) {
    return jwt.sign(payload, getAccessSecret(), options);
}

export default {
    signAccessToken,
    verifyAccessToken,
};
