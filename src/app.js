import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();
import healthcheckRouter from "./routes/healthcheck.routes.js";

app.use("/api/v1/healthcheck", healthcheckRouter);

// basic configurations
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// cors configurations
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// routes
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/instagram', (req, res) => {
  res.send('Hello World! from instagram but from app.js')
})
export default app;