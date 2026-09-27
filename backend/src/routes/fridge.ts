import { Router } from "express";
import { z } from "zod";
import { imageUpload } from "../middleware/upload.js";
import { analyzeFridgeImage, type ImageMediaType } from "../services/claudeService.js";
import { notifyUsage } from "../services/notifyService.js";

export const fridgeRouter = Router();

const SUPPORTED_MEDIA_TYPES: ImageMediaType[] = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const base64BodySchema = z.object({
  imageBase64: z.string().min(1),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]).optional(),
});

function isSupportedMediaType(value: string): value is ImageMediaType {
  return (SUPPORTED_MEDIA_TYPES as string[]).includes(value);
}

/**
 * POST /api/fridge/analyze
 * Accepts EITHER a multipart/form-data upload (field name "image") OR a JSON
 * body { imageBase64, mediaType } - the mobile app can use whichever is more
 * convenient (expo-camera typically gives you a base64 string directly).
 */
fridgeRouter.post("/analyze", imageUpload.single("image"), async (req, res, next) => {
  try {
    let imageBase64: string;
    let mediaType: ImageMediaType;

    if (req.file) {
      imageBase64 = req.file.buffer.toString("base64");
      mediaType = isSupportedMediaType(req.file.mimetype) ? req.file.mimetype : "image/jpeg";
    } else {
      const parsed = base64BodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Provide an 'image' file upload or a JSON { imageBase64 } body." });
        return;
      }
      imageBase64 = parsed.data.imageBase64;
      mediaType = parsed.data.mediaType ?? "image/jpeg";
    }

    const analysis = await analyzeFridgeImage(imageBase64, mediaType);
    await notifyUsage("Foto gescannt");
    res.json(analysis);
  } catch (err) {
    next(err);
  }
});
