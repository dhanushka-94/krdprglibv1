import Link from "next/link";

export default function ListenNotFound() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-xl font-bold">Channel not found</h1>
      <p className="text-muted-foreground">
        This radio channel does not exist or does not have a live stream.
      </p>
      <Link
        href="/listen"
        className="inline-flex text-sm font-medium text-primary hover:underline"
      >
        ← Back to all streams
      </Link>
    </div>
  );
}
