export type AssetType =
  'stock' | 'etf' | 'crypto' | 'metal' | 'forex' | 'index';

export type MarketType = 'spot' | 'future' | 'equity';

export interface Instrument {
  provider: string;
  symbol: string;
  marketType: MarketType;
}

export interface Asset {
  id: string;
  displayName: string;
  type: AssetType;
  instruments: Instrument[];
}
