import express from "express";
import cors from "cors";
import { config, assertAnthropicConfigured } from "./config.js";
import { fridgeRouter } from "./routes/fridge.js";
import { recipesRouter } from "./routes/recipes.js";
import { foodRouter } from "./routes/food.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { isNotifyConfigured } from "./services/notifyService.js";

const app = express();

app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",") }));
// Generous JSON limit so base64-encoded fridge photos can be sent as JSON too.
app.use(express.json({ limit: "15mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/fridge", fridgeRouter);
app.use("/api/recipes", recipesRouter);
app.use("/api/food", foodRouter);

app.use(errorHandler);

function start() {
  try {
    assertAnthropicConfigured();
  } catch (err) {
    console.warn(`[foodicted] Warning: ${(err as Error).message}`);
    console.warn("[foodicted] The server will start, but /api/fridge and /api/recipes will fail until it is set.");
  }
  console.log(`[notify] Usage email notifications ${isNotifyConfigured() ? "enabled" : "disabled (env vars not set)"}`);
  app.listen(config.port, () => {
    console.log(`Foodicted backend listening on http://localhost:${config.port}`);
  });
}

start();
