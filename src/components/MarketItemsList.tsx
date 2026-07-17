import React, { memo } from "react";
import { Detector } from "react-detect-offline";
import MarketItemRow from "./MarketItemRow";
import MarketTrendArrow from "./MarketTrendArrow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { QuotesMap } from "@/types/market";

const MarketItemsList = memo((props: {
  resetData: React.MouseEventHandler<HTMLButtonElement> | undefined;
  areMarketsLoaded: () => boolean;
  market_trend: string | undefined;
  quotes: QuotesMap;
  toggleItemSelection: (item_name: string) => void;
}) => {
  return (
    <Card className="w-full lg:w-1/3" id="items_list">
      <CardHeader className="flex flex-row flex-wrap items-center gap-2 space-y-0 pb-4">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          Markets
          <Detector
            render={({ online }: { online: boolean }) => (
              <Badge variant={online ? "default" : "destructive"}>
                {online ? "Live" : "Offline"}
              </Badge>
            )}
          />
          <Button variant="secondary" size="sm" onClick={props.resetData}>
            Clear history
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="overflow-x-auto">
        {props.areMarketsLoaded() ? (
          <p className="mb-2 text-xs text-primary">
            Click on an item to add/remove from graph
          </p>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>
                Value
                <MarketTrendArrow current_trend={props.market_trend} />
              </TableHead>
              <TableHead>History</TableHead>
              <TableHead>Updated At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.areMarketsLoaded() ? (
              Object.keys(props.quotes).map((item_name) => {
                const current_item = props.quotes[item_name];
                return (
                  <MarketItemRow
                    key={item_name}
                    item_name={item_name}
                    item_data={current_item}
                    toggleItemSelection={props.toggleItemSelection}
                  />
                );
              })
            ) : (
              <>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
});

export default MarketItemsList;
