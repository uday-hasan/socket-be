import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env, isProduction } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { createWebSocketServer } from "./ws/server.js";
import router from "./routes/index.js";
import { logger } from "./config/logger.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

const app = express();
const server = http.createServer(app);
app.set("trust proxy", 1);

app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((o) =>
        o.trim(),
      );

      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true, // Required for cookies to be sent cross-origin
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(cookieParser(env.COOKIE_SECRET));
const { wss, broadcastToChannel, broadcastToAll } =
  createWebSocketServer(server);

app.locals.wss = wss;
app.locals.broadcastToChannel = broadcastToChannel;
app.locals.broadcastToAll = broadcastToAll;

app.use("/api/v1", router);

app.use(errorHandler);

if (!isProduction) {
  app.use(
    `/api/v1/docs`,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        requestInterceptor: (req: any) => {
          req.credentials = "include"; // Force fetch to include cookies
          return req;
        },
        persistAuthorization: true,
      },
    }),
  );
}

server.listen(Number(env.PORT), () => {
  logger.info(`Server is running on port ${env.PORT}`);
});
