export type CurrencyFormatOptions = {
  amount: number;
  currency?: string;
  locale?: string;
};

const fallbackLocaleByCurrency: Record<string, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
  CNY: "zh-CN",
  SGD: "en-SG",
  MYR: "ms-MY"
};

export function getUserCurrencyAndLocale(preferences: any): { currency: string; locale: string } {
  const prefs = preferences || {};
  const currencyRaw = typeof prefs.currency === "string" && prefs.currency.trim().length >= 3 ? prefs.currency.trim() : "USD";
  const currency = currencyRaw.toUpperCase().slice(0, 3);
  const language = typeof prefs.language === "string" && prefs.language.trim().length > 0 ? prefs.language.trim() : "en";

  const mappedLocale = fallbackLocaleByCurrency[currency];
  const locale = mappedLocale || `${language}-${language.toUpperCase()}`;

  return { currency, locale };
}

export function formatCurrency(options: CurrencyFormatOptions): string {
  const currency = (options.currency || "USD").toUpperCase();
  const locale = options.locale || fallbackLocaleByCurrency[currency] || "en-US";
  const amount = options.amount;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "symbol"
    }).format(amount);
  } catch {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    return `${currency} ${safeAmount.toLocaleString()}`;
  }
}

