import Link from "next/link";
import { Music, ArrowLeft } from "lucide-react";

export default function ProgrammeNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Music className="size-14 text-muted-foreground/50" />
      <h1 className="mt-4 text-xl font-semibold text-foreground">
        Programme not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This programme may have been removed or the link might be incorrect.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowLeft className="size-4" />
        View all programmes
      </Link>
    </div>
  );
}
