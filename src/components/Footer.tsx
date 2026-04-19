import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { SiteCopy } from '../content';
import { siteMedia } from '../content/siteMedia';

interface FooterProps {
  onNavigate: (page: string) => void;
  copy: SiteCopy['footer'];
  navCopy: SiteCopy['header']['nav'];
}

export default function Footer({ onNavigate, copy, navCopy }: FooterProps) {
  return (
    <footer className="mt-16 border-t border-[color:var(--line)] bg-[rgba(53,38,31,0.96)] text-white">
      <div className="shell-wide py-14">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.8fr_1fr]">
          <div className="space-y-5">
            <div>
              <p className="brand-heading text-4xl">Flourish</p>
              <p className="mt-3 max-w-md text-sm leading-7 text-white/72">
                {copy.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={siteMedia.social.instagram}
                aria-label={copy.socialLinks.instagram}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/12"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={siteMedia.social.facebook}
                aria-label={copy.socialLinks.facebook}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/12"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-white/50">
              {copy.quickAccessTitle}
            </p>
            <div className="space-y-3 text-sm">
              <button onClick={() => onNavigate('home')} className="block text-left text-white/72 transition hover:text-white">
                {navCopy.home}
              </button>
              <button onClick={() => onNavigate('products')} className="block text-left text-white/72 transition hover:text-white">
                {navCopy.products}
              </button>
              <button onClick={() => onNavigate('cart')} className="block text-left text-white/72 transition hover:text-white">
                {navCopy.cart}
              </button>
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-white/50">
              {copy.connectTitle}
            </p>
            <div className="space-y-4 text-sm text-white/72">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 flex-none" />
                <span>{copy.contact.email}</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 flex-none" />
                <span>{copy.contact.phone}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-none" />
                <span>{copy.contact.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/45 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} Flourish. {copy.bottomLine}</p>
          <p>{copy.bottomTagline}</p>
        </div>
      </div>
    </footer>
  );
}
