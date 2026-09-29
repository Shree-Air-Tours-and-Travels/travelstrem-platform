const validEmail = (email) => typeof email === "string" && email.trim().length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100)
        return res.status(400).json({ message: "Enter your full name (2–100 characters)." });
    if (!validEmail(email)) return res.status(400).json({ message: "Enter a valid email address." });
    if (typeof password !== "string" || password.length < 8 || password.length > 128)
        return res.status(400).json({ message: "Use a password between 8 and 128 characters." });
    return next();
};

export const validateLogin = (req, res, next) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }
    if (!validEmail(email)) return res.status(400).json({ message: "Enter a valid email address." });
    if (typeof password !== "string" || password.length > 128)
        return res.status(400).json({ message: "Enter a valid password." });
    if (req.body.rememberMe !== undefined && typeof req.body.rememberMe !== "boolean")
        return res.status(400).json({ message: "Invalid Remember me preference." });
    return next();
};
