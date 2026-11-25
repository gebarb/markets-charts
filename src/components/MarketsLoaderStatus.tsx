import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

const MarketsLoaderStatus = (props: { connectionError: boolean }) => {
  if (props.connectionError) {
    return (
      <div className="text-base">
        <span className="text-destructive">
          Server sent no data. The market is closed at the moment.{' '}
        </span>
        <br />
        (Come back later? :-)
      </div>
    );
  }

  return (
    <Badge className="gap-2 px-4 py-2 text-base">
      <Spinner size="sm" />
      Fetching some market data...
    </Badge>
  );
};

export default MarketsLoaderStatus;
