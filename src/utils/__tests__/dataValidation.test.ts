import { describe, it, expect } from 'vitest';
import {
  validateMarketMessage,
  detectAnomaly,
  deduplicateData,
} from '../dataValidation';

describe('dataValidation', () => {
  describe('validateMarketMessage', () => {
    it('should validate EOD Historical Data message', () => {
      const message = JSON.stringify({ s: 'AAPL', p: 150.25 });
      const result = validateMarketMessage(message);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData).toEqual({ ticker: 'AAPL', value: 150.25 });
    });

    it('should validate Coinbase message', () => {
      const message = JSON.stringify({ product_id: 'ETH-USD', price: '2500.50' });
      const result = validateMarketMessage(message);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData).toEqual({ ticker: 'ETH-USD', value: 2500.50 });
    });

    it('should reject invalid JSON', () => {
      const result = validateMarketMessage('invalid json');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Failed to parse JSON');
    });

    it('should reject message with missing ticker', () => {
      const message = JSON.stringify({ p: 150.25 });
      const result = validateMarketMessage(message);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid or missing ticker');
    });

    it('should reject message with missing value', () => {
      const message = JSON.stringify({ s: 'AAPL' });
      const result = validateMarketMessage(message);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid or missing value');
    });

    it('should reject message with NaN value', () => {
      const message = JSON.stringify({ s: 'AAPL', p: 'invalid' });
      const result = validateMarketMessage(message);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid or missing value');
    });

    it('should reject message with value out of reasonable range', () => {
      const message = JSON.stringify({ s: 'AAPL', p: -100 });
      const result = validateMarketMessage(message);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value out of reasonable range');
    });
  });

  describe('detectAnomaly', () => {
    it('should detect price spike above threshold', () => {
      const result = detectAnomaly(150, 100, 0.4);
      
      expect(result).toBe(true);
    });

    it('should not detect normal price change', () => {
      const result = detectAnomaly(105, 100, 0.5);
      
      expect(result).toBe(false);
    });

    it('should use default threshold when not provided', () => {
      const result = detectAnomaly(160, 100);
      
      expect(result).toBe(true);
    });
  });

  describe('deduplicateData', () => {
    it('should remove duplicate timestamps', () => {
      const data = [
        { timestamp: 1, value: 100 },
        { timestamp: 2, value: 105 },
        { timestamp: 2, value: 110 },
        { timestamp: 3, value: 115 },
      ];
      
      const result = deduplicateData(data);
      
      expect(result).toHaveLength(3);
      expect(result[1].value).toBe(110); // Most recent value for timestamp 2
    });

    it('should sort by timestamp', () => {
      const data = [
        { timestamp: 3, value: 115 },
        { timestamp: 1, value: 100 },
        { timestamp: 2, value: 105 },
      ];
      
      const result = deduplicateData(data);
      
      expect(result[0].timestamp).toBe(1);
      expect(result[1].timestamp).toBe(2);
      expect(result[2].timestamp).toBe(3);
    });

    it('should limit to max points', () => {
      const data = Array.from({ length: 600 }, (_, i) => ({
        timestamp: i,
        value: i * 10,
      }));
      
      const result = deduplicateData(data, 500);
      
      expect(result).toHaveLength(500);
    });

    it('should return empty array for empty input', () => {
      const result = deduplicateData([]);
      
      expect(result).toHaveLength(0);
    });
  });
});
