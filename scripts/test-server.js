#!/usr/bin/env node

const { spawn } = require("node:child_process");

async function main() {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, HOST: "127.0.0.1", PORT: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    const origin = await waitForOrigin(child);
    const health = await fetch(`${origin}/healthz`);
    assert(health.ok, "health check failed");
    assert((await health.json()).ok === true, "health payload failed");

    const api = await fetch(`${origin}/api/trump-feed`, { headers: { "accept-encoding": "gzip" } });
    const payload = await api.json();
    assert(api.ok && payload.items.length >= 100, "release API payload is incomplete");
    assert(api.headers.get("content-security-policy")?.includes("script-src 'self'"), "CSP header missing");
    assert(api.headers.get("x-content-type-options") === "nosniff", "nosniff header missing");
    assert(api.headers.get("etag"), "ETag missing");
    assert(api.headers.get("cache-control")?.includes("max-age"), "cache policy missing");

    const cached = await fetch(`${origin}/api/trump-feed`, { headers: { "if-none-match": api.headers.get("etag") } });
    assert(cached.status === 304, "conditional request did not return 304");

    const page = await fetch(`${origin}/`);
    const html = await page.text();
    assert(html.includes("bootstrap.js") && !html.includes('src="./snapshot.js'), "HTTP page still eagerly loads the offline snapshot");

    const head = await fetch(`${origin}/app.js`, { method: "HEAD" });
    assert(head.ok && (await head.text()) === "", "HEAD request returned a body");
    const post = await fetch(`${origin}/api/trump-feed`, { method: "POST" });
    assert(post.status === 405, "unsupported method was not rejected");

    console.log(JSON.stringify({ status: "pass", items: payload.items.length, csp: true, etag: true, cache: true }));
  } finally {
    child.kill("SIGTERM");
  }
}

function waitForOrigin(child) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("server start timed out")), 5000);
    child.once("error", reject);
    child.stderr.on("data", (chunk) => process.stderr.write(chunk));
    child.stdout.on("data", (chunk) => {
      const match = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);
      if (!match) return;
      clearTimeout(timeout);
      resolve(match[0]);
    });
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
