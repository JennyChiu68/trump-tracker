const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const zlib = require("node:zlib");

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = __dirname;
const RELEASE_FILE = path.join(ROOT, "data", "release-feed.json");
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};
const securityHeaders = {
  "content-security-policy": "default-src 'self'; connect-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN",
};

const releasePayload = readReleasePayload();
const apiBody = Buffer.from(JSON.stringify(releasePayload));
const apiEntity = prepareEntity(apiBody);

const server = http.createServer((request, response) => {
  Promise.resolve(handleRequest(request, response)).catch((error) => {
    console.error(error);
    if (response.headersSent) response.destroy();
    else sendText(response, 500, "Service unavailable", "no-store");
  });
});

server.listen(PORT, HOST, () => {
  const address = server.address();
  console.log(`Trump tracker: http://${HOST}:${address.port}`);
});

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);
  if (!new Set(["GET", "HEAD"]).has(request.method)) {
    response.setHeader("allow", "GET, HEAD");
    sendText(response, 405, "Method not allowed", "no-store", request.method === "HEAD");
    return;
  }

  if (url.pathname === "/healthz") {
    sendJson(request, response, Buffer.from(JSON.stringify({ ok: true, generatedAt: releasePayload.generatedAt })), "no-store");
    return;
  }
  if (url.pathname === "/api/trump-feed" || url.pathname === "/api/trump-insights") {
    sendPreparedEntity(request, response, apiEntity, "application/json; charset=utf-8", "public, max-age=300, stale-while-revalidate=3600");
    return;
  }

  const filePath = resolveFile(url.pathname);
  if (!filePath) {
    sendText(response, 404, "Not found", "no-store", request.method === "HEAD");
    return;
  }
  const body = await fs.promises.readFile(filePath);
  const extension = path.extname(filePath);
  const isHtml = extension === ".html";
  const isVersioned = url.searchParams.has("v");
  const cacheControl = isHtml ? "no-cache" : isVersioned ? "public, max-age=31536000, immutable" : "public, max-age=3600";
  sendPreparedEntity(request, response, prepareEntity(body), mimeTypes[extension] || "application/octet-stream", cacheControl);
}

function readReleasePayload() {
  try {
    return JSON.parse(fs.readFileSync(RELEASE_FILE, "utf8"));
  } catch (error) {
    throw new Error(`Unable to load release snapshot: ${error.message}`);
  }
}

function resolveFile(pathname) {
  try {
    const decoded = decodeURIComponent(pathname);
    const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
    const filePath = path.resolve(ROOT, relative);
    if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) return null;
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
    return filePath;
  } catch {
    return null;
  }
}

function prepareEntity(body) {
  return {
    identity: body,
    gzip: zlib.gzipSync(body, { level: zlib.constants.Z_BEST_SPEED }),
    etag: `"${crypto.createHash("sha256").update(body).digest("base64url").slice(0, 20)}"`,
  };
}

function sendJson(request, response, body, cacheControl) {
  sendPreparedEntity(request, response, prepareEntity(body), "application/json; charset=utf-8", cacheControl);
}

function sendPreparedEntity(request, response, entity, contentType, cacheControl) {
  const headers = {
    ...securityHeaders,
    "cache-control": cacheControl,
    "content-type": contentType,
    etag: entity.etag,
    vary: "Accept-Encoding",
  };
  if (request.headers["if-none-match"] === entity.etag) {
    response.writeHead(304, headers);
    response.end();
    return;
  }

  const acceptsGzip = /(?:^|,)\s*gzip\s*(?:,|$)/i.test(request.headers["accept-encoding"] || "");
  const body = acceptsGzip ? entity.gzip : entity.identity;
  if (acceptsGzip) headers["content-encoding"] = "gzip";
  headers["content-length"] = body.length;
  response.writeHead(200, headers);
  response.end(request.method === "HEAD" ? undefined : body);
}

function sendText(response, status, value, cacheControl, headOnly = false) {
  const body = Buffer.from(value);
  response.writeHead(status, {
    ...securityHeaders,
    "cache-control": cacheControl,
    "content-length": body.length,
    "content-type": "text/plain; charset=utf-8",
  });
  response.end(headOnly ? undefined : body);
}
