// Middleware to validate image size (max 5MB by default)
export const validateImageSize = (maxSizeInMB = 5) => (req, res, next) => {
  const { imageData } = req.body;

  if (!imageData) {
    return next();
  }

  // Estimate size of base64 string
  // Base64 is ~4/3 the size of the original data
  const stringLength = imageData.length;
  const sizeInBytes = (stringLength * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  if (sizeInMB > maxSizeInMB) {
    return res.status(413).json({
      success: false,
      message: `Image too large. Max size is ${maxSizeInMB}MB.`,
    });
  }

  next();
};
