import {
    extractPageImageUrl,
    isCloudinaryImageUrl,
    isImageMimeType,
    isUnsplashPhotoPageUrl,
    normalizeRemoteImageUrl,
} from "../../services/imageUploadPolicy.js";

describe("image upload policy", () => {
    it.each([
        "image/avif",
        "image/jpeg",
        "image/png",
        "image/svg+xml",
        "image/vnd.microsoft.icon",
        "image/x-canon-cr2",
    ])("accepts the image MIME type %s", (mimeType) => {
        expect(isImageMimeType(mimeType)).toBe(true);
    });

    it.each(["", "image/", "application/pdf", "video/mp4", "text/html"])(
        "rejects the non-image MIME type %s",
        (mimeType) => {
            expect(isImageMimeType(mimeType)).toBe(false);
        },
    );

    it("accepts public remote image URLs without requiring a file extension", () => {
        expect(normalizeRemoteImageUrl("https://images.unsplash.com/photo-123?auto=format")).toBe(
            "https://images.unsplash.com/photo-123?auto=format",
        );
    });

    it.each([
        "not a url",
        "file:///tmp/photo.jpg",
        "http://localhost/photo.jpg",
        "http://192.168.1.2/photo.jpg",
    ])("rejects unsafe remote URL %s", (url) =>
        expect(() => normalizeRemoteImageUrl(url)).toThrow(),
    );

    it("recognizes only assets in the configured Cloudinary account", () => {
        expect(
            isCloudinaryImageUrl(
                "https://res.cloudinary.com/my-cloud/image/upload/photo.jpg",
                "my-cloud",
            ),
        ).toBe(true);
        expect(
            isCloudinaryImageUrl(
                "https://res.cloudinary.com/another-cloud/image/upload/photo.jpg",
                "my-cloud",
            ),
        ).toBe(false);
    });

    it("recognizes descriptive and ID-only Unsplash photo pages", () => {
        expect(
            isUnsplashPhotoPageUrl("https://unsplash.com/photos/a-descriptive-photo-q52DnJSf_Gw"),
        ).toBe(true);
        expect(isUnsplashPhotoPageUrl("https://unsplash.com/photos/q52DnJSf_Gw")).toBe(true);
        expect(isUnsplashPhotoPageUrl("https://images.unsplash.com/photo-123")).toBe(false);
    });

    it("extracts and decodes an Open Graph image URL", () => {
        const html =
            '<html><head><meta property="og:image" content="https://plus.unsplash.com/photo-123?auto=format&amp;w=1600"></head></html>';
        expect(extractPageImageUrl(html)).toBe(
            "https://plus.unsplash.com/photo-123?auto=format&w=1600",
        );
    });
});
