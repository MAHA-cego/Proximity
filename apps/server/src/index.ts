import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { handleHttpRequest } from "./http-handler";
import { handleWsConnection } from "./ws-handler";

const PORT = Number(process.env["PORT"] ?? "3001");

const server = createServer((req, res) => {
  const start = Date.now();
  handleHttpRequest(req, res)
    .then(() => {
      console.log(
        `[http] ${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`,
      );
    })
    .catch((err: unknown) => {
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

function shutdown(signal: string): void {
  console.log(`[server] ${signal} received, shutting down`);
  wss.close();
  server.close(() => {
    console.log("[server] closed");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("[server] forced exit after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
process.on("SIGINT", () => {
  shutdown("SIGINT");
});
