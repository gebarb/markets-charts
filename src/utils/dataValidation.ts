import type { EodHistoricalMessage, CoinbaseMessage } from "@/types/market";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedData?: {
    ticker: string;
    value: number;
  };
}

export function validateMarketMessage(
  raw: string
): ValidationResult {
  try {
    const result = JSON.parse(raw) as EodHistoricalMessage | CoinbaseMessage;

    // Validate EOD Historical Data format
    if ("s" in result || ("p" in result && !("product_id" in result))) {
      const ticker = result.s;
      const val = result.p ?? result.a;

      if (!ticker || typeof ticker !== "string") {
        return { isValid: false, error: "Invalid or missing ticker" };
      }

      if (val == null || typeof val !== "number") {
        return { isValid: false, error: "Invalid or missing value" };
      }

      if (isNaN(val)) {
        return { isValid: false, error: "Value is Nano" };
      }

      // Check for reasonable price range (sanity check)
      if (val < 0 || val > 1000000) {
        return { isValid: false, error: "Value out of reasonable range" };
      }

      return {
        isValid: true,
        sanitizedData: { ticker, value: Number(val) },
      };
    }

    // Validate Coinbase format
    if ("product_id" in result || "price" in result) {
      const ticker = result.product_id;
      const val = result.price ? parseFloat(result.price) : undefined;

      if (!ticker || typeof ticker !== "string") {
        return { isValid: false, error: "Invalid or missing ticker" };
      }

      if (val == null || isNaN(val)) {
        return { isValid: false, error: "Invalid or missing value" };
      }

      // Check for reasonable price range (sanity check)
      if (val < 0 || val > 1000000) {
        return { isValid: false, error: "Value out of reasonable range" };
      }

      return {
        isValid: true,
        sanitizedData: { ticker, value: val },
      };
    }

    return { isValid: false, error: "Unknown message format" };
  } catch {
    return { isValid: false, error: "Failed to parse JSON" };
  }
}

export function detectAnomaly(
  currentValue: number,
  previousValue: number,
  threshold: number = 0.5
): boolean {
  const change = Math.abs((currentValue - previousValue) / previousValue);
  return change > threshold;
}

export function deduplicateData(
  dataPoints: { timestamp: number; value: number }[],
  maxPoints: number = 500
): { timestamp: number; value: number }[] {
  // Remove duplicate timestamps, keeping the most recent value
  const uniqueMap = new Map<number, number>();
  
  for (const point of dataPoints) {
    uniqueMap.set(point.timestamp, point.value);
  }

  const deduplicated = Array.from(uniqueMap.entries())
    .map(([timestamp, value]) => ({ timestamp, value }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Trim to max points if needed
  if (deduplicated.length > maxPoints) {
    return deduplicated.slice(-maxPoints);
  }

  return deduplicated;
}
