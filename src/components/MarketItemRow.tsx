import { memo } from "react";
import TimeAgo from "react-timeago";
import { cn } from "@/lib/utils";
import { TableCell, TableRow } from "@/components/ui/table";
import type { QuoteItem } from "@/types/market";

const MarketItemRow = memo((props: {
  item_data: QuoteItem;
  item_name: string | undefined;
  toggleItemSelection: (item_name: string) => void;
}) => {
  const getQuoteValueColor = (quote: {
    current_value: number;
    history: { value: number }[];
  }) => {
    if (quote.history.length < 2) return undefined;
    if (quote.current_value < quote.history.slice(-2)[0].value) {
      return "text-red-500";
    } else if (quote.current_value > quote.history.slice(-2)[0].value) {
      return "text-green-500";
    }
    return undefined;
  };

  const history = props.item_data.history;
  return (
    <TableRow
      className={cn(
        "cursor-pointer",
        props.item_data.is_selected &&
          "bg-primary/30 shadow-[inset_1px_1px_5px_rgba(85,85,85,0.49)]"
      )}
      id={props.item_name}
      onClick={() => props.toggleItemSelection(props.item_name!)}
    >
      <TableCell>{props.item_name ? props.item_name.toUpperCase() : ""}</TableCell>
      <TableCell className={getQuoteValueColor(props.item_data)}>
        {props.item_data.current_value.toFixed(2)}
      </TableCell>
      <TableCell>
        <div className="flex h-6 items-end gap-0.5">
          {history.slice(-10).map((h, i) => {
            const min = Math.min(...history.slice(-10).map((v) => v.value));
            const max = Math.max(...history.slice(-10).map((v) => v.value));
            const range = max - min || 1;
            const height = ((h.value - min) / range) * 100;
            return (
              <div
                key={i}
                className="w-1 bg-primary"
                style={{ height: `${Math.max(10, height)}%` }}
              />
            );
          })}
        </div>
      </TableCell>
      <TableCell className="text-xs whitespace-nowrap">
        <TimeAgo date={history.slice(-1)[0].time} />
      </TableCell>
    </TableRow>
  );
});

export default MarketItemRow;
