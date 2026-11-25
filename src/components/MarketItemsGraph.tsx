import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QuotesMap } from '@/types/market';

const CHART_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

interface ChartDataPoint {
  timestamp: number;
  time: string;
  [key: string]: number | string;
}

interface MarketItemsGraphProps {
  quotes: QuotesMap;
}

function MarketItemsGraph({ quotes }: MarketItemsGraphProps) {
  const [resetKey, setResetKey] = useState(0);

  const chartData = useMemo(() => {
    const selectedItems = Object.entries(quotes).filter(
      ([, item]) => item.is_selected,
    );

    if (selectedItems.length === 0) {
      return [];
    }

    // Get all unique timestamps from all selected items
    const allTimestamps = new Set<number>();
    selectedItems.forEach(([, item]) => {
      item.history.forEach((point) => allTimestamps.add(point.time));
    });

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    // Build data points for each timestamp
    const data: ChartDataPoint[] = sortedTimestamps.map((timestamp) => {
      const point: ChartDataPoint = {
        timestamp,
        time: format(timestamp, 'h:mm:ss a'),
      };

      selectedItems.forEach(([name, item]) => {
        const historyPoint = item.history.find((h) => h.time === timestamp);
        if (historyPoint) {
          point[name] = historyPoint.value;
        }
      });

      return point;
    });

    return data;
  }, [quotes]);

  const selectedItems = useMemo(() => {
    return Object.entries(quotes).filter(([, item]) => item.is_selected);
  }, [quotes]);

  const resetZoom = () => {
    setResetKey((prev) => prev + 1);
  };

  if (selectedItems.length === 0) {
    return (
      <Card className="flex-1">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-primary">
            Click on any items on your left to see graphs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Graph</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-start justify-between gap-2">
          <p className="text-xs text-primary">
            Scroll/pinch to zoom, drag to pan.
          </p>
          <Button variant="secondary" size="sm" onClick={resetZoom}>
            Reset zoom
          </Button>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} key={resetKey}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="time"
                stroke="#888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '0.5rem',
                }}
                itemStyle={{ color: '#e2e8f0' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend />
              {selectedItems.map(([name], index) => (
                <Line
                  key={name}
                  dataKey={name}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  name={name.toUpperCase()}
                />
              ))}
              <Brush
                dataKey="time"
                height={30}
                stroke="#3b82f6"
                fill="#1e293b"
                travellerWidth={10}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default MarketItemsGraph;
