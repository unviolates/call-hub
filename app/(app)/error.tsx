'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <h1 className="text-4xl font-bold">Error</h1>
      <p className="text-[var(--text-2)]">{error?.message || 'Something went wrong'}</p>
      <div className="flex gap-4">
        <Button onClick={reset}>Try again</Button>
        <Link href="/chats">
          <Button variant="secondary">Go to Messages</Button>
        </Link>
      </div>
    </div>
  );
}
