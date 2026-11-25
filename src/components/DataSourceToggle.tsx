import { Button } from '@/components/ui/button';
import type { DataSourceMode } from '@/types/market';

interface DataSourceToggleProps {
  mode: DataSourceMode;
  onModeChange: (mode: DataSourceMode) => void;
}

function DataSourceToggle({ mode, onModeChange }: DataSourceToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={mode === 'websocket' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onModeChange('websocket')}
      >
        WebSocket
      </Button>
      <Button
        variant={mode === 'rest-api' ? 'default' : 'outline'}
        size="sm"
        disabled
        title="REST API unavailable: EOD API blocks browser requests due to CORS. TODO: Add backend proxy or switch to CORS-friendly API"
        onClick={() => onModeChange('rest-api')}
      >
        REST API
      </Button>
    </div>
  );
}

export default DataSourceToggle;
