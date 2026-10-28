/**
 * Site footer, modelled on music.apple.com's: a full-width band in its own
 * shade, two small lines inside — copyright in the muted colour, then a row
 * of links in the stronger one (11px / 14px, 5px apart). Links underline on
 * hover and keep their colour, which is exactly how Apple styles them.
 *
 * Only links the project actually has are listed: Apple's terms / privacy /
 * cookie pages and its support channel do not exist here, so the row holds a
 * single Feedback link into the repository's issue tracker.
 */
const links = [
  {
    href: "https://github.com/dabaz-official/dabmusic/issues",
    label: "Feedback",
  },
] as const;

export function SiteFooter() {
  // 40px above the band; 14px above the copyright and 81.4px below the links.
  // That bottom padding is the room the floating player needs — the player
  // sits 16px off the window bottom and is 54px tall, so 81.4px puts exactly
  // 16px of air between the "Feedback" baseline and the pill's top edge
  // (measured 24.6px when this was 90px).
  return (
    <footer className="mt-10 bg-(--dz-footer-bg)">
      <div className="dz-container pt-[14px] pb-[81.4px]">
        <p className="text-[11px] leading-[14px] text-(--dz-text-muted)">
          Copyright © 2026{" "}
          <a
            href="https://dabaz.me"
            target="_blank"
            rel="noreferrer"
            className="text-(--dz-text-label) hover:underline"
          >
            DabAZ
          </a>
          . All rights reserved.
        </p>
        <ul className="mt-[5px] flex flex-wrap gap-x-5 gap-y-1 text-[11px] leading-[17px] text-(--dz-text-label)">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
