import Image from 'next/image';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <nav
        aria-label="Global"
        className="flex items-center justify-between bg-gradient-to-b from-white to-white/80 p-6 backdrop-blur-lg lg:px-8 dark:from-black dark:to-black/80"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 flex flex-row space-x-2 p-1.5">
            <span className="sr-only">DabMusic</span>
            <Image
              src="/icon/logo-dark.ico"
              alt="The logo of DabMusic"
              width={40}
              height={40}
              className="block h-8 w-auto dark:hidden"
            />
            <Image
              src="/icon/logo-light.ico"
              alt="The logo of DabMusic"
              width={40}
              height={40}
              className="hidden h-8 w-auto dark:block"
            />
            <h2 className="text-2xl font-bold tracking-tight dark:text-white">DabMusic</h2>
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;