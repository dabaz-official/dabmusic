import Image from 'next/image';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8 bg-gradient-to-b from-white to-white/80 backdrop-blur-lg">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex flex-row space-x-2">
            <span className="sr-only">DabMusic</span>
            <Image
              src="/icon/favicon.ico"
              alt="The logo of DabMusic"
              width={40}
              height={40}
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