import express from "express";
import http from "http";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { createWebSocketServer } from "./ws/server.js";
import router from "./routes/index.js";

const app = express();
const server = http.createServer(app);
app.set("trust proxy", 1);

app.use(express.json());
app.use(cors());

const { wss } = createWebSocketServer(server);

app.locals.wss = wss;

app.use("/api/v1", router);

app.use(errorHandler);

server.listen(Number(env.PORT), () => {
  console.log(`Server is running on port ${env.PORT}`);
});
