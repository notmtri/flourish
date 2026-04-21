import { Menu, Settings2, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { SiteCopy } from '../content';
import { BrandSettings } from '../content/siteMedia';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface HeaderProps {
  cartItemCount: number;
  onNavigate: (page: string) => void;
  onOpenAdmin: () => void;
  currentPage: string;
  brandSettings: BrandSettings;
  copy: SiteCopy['header'];
}

export default function Header({
  cartItemCount,
  onNavigate,
  onOpenAdmin,
  currentPage,
  brandSettings,
  copy,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = [
    { id: 'home', label: copy.nav.home },
    { id: 'products', label: copy.nav.products },
  ];
  const mobileNavItems = [...navItems, { id: 'cart', label: copy.nav.cart }];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--line)] bg-[#fffaf6]">
      <div className="shell-wide">
        <div className="flex items-center justify-between gap-4 py-4">
          <button
            onClick={() => handleNavigate('home')}
            className="group flex items-center gap-3 text-left"
          >
            {brandSettings.logoUrl ? (
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[color:var(--line)] bg-white">
                <ImageWithFallback
                  src={brandSettings.logoUrl}
                  alt={copy.logoAlt}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(203,111,134,0.14)] text-lg font-bold text-[color:var(--accent)] transition group-hover:bg-[rgba(203,111,134,0.2)]">
                F
              </div>
            )}
            <div>
              <p className="brand-heading text-2xl text-[color:var(--foreground)]">{copy.brandName}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                {copy.brandTagline}
              </p>
            </div>
          </button>

          <nav className="hidden items-center gap-2 rounded-full border border-[color:var(--line)] bg-white/75 p-1.5 md:flex">
            {navItems.map((item) => {
              const isActive =
                currentPage === item.id ||
                (item.id === 'products' && currentPage === 'checkout');

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[color:var(--foreground)] text-white'
                      : 'text-[color:var(--muted)] hover:bg-white hover:text-[color:var(--foreground)]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={onOpenAdmin}
              aria-label={copy.adminAriaLabel}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/85 text-[color:var(--foreground)] transition hover:-translate-y-0.5"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleNavigate('cart')}
              aria-label={copy.cartAriaLabel}
              className={`relative inline-flex h-12 items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                currentPage === 'cart' || currentPage === 'checkout'
                  ? 'border-[color:var(--foreground)] bg-[color:var(--foreground)] text-white'
                  : 'border-[color:var(--line)] bg-white/85 text-[color:var(--foreground)]'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              {cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[color:var(--accent)] px-1.5 text-xs font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenAdmin}
              aria-label={copy.adminAriaLabel}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/80 text-[color:var(--foreground)]"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleNavigate('cart')}
              aria-label={copy.cartAriaLabel}
              className={`relative inline-flex h-12 w-12 items-center justify-center rounded-full border text-[color:var(--foreground)] ${
                currentPage === 'cart' || currentPage === 'checkout'
                  ? 'border-[color:var(--foreground)] bg-[color:var(--foreground)] text-white'
                  : 'border-[color:var(--line)] bg-white/80'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              {cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[color:var(--accent)] px-1.5 text-xs font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/80 text-[color:var(--foreground)]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="surface-card mb-4 rounded-[24px] p-3 md:hidden">
            <div className="space-y-2">
              {mobileNavItems.map((item) => {
                const isActive =
                  currentPage === item.id ||
                  (item.id === 'products' && currentPage === 'checkout');

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                      isActive
                        ? 'bg-[rgba(53,38,31,0.95)] text-white'
                        : 'bg-white/70 text-[color:var(--foreground)]'
                    }`}
                  >
                    {item.label}
                    {item.id === 'cart' && cartItemCount > 0 && (
                      <span className={`rounded-full px-2 py-1 text-xs ${isActive ? 'bg-white/15' : 'bg-[rgba(203,111,134,0.14)] text-[color:var(--accent-dark)]'}`}>
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
