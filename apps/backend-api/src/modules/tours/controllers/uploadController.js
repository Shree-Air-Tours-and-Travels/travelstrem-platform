import Tour from "../models/Tour.js";

const normalizeUrl = (filePath) => {
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const parts = filePath.split(/[/\\]/);
  return `/uploads/${parts[parts.length - 1]}`;
};

export const uploadTourImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const url = normalizeUrl(req.file.path);

    return res.json({
      status: "success",
      url,
      secure_url: url,
      public_id: req.file.filename,
    });
  } catch (err) {
    console.error("[uploadTourImage] error:", err?.message || err);
    return res.status(500).json({ message: "Image upload failed." });
  }
};

export const uploadAndAttachPhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }

    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: "Tour not found." });
    }

    const urls = req.files.map((f) => normalizeUrl(f.path));
    tour.photos.push(...urls);

    if (!tour.photo) {
      tour.photo = urls[0];
    }

    await tour.save();

    return res.json({
      status: "success",
      photos: tour.photos,
      added: urls,
    });
  } catch (err) {
    console.error("[uploadAndAttachPhotos] error:", err?.message || err);
    return res.status(500).json({ message: "Failed to upload and attach photos." });
  }
};
