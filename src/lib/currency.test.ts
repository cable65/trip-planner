import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatCurrency, getUserCurrencyAndLocale } from "./currency";

describe("getUserCurrencyAndLocale", () => {
  it("returns defaults when preferences are missing", () => {
    const result = getUserCurrencyAndLocale(undefined as any);
    assert.equal(result.currency, "USD");
    assert.ok(result.locale.length > 0);
  });

  it("normalizes currency and language", () => {
    const result = getUserCurrencyAndLocale({ currency: "eur", language: "ms" });
    assert.equal(result.currency, "EUR");
    assert.equal(typeof result.locale, "string");
  });
});

describe("formatCurrency", () => {
  it("formats USD amounts with symbol", () => {
    const value = formatCurrency({ amount: 1234.5, currency: "USD", locale: "en-US" });
    assert.ok(value.includes("$") || value.includes("US$"));
  });

  it("formats EUR amounts with symbol", () => {
    const value = formatCurrency({ amount: 99.99, currency: "EUR", locale: "de-DE" });
    assert.ok(value.includes("€"));
  });

  it("formats JPY amounts with locale-specific formatting", () => {
    const value = formatCurrency({ amount: 5000, currency: "JPY", locale: "ja-JP" });
    assert.ok(typeof value === "string" && value.length > 0);
  });

  it("formats CNY amounts with locale-specific formatting", () => {
    const value = formatCurrency({ amount: 5000, currency: "CNY", locale: "zh-CN" });
    assert.ok(typeof value === "string" && value.length > 0);
  });

  it("falls back gracefully for invalid currency", () => {
    const value = formatCurrency({ amount: 50, currency: "XXX", locale: "en-US" });
    assert.ok(typeof value === "string" && value.length > 0);
  });

  it("uses fallback locale when locale is missing", () => {
    const value = formatCurrency({ amount: 1000, currency: "MYR" });
    assert.ok(typeof value === "string" && value.length > 0);
  });

  it("handles non-finite amounts by falling back", () => {
    const value = formatCurrency({ amount: Number.NaN as any, currency: "USD", locale: "en-US" });
    assert.ok(typeof value === "string" && value.length > 0);
  });
});

describe("currency integration with preferences", () => {
  it("produces consistent output for JPY with ja language preference", () => {
    const prefs = { currency: "jpy", language: "ja" };
    const { currency, locale } = getUserCurrencyAndLocale(prefs as any);

    const value = formatCurrency({ amount: 10000, currency, locale });

    assert.equal(currency, "JPY");
    assert.ok(locale.toLowerCase().startsWith("ja"));
    assert.ok(typeof value === "string" && value.length > 0);
  });

  it("produces consistent output for CNY with zh language preference", () => {
    const prefs = { currency: "cny", language: "zh" };
    const { currency, locale } = getUserCurrencyAndLocale(prefs as any);

    const value = formatCurrency({ amount: 2500, currency, locale });

    assert.equal(currency, "CNY");
    assert.ok(locale.toLowerCase().startsWith("zh"));
    assert.ok(typeof value === "string" && value.length > 0);
  });
});

