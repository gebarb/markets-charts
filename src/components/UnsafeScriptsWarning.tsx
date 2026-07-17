import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const UnsafeScriptsWarning = () => {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card className="mb-5">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <Spinner />
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardContent className="pt-6">
          You need to click on <code className="rounded bg-muted px-1">Load Unsafe Scripts</code> to
          proceed.
          <br />
          Look for the <code className="rounded bg-muted px-1">shield icon</code> on your
          browser&apos;s address bar. &#8679;
        </CardContent>
      </Card>
    </div>
  );
};

export default UnsafeScriptsWarning;
