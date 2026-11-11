import test from "node:test";
import assert from "node:assert/strict";
import { POST as ask } from "../app/api/assistant/route";
import { POST as board } from "../app/api/board/route";
const request = (data: unknown, origin = "https://quorail.test") =>
  new Request("https://quorail.test/api/assistant/", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(data),
  });
test("AI rejects cross-origin requests before provider access", async () => {
  assert.equal(
    (await ask(request({ question: "hello" }, "https://other.test"))).status,
    403,
  );
});
test("AI rejects oversized body", async () => {
  assert.equal(
    (await ask(request({ question: "x".repeat(9000) }))).status,
    400,
  );
});
test("AI fails closed without deployment credentials", async () => {
  const old = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    assert.equal(
      (await ask(request({ question: "Explain reserves" }))).status,
      503,
    );
  } finally {
    if (old) process.env.ANTHROPIC_API_KEY = old;
  }
});
test("shared API rejects invalid invite tokens", async () => {
  const r = await board(request({ action: "read", secret: "abc" }));
  assert.equal(r.status, 400);
});
test("AI sends approved context to Anthropic after quota check", async () => {
  const oldFetch = global.fetch;
  const old = { ...process.env };
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  process.env.ANTHROPIC_API_KEY = "test-key";
  process.env.UPSTASH_REDIS_REST_URL = "https://redis.test";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  global.fetch = async (input, init) => {
    calls.push({ url: String(input), body: JSON.parse(String(init?.body)) });
    return Response.json(
      String(input) === "https://redis.test"
        ? { result: 1 }
        : {
            content: [
              { type: "text", text: "Your reserve is a planning target." },
            ],
          },
    );
  };
  try {
    const r = await ask(request({ question: "Explain reserves" }));
    assert.equal(r.status, 200);
    assert.equal(calls.length, 2);
    assert.equal(calls[1].url, "https://api.anthropic.com/v1/messages");
    assert.equal(calls[1].body.max_tokens, 650);
    assert.ok(!JSON.stringify(await r.json()).includes("test-key"));
  } finally {
    global.fetch = oldFetch;
    for (const k of [
      "ANTHROPIC_API_KEY",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
    ]) {
      if (old[k] === undefined) delete process.env[k];
      else process.env[k] = old[k];
    }
  }
});

test("reverse-proxy host is used while foreign origins remain rejected", async () => {
  const { sameOrigin } = await import("../lib/request-origin");
  assert.equal(
    sameOrigin(
      new Request("http://0.0.0.0:4173/api/assistant", {
        headers: { host: "127.0.0.1:4173", origin: "http://127.0.0.1:4173" },
      }),
    ),
    true,
  );
  assert.equal(
    sameOrigin(
      new Request("http://0.0.0.0:4173/api/assistant", {
        headers: { host: "127.0.0.1:4173", origin: "https://evil.test" },
      }),
    ),
    false,
  );
});

test("unclaimed shared row cannot accept a submitted hash", async () => {
  const previousFetch = global.fetch;
  const oldUrl = process.env.UPSTASH_REDIS_REST_URL;
  const oldToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = "https://redis.test";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test";
  global.fetch = async () =>
    Response.json({
      result: JSON.stringify({ rows: [{ id: "1", state: "open" }] }),
    });
  try {
    const response = await board(
      request({
        action: "submit",
        secret: "a".repeat(64),
        row: "1",
        hash: "b".repeat(64),
      }),
    );
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /Invalid payment attempt/);
  } finally {
    global.fetch = previousFetch;
    if (oldUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = oldUrl;
    if (oldToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = oldToken;
  }
});
