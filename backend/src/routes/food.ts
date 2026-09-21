import { Router } from "express";
import { getProductByBarcode, searchFoodProducts } from "../services/openFoodFactsService.js";

export const foodRouter = Router();

/** GET /api/food/search?q=chicken breast */
foodRouter.get("/search", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) {
      res.status(400).json({ error: "Query parameter 'q' is required." });
      return;
    }
    const products = await searchFoodProducts(q);
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

/** GET /api/food/barcode/:code */
foodRouter.get("/barcode/:code", async (req, res, next) => {
  try {
    const product = await getProductByBarcode(req.params.code);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ product });
  } catch (err) {
    next(err);
  }
});
