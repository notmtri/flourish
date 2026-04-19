import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="mt-16 border-t border-[color:var(--line)] bg-[rgba(53,38,31,0.96)] text-white">
      <div className="shell py-14">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.8fr_1fr]">
          <div className="space-y-5">
            <div>
              <p className="brand-heading text-4xl">Flourish</p>
              <p className="mt-3 max-w-md text-sm leading-7 text-white/72">
                Handmade velvet wire flower bunches for graduations, birthdays, thank-you gifts,
                and every moment that deserves something lasting.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="#"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/12"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/12"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-white/50">
              Quick Access
            </p>
            <div className="space-y-3 text-sm">
              <button onClick={() => onNavigate('home')} className="block text-left text-white/72 transition hover:text-white">
                Home
              </button>
              <button onClick={() => onNavigate('products')} className="block text-left text-white/72 transition hover:text-white">
                Shop
              </button>
              <button onClick={() => onNavigate('cart')} className="block text-left text-white/72 transition hover:text-white">
                Shopping cart
              </button>
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-white/50">
              Connect With Us
            </p>
            <div className="space-y-4 text-sm text-white/72">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 flex-none" />
                <span>hello@flourish.vn</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 flex-none" />
                <span>+84 123 456 789</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-none" />
                <span>Ho Chi Minh City, Vietnam</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/45 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} Flourish. Handmade keepsakes for moments worth holding onto.</p>
          <p>Designed for gifting, celebration, and thoughtful delivery.</p>
        </div>
      </div>
    </footer>
  );
}
