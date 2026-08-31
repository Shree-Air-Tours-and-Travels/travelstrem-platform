export const isImageMimeType = (mimeType = "") =>
    /^image\/[a-z0-9][a-z0-9.+-]*$/i.test(String(mimeType).trim());

export const normalizeRemoteImageUrl = (value = "") => {
    let parsed;
    try {
        parsed = new URL(String(value).trim());
    } catch {
        throw Object.assign(new Error("Enter a valid public image URL."), { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
        throw Object.assign(new Error("Only public HTTP or HTTPS image URLs are supported."), {
            status: 400,
        });
    }

    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    const isLocalHostname = hostname === "localhost" || hostname.endsWith(".localhost");
    const isPrivateIpv4 =
        /^(?:127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(hostname);
    const isPrivateIpv6 =
        hostname === "::1" ||
        hostname.startsWith("fc") ||
        hostname.startsWith("fd") ||
        hostname.startsWith("fe80:");
    if (isLocalHostname || isPrivateIpv4 || isPrivateIpv6) {
        throw Object.assign(new Error("The image URL must be publicly accessible."), {
            status: 400,
        });
    }

    return parsed.toString();
};

export const isCloudinaryImageUrl = (value = "", cloudName = "") => {
    try {
        const parsed = new URL(String(value).trim());
        const owner = decodeURIComponent(parsed.pathname.split("/").filter(Boolean)[0] || "");
        return (
            parsed.hostname.toLowerCase() === "res.cloudinary.com" &&
            owner === String(cloudName || "")
        );
    } catch {
        return false;
    }
};

export const isUnsplashPhotoPageUrl = (value = "") => {
    try {
        const parsed = new URL(String(value).trim());
        const hostname = parsed.hostname.toLowerCase();
        return (
            (hostname === "unsplash.com" || hostname === "www.unsplash.com") &&
            /^\/photos\/[^/]+\/?$/.test(parsed.pathname)
        );
    } catch {
        return false;
    }
};

const decodeHtmlAttribute = (value = "") =>
    String(value)
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#(?:39|x27);/gi, "'")
        .replace(/&#x2f;/gi, "/")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

export const extractPageImageUrl = (html = "") => {
    const tags = String(html).match(/<meta\b[^>]*>/gi) || [];
    const acceptedNames = ["og:image:secure_url", "og:image", "twitter:image"];

    for (const name of acceptedNames) {
        const tag = tags.find((candidate) => {
            const key = candidate.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1];
            return key?.toLowerCase() === name;
        });
        const content = tag?.match(/content\s*=\s*["']([^"']+)["']/i)?.[1];
        if (content) return decodeHtmlAttribute(content);
    }
    return "";
};
