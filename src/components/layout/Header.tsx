import Link from 'next/link';

const Header = () => {
  return (
    <header className="sticky inset-x-0 top-0 z-5 flex items-start justify-between px-24 py-20 sm:px-64 sm:py-32 pointer-events-none">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-full w-full overflow-hidden">
        <div className="absolute blur-sm from-primary-background via-primary-background via-80% to-transparent left-[50%] top-[-20px] h-full w-[180%] -translate-x-1/2 bg-linear-to-b"></div>
      </div>
      <div className="flex w-full flex-col items-center justify-start gap-16">
        <div className="relative z-1 flex w-full items-start justify-between">
          <div className="flex h-full w-full flex-col items-center justify-between gap-y-12 md:gap-x-8 md:gap-y-0">
            <div className="flex w-full items-center justify-between">
              <Link href="/" className="text-xl font-bold">
                DabMusic
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header;