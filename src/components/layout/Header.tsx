import Link from 'next/link';

const Header = () => {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8 bg-white dark:bg-neutral-900">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex flex-row space-x-2">
            <span className="sr-only">DabMusic</span>
            <img
              alt="The logo of DabMusic"
              src="/icon/favicon.ico"
              className="h-8 w-auto"
            />
            <h2 className="text-2xl font-bold dark:text-white tracking-tight">
              DabMusic
            </h2>
          </Link>
        </div>
      </nav>
    </header>
  )
}

export default Header;