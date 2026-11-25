import type { Quote, AggregatedQuote } from './models';

export class QuoteAggregator {
  private STALE_THRESHOLD_MS = 30000; // 30 seconds

  aggregate(quotes: Quote[]): AggregatedQuote {
    if (quotes.length === 0) {
      throw new Error('Cannot aggregate empty quotes array');
    }

    if (quotes.length === 1) {
      return {
        assetId: quotes[0].assetId,
        price: quotes[0].price,
        sources: [quotes[0].source],
        confidence: 'medium',
      };
    }

    // Filter stale quotes
    const now = Date.now();
    const freshQuotes = quotes.filter(
      (q) => now - q.timestamp < this.STALE_THRESHOLD_MS,
    );

    if (freshQuotes.length === 0) {
      // All quotes are stale, use the most recent one
      const mostRecent = quotes.reduce((latest, current) =>
        current.timestamp > latest.timestamp ? current : latest,
      );
      return {
        assetId: mostRecent.assetId,
        price: mostRecent.price,
        sources: [mostRecent.source],
        confidence: 'low',
      };
    }

    if (freshQuotes.length === 1) {
      return {
        assetId: freshQuotes[0].assetId,
        price: freshQuotes[0].price,
        sources: [freshQuotes[0].source],
        confidence: 'medium',
      };
    }

    // Check for outliers (more than 5% difference from median)
    const prices = freshQuotes.map((q) => q.price).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    const outliers = freshQuotes.filter(
      (q) => Math.abs(q.price - median) / median > 0.05,
    );

    if (outliers.length > 0) {
      // Return the median value with conflict info
      return {
        assetId: freshQuotes[0].assetId,
        price: median,
        sources: freshQuotes.map((q) => q.source),
        confidence: 'conflict',
        conflict: {
          status: 'conflict',
          preferred: this.selectPreferredSource(freshQuotes, median),
        },
      };
    }

    // Calculate weighted average based on freshness
    const weights = freshQuotes.map((q) => {
      const age = now - q.timestamp;
      return Math.max(0, 1 - age / this.STALE_THRESHOLD_MS);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const weightedAverage =
      freshQuotes.reduce((sum, q, i) => sum + q.price * weights[i], 0) /
      totalWeight;

    return {
      assetId: freshQuotes[0].assetId,
      price: weightedAverage,
      sources: freshQuotes.map((q) => q.source),
      confidence: 'high',
    };
  }

  private selectPreferredSource(quotes: Quote[], median: number): string {
    // Prefer the quote closest to median with lowest latency
    const sorted = [...quotes].sort((a, b) => {
      const aDiff = Math.abs(a.price - median);
      const bDiff = Math.abs(b.price - median);
      if (aDiff !== bDiff) return aDiff - bDiff;
      return (a.latency || Infinity) - (b.latency || Infinity);
    });
    return sorted[0].source;
  }
}

export const quoteAggregator = new QuoteAggregator();
