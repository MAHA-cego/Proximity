import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { handleHttpRequest } from "./http-handler.js";
import { handleWsConnection } from "./ws-handler.js";

const PORT = Number(process.env["PORT"] ?? "3001");

const server = createServer((req, res) => {
  handleHttpRequest(req, res).catch((err: unknown) => {
    console.error("[http] unhandled error", err);
    res.writeHead(500);
    res.end();
  });
});

const wss = new WebSocketServer({ server });
wss.on("connection", handleWsConnection);

server.listen(PORT, () => {
  console.log(`[server] listening on :${PORT}`);
});
