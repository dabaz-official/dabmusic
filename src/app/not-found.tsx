'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-base font-semibold text-neutral-600 dark:text-neutral-400">404</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-neutral-900 sm:text-7xl">
          Damn!!
        </h1>
        <p className="mt-6 text-lg font-medium text-pretty text-neutral-600 dark:text-neutral-400 sm:text-xl/8">
          We couldn&rsquo;t find the page you&rsquo;re lookin&apos; for.
          <br />
          Sorry &apos;bout that.
        </p>
        <div className="mt-10 flex items-center justify-center">
          <Link href="/">
            <Button variant="default">
              Go back home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}