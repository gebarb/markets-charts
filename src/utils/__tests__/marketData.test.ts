import { describe, it, expect } from 'vitest';
import {
  isEodHistoricalMessage,
  isCoinbaseMessage,
  parseMarketMessage,
  calculateMarketTrend,
  toggleQuoteSelection,
  resetQuoteHistory,
} from '../marketData';
import type { QuotesMap } from '@/types/market';

describe('marketData', () => {
  describe('isEodHistoricalMessage', () => {
    it('should identify EOD Historical Data messages', () => {
      const msg = { s: 'AAPL', p: 150.25 };
      expect(isEodHistoricalMessage(msg)).toBe(true);
    });

    it('should identify EOD messages with "a" field', () => {
      const msg = { s: 'AAPL', a: 150.25 };
      expect(isEodHistoricalMessage(msg)).toBe(true);
    });

    it('should reject Coinbase messages', () => {
      const msg = { product_id: 'ETH-USD', price: '2500.50' };
      expect(isEodHistoricalMessage(msg)).toBe(false);
    });
  });

  describe('isCoinbaseMessage', () => {
    it('should identify Coinbase messages', () => {
      const msg = { product_id: 'ETH-USD', price: '2500.50' };
      expect(isCoinbaseMessage(msg)).toBe(true);
    });

    it('should identify Coinbase messages with price field', () => {
      const msg = { price: '2500.50' };
      expect(isCoinbaseMessage(msg)).toBe(true);
    });

    it('should reject EOD messages', () => {
      const msg = { s: 'AAPL', p: 150.25 };
      expect(isCoinbaseMessage(msg)).toBe(false);
    });
  });

  describe('parseMarketMessage', () => {
    it('should parse EOD Historical Data message', () => {
      const raw = JSON.stringify({ s: 'AAPL', p: 150.25 });
      const result = parseMarketMessage(raw);
      
      expect(result).toEqual({ ticker: 'AAPL', value: 150.25 });
    });

    it('should parse Coinbase message', () => {
      const raw = JSON.stringify({ product_id: 'ETH-USD', price: '2500.50' });
      const result = parseMarketMessage(raw);
      
      expect(result).toEqual({ ticker: 'ETH-USD', value: 2500.50 });
    });

    it('should return null for invalid JSON', () => {
      const result = parseMarketMessage('invalid');
      
      expect(result).toBeNull();
    });

    it('should return null for message without valid data', () => {
      const raw = JSON.stringify({ type: 'heartbeat' });
      const result = parseMarketMessage(raw);
      
      expect(result).toBeNull();
    });
  });

  describe('calculateMarketTrend', () => {
    it('should return up when up count is higher', () => {
      expect(calculateMarketTrend(10, 5)).toBe('up');
    });

    it('should return down when down count is higher', () => {
      expect(calculateMarketTrend(5, 10)).toBe('down');
    });

    it('should return undefined when counts are equal', () => {
      expect(calculateMarketTrend(5, 5)).toBeUndefined();
    });
  });

  describe('toggleQuoteSelection', () => {
    it('should toggle selection from false to true', () => {
      const quotes: QuotesMap = {
        AAPL: {
          current_value: 150,
          history: [{ time: 1, value: 150 }],
          is_selected: false,
        },
      };
      
      const result = toggleQuoteSelection(quotes, 'AAPL');
      
      expect(result.AAPL.is_selected).toBe(true);
    });

    it('should toggle selection from true to false', () => {
      const quotes: QuotesMap = {
        AAPL: {
          current_value: 150,
          history: [{ time: 1, value: 150 }],
          is_selected: true,
        },
      };
      
      const result = toggleQuoteSelection(quotes, 'AAPL');
      
      expect(result.AAPL.is_selected).toBe(false);
    });
  });

  describe('resetQuoteHistory', () => {
    it('should reset history to last point', () => {
      const quotes: QuotesMap = {
        AAPL: {
          current_value: 150,
          history: [
            { time: 1, value: 140 },
            { time: 2, value: 145 },
            { time: 3, value: 150 },
          ],
          is_selected: false,
        },
      };
      
      const result = resetQuoteHistory(quotes);
      
      expect(result.AAPL.history).toHaveLength(1);
      expect(result.AAPL.history[0].value).toBe(150);
    });

    it('should handle empty history', () => {
      const quotes: QuotesMap = {
        AAPL: {
          current_value: 150,
          history: [],
          is_selected: false,
        },
      };
      
      const result = resetQuoteHistory(quotes);
      
      expect(result.AAPL.history).toHaveLength(0);
    });
  });
});
