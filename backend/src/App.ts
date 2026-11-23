import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import authMiddleware from "./middlewares/auth.middleware.js";
import bookRoutes from "./routes/book.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origem não autorizada pelo CORS."));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use(
  "/api/users",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }),
  userRoutes,
);
app.use("/api/books", authMiddleware, bookRoutes);

export { app };
export default app;
