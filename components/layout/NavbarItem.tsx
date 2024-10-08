import Link from 'next/link';
import { IconType } from 'react-icons';
import { twMerge } from 'tailwind-merge';

interface NavbarItemProps {
  title: string;
  icon: IconType;
  active?: boolean;
  href: string;
}

export const NavbarItem = ({
  title,
  icon: Icon,
  active,
  href
}: NavbarItemProps) => {
  return (
    <Link
      href={href}
      className={twMerge(`px-2 flex flex-row h-auto items-center gap-x-4 text-md cursor-pointer py-2 text-neutral-400 transition group hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400`, active && 'text-black hover:text-black dark:text-white dark:hover:text-white')}
    >
      <Icon size={26} className={twMerge(``, active && 'text-primary-500')} />
      <p className='truncate w-full'>
        {title}
      </p>
    </Link>
  )
}

export const MobileNavbarItem = ({
  title,
  icon: Icon,
  active,
  href
}: NavbarItemProps) => {
  return (
    <Link
      href={href}
      className={twMerge(`mx-auto flex flex-col h-auto items-center text-xs sm:text-sm cursor-pointer pt-1.5 pb-6 gap-y-0.5 text-neutral-400 transition group hover:text-primary-500`, active && 'text-primary-500')}
    >
      <Icon size={20} className={twMerge(``, active && 'text-primary-500')} />
      <p className='truncate w-full'>
        {title}
      </p>
    </Link>
  )
}