export const requireTourBody = (req, res, next) => {
    if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ message: "Tour payload is required." });
    }
    return next();
};
