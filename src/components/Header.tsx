import { Detector } from 'react-detect-offline';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface HeaderProps {
  connectionHealth?: 'healthy' | 'degraded' | 'unhealthy';
}

function Header({ connectionHealth = 'healthy' }: HeaderProps) {
  const getHealthBadge = () => {
    if (connectionHealth === 'healthy') {
      return (
        <Badge variant="default" className="text-xs bg-green-600">
          Healthy
        </Badge>
      );
    } else if (connectionHealth === 'degraded') {
      return (
        <Badge variant="secondary" className="text-xs bg-yellow-600">
          Degraded
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="text-xs">
          Unhealthy
        </Badge>
      );
    }
  };

  return (
    <Card className="mb-4 border-0 bg-transparent shadow-none">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Markets Charts</h1>
          <Detector
            render={({ online }: { online: boolean }) => (
              <Badge
                variant={online ? 'default' : 'destructive'}
                className="text-xs"
              >
                {online ? 'Online' : 'Offline'}
              </Badge>
            )}
          />
          {getHealthBadge()}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Real-Time Market Data Visualization
          </div>
        </div>
      </div>
    </Card>
  );
}

export default Header;
