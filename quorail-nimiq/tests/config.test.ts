import test from "node:test";
import assert from "node:assert/strict";
import { redisConfig } from "../lib/server-config";
test("Vercel KV REST aliases are accepted", () =>
  assert.deepEqual(
    redisConfig({
      KV_REST_API_URL: " https://redis.test ",
      KV_REST_API_TOKEN: " token ",
    }),
    { url: "https://redis.test", token: "token" },
  ));
test("complete Upstash pair takes precedence", () =>
  assert.deepEqual(
    redisConfig({
      UPSTASH_REDIS_REST_URL: "https://a.test",
      UPSTASH_REDIS_REST_TOKEN: "a",
      KV_REST_API_URL: "https://b.test",
      KV_REST_API_TOKEN: "b",
    }),
    { url: "https://a.test", token: "a" },
  ));
test("credentials are never mixed across prefixes", () =>
  assert.equal(
    redisConfig({
      UPSTASH_REDIS_REST_URL: "https://a.test",
      KV_REST_API_TOKEN: "b",
    }),
    null,
  ));
test("incomplete Upstash pair allows a complete KV pair", () =>
  assert.deepEqual(
    redisConfig({
      UPSTASH_REDIS_REST_URL: "https://a.test",
      KV_REST_API_URL: "https://b.test",
      KV_REST_API_TOKEN: "b",
    }),
    { url: "https://b.test", token: "b" },
  ));
