import { useCallback, useState, useEffect, lazy, Suspense } from 'react';
import Header from './Header';
import MarketItemsList from './MarketItemsList';
import MarketsLoaderStatus from './MarketsLoaderStatus';
import { useMarketDataService } from '@/hooks/useMarketDataService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MarketItemsGraph = lazy(() => import('./MarketItemsGraph'));

interface DashboardProps {
  hideSpinner: () => void;
  showSpinner: boolean;
}

function Dashboard({ hideSpinner, showSpinner }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('markets');

  const {
    quotes,
    marketTrend,
    connectionError,
    areMarketsLoaded,
    toggleItemSelection,
    resetData,
    connectionHealth,
  } = useMarketDataService();

  const handleResetData = useCallback<
    React.MouseEventHandler<HTMLButtonElement>
  >(() => {
    resetData();
  }, [resetData]);

  // Hide spinner when markets are loaded
  useEffect(() => {
    if (areMarketsLoaded && showSpinner) {
      hideSpinner();
    }
  }, [areMarketsLoaded, showSpinner, hideSpinner]);

  const renderGraph = () => (
    <Suspense
      fallback={
        <div className="flex min-h-64 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        </div>
      }
    >
      <MarketItemsGraph quotes={quotes} />
    </Suspense>
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 min-h-screen">
      <Header connectionHealth={connectionHealth} />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="lg:hidden"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="chart">Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="markets" className="mt-4">
          <MarketItemsList
            quotes={quotes}
            toggleItemSelection={toggleItemSelection}
            resetData={handleResetData}
            market_trend={marketTrend}
            areMarketsLoaded={() => areMarketsLoaded}
          />
        </TabsContent>

        <TabsContent value="chart" className="mt-4">
          {renderGraph()}
        </TabsContent>
      </Tabs>

      <div className="hidden lg:flex lg:flex-col lg:gap-4">
        <div className="flex flex-col gap-4 md:flex-row lg:flex-row">
          <MarketItemsList
            quotes={quotes}
            toggleItemSelection={toggleItemSelection}
            resetData={handleResetData}
            market_trend={marketTrend}
            areMarketsLoaded={() => areMarketsLoaded}
          />

          {renderGraph()}
        </div>
      </div>

      {showSpinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-lg bg-card p-8 shadow-lg">
            <MarketsLoaderStatus connectionError={connectionError} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
