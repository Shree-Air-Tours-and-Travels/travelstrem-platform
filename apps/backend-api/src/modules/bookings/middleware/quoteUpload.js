import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (_req, file, callback) => {
  const isPdf = file.mimetype === "application/pdf";
  callback(isPdf ? null : new Error("Only PDF quote files are allowed."), isPdf);
};

export const quoteUpload = multer({ storage, fileFilter, limits: { fileSize: 15 * 1024 * 1024, files: 1 } });

export default quoteUpload;
