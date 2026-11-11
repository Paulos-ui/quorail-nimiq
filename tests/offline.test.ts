import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
function harness(raw: string) {
  class Element {
    value = "";
    textContent = "";
    hidden = true;
    children: Element[] = [];
    listeners: Record<string, () => void> = {};
    href = "";
    download = "";
    get options() {
      return [new Element(), ...this.children];
    }
    append(e: Element) {
      this.children.push(e);
    }
    replaceChildren() {
      this.children = [];
    }
    addEventListener(name: string, fn: () => void) {
      this.listeners[name] = fn;
    }
    click() {
      this.listeners.click?.();
    }
  }
  const ids = Object.fromEntries(
    ["plans", "status", "details", "rows", "reserve", "export"].map((id) => [
      id,
      new Element(),
    ]),
  );
  const key = "quorail-nimiq:v1:mainnet:NQEXAMPLE";
  let blob: Blob | undefined;
  runInNewContext(
    readFileSync(new URL("../public/offline.js", import.meta.url), "utf8"),
    {
      document: {
        getElementById: (id: string) => ids[id],
        createElement: () => new Element(),
      },
      localStorage: {
        length: 2,
        key: (i: number) => (i ? key + ":last-export" : key),
        getItem: () => raw,
      },
      Intl,
      JSON,
      Number,
      Array,
      Blob,
      setTimeout: (fn: () => void) => fn(),
      URL: {
        createObjectURL: (b: Blob) => {
          blob = b;
          return "blob:test";
        },
        revokeObjectURL: () => {},
      },
    },
  );
  return { ids, key, getBlob: () => blob };
}
test("offline viewer excludes metadata, renders hostile labels as text and exports recoverable JSON", async () => {
  const plan = {
    version: 1,
    reserve: 200000,
    horizon: 30,
    payments: [
      {
        title: "<img onerror=alert(1)>",
        due: "2026-12-01",
        status: "pending",
        amount: 100000,
      },
    ],
  };
  const { ids, key, getBlob } = harness(JSON.stringify(plan));
  assert.equal(ids.plans.children.length, 1);
  ids.plans.value = key;
  ids.plans.listeners.change();
  assert.equal(ids.details.hidden, false);
  assert.match(ids.rows.children[0].textContent, /<img onerror=alert\(1\)>/);
  ids.export.click();
  assert.deepEqual(JSON.parse(await getBlob()!.text()), {
    network: "mainnet",
    address: "NQEXAMPLE",
    plan,
  });
});
test("offline viewer hides malformed local records without changing storage", () => {
  const { ids, key, getBlob } = harness("{broken");
  ids.plans.value = key;
  ids.plans.listeners.change();
  assert.equal(ids.details.hidden, true);
  assert.match(ids.status.textContent, /cannot be displayed safely/);
  ids.export.click();
  assert.equal(getBlob(), undefined);
});
