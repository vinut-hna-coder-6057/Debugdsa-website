import { randomUUID } from "node:crypto";

function getNormalizedPath(req) {
  const routePath = req.route?.path;
  if (typeof routePath !== "string") return "/unmatched";

  const path = `${req.baseUrl || ""}/${routePath}`
    .replace(/\/+/g, "/")
    .replace(/\/$/, "");
  return path || "/";
}

export function requestObservability({ log = console.info } = {}) {
  return (req, res, next) => {
    const requestId = randomUUID();
    const startedAt = Date.now();
    let logged = false;

    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);

    const logRequest = (status) => {
      if (logged) return;
      logged = true;
      const method = /^[A-Z]{1,16}$/.test(req.method) ? req.method : "OTHER";
      log(JSON.stringify({
        event: "http.request",
        requestId,
        method,
        path: getNormalizedPath(req),
        status,
        durationMs: Math.max(0, Date.now() - startedAt),
      }));
    };

    res.once("finish", () => logRequest(res.statusCode));
    res.once("close", () => {
      if (!res.writableFinished) logRequest(499);
    });

    next();
  };
}
