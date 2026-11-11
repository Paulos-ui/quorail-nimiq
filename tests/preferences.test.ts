import { test } from "node:test";
import assert from "node:assert/strict";
import { translate, translations } from "../lib/translations";
test("all supported languages have complete primary-control dictionaries", () => {
  const keys = Object.keys(translations.en).sort();
  for (const language of ["es", "de", "fr"] as const) {
    assert.deepEqual(Object.keys(translations[language]).sort(), keys);
    for (const value of Object.values(translations[language]))
      assert.ok(value.trim().length > 0);
  }
});
test("unknown technical messages and user-entered values are never silently rewritten", () => {
  assert.equal(
    translate("es", "NQ72FPVL2DSPNM1789NBRSC8PXD8EJB82J66"),
    "NQ72FPVL2DSPNM1789NBRSC8PXD8EJB82J66",
  );
  assert.equal(translate("de", "0.5"), "0.5");
  assert.equal(translate("fr", "Payments"), "Paiements");
  assert.equal(translate("en", "Payments"), "Payments");
});
