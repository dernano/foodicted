import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  const message = err instanceof Error ? err.message : "Unexpected server error";
  const status = typeof (err as { status?: number })?.status === "number" ? (err as { status: number }).status : 500;
  res.status(status).json({ error: message });
};
