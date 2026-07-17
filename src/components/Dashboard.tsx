import { useCallback, useState } from "react";
import Header from "./Header";
import MarketItemsList from "./MarketItemsList";
import MarketItemsGraph from "./MarketItemsGraph";
import MarketsLoaderStatus from "./MarketsLoaderStatus";
import { useMarketData } from "@/hooks/useMarketData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { DataSourceMode } from "@/types/market";

interface DashboardProps {
  hideSpinner: () => void;
  showSpinner: boolean;
}

function Dashboard({ hideSpinner, showSpinner }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("markets");
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>("websocket");
  const {
    quotes,
    marketTrend,
    connectionError,
    areMarketsLoaded,
    toggleItemSelection,
    resetData,
    connectionHealth,
  } = useMarketData(hideSpinner, dataSourceMode);

  const handleResetData = useCallback<
    React.MouseEventHandler<HTMLButtonElement>
  >(() => {
    resetData();
  }, [resetData]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 min-h-screen">
      <Header
        connectionHealth={connectionHealth}
        dataSourceMode={dataSourceMode}
        onDataSourceModeChange={setDataSourceMode}
      />
      {connectionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            Unable to connect to market data servers. Some data sources may be unavailable. Check your internet connection or try again later.
          </AlertDescription>
        </Alert>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="lg:hidden">
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
          <MarketItemsGraph quotes={quotes} />
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
          <MarketItemsGraph quotes={quotes} />
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
