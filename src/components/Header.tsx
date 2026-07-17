import { Detector } from "react-detect-offline";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import DataSourceToggle from "./DataSourceToggle";
import type { DataSourceMode } from "@/types/market";

interface HeaderProps {
  connectionHealth?: "healthy" | "degraded" | "unhealthy";
  dataSourceMode?: DataSourceMode;
  onDataSourceModeChange?: (mode: DataSourceMode) => void;
}

function Header({
  connectionHealth = "healthy",
  dataSourceMode = "websocket",
  onDataSourceModeChange,
}: HeaderProps) {
  const getHealthBadge = () => {
    if (connectionHealth === "healthy") {
      return <Badge variant="default" className="text-xs bg-green-600">Healthy</Badge>;
    } else if (connectionHealth === "degraded") {
      return <Badge variant="secondary" className="text-xs bg-yellow-600">Degraded</Badge>;
    } else {
      return <Badge variant="destructive" className="text-xs">Unhealthy</Badge>;
    }
  };

  return (
    <Card className="mb-4 border-0 bg-transparent shadow-none">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            Markets Charts
          </h1>
          <Detector
            render={({ online }: { online: boolean }) => (
              <Badge variant={online ? "default" : "destructive"} className="text-xs">
                {online ? "Online" : "Offline"}
              </Badge>
            )}
          />
          {getHealthBadge()}
        </div>
        <div className="flex items-center gap-4">
          {onDataSourceModeChange && (
            <DataSourceToggle mode={dataSourceMode} onModeChange={onDataSourceModeChange} />
          )}
          <div className="text-sm text-muted-foreground">
            Real-time market data visualization
          </div>
        </div>
      </div>
    </Card>
  );
}

export default Header;
