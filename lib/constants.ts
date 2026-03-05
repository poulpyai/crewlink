// Authority color mapping for consistent badges across the site
export const AUTHORITY_COLORS: Record<string, { bg: string; text: string }> = {
  "EASA": { bg: "bg-blue-500/20", text: "text-blue-400" },
  "CAA-UK": { bg: "bg-purple-500/20", text: "text-purple-400" },
  "FAA": { bg: "bg-green-500/20", text: "text-green-400" },
  "Transport Canada": { bg: "bg-red-500/20", text: "text-red-400" },
  "CAAS": { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  "CASA": { bg: "bg-orange-500/20", text: "text-orange-400" },
  "HKCAD": { bg: "bg-pink-500/20", text: "text-pink-400" },
  "GCAA": { bg: "bg-teal-500/20", text: "text-teal-400" },
  "GACA": { bg: "bg-cyan-500/20", text: "text-cyan-400" },
  "JCAB": { bg: "bg-indigo-500/20", text: "text-indigo-400" },
  "DGCA": { bg: "bg-violet-500/20", text: "text-violet-400" },
  "CAAC": { bg: "bg-rose-500/20", text: "text-rose-400" },
  "ANAC": { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  "SACAA": { bg: "bg-amber-500/20", text: "text-amber-400" },
  "ICAO": { bg: "bg-sky-500/20", text: "text-sky-400" },
};

export function getAuthorityColor(authority: string) {
  return AUTHORITY_COLORS[authority] || { bg: "bg-neutral-800", text: "text-neutral-400" };
}

// Currency settings
export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
] as const;

export const DEFAULT_CURRENCY = "USD";

// Get currency symbol
export function getCurrencySymbol(code: string = DEFAULT_CURRENCY): string {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency?.symbol || "$";
}
