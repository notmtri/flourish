import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { SiteCopy } from '../content';
import { siteMedia } from '../content/siteMedia';
import { formatCurrency } from '../utils/format';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartPageProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
  copy: SiteCopy['cart'];
}

export default function CartPage({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onContinueShopping,
  copy,
}: CartPageProps) {
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="section-shell">
        <div className="surface-card-strong mx-auto max-w-2xl p-10 text-center sm:p-14">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(203,111,134,0.12)] text-[color:var(--accent-dark)]">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-4xl text-[color:var(--foreground)]">{copy.empty.title}</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[color:var(--muted)] sm:text-base">
            {copy.empty.copy}
          </p>
          <button onClick={onContinueShopping} className="btn-primary mt-8">
            {copy.empty.cta}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-shell">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <span className="section-kicker">{copy.page.kicker}</span>
          <h1 className="section-title">{copy.page.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
            {copy.page.copy}
          </p>

          <div className="mt-8 space-y-4">
            {cart.map((item) => (
              <article
                key={item.product.id}
                className="surface-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
              >
                <ImageWithFallback
                  src={item.product.images[0] || siteMedia.products.fallbackImage}
                  alt={item.product.name}
                  className="aspect-square w-full rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,232,225,0.9))] object-contain p-3 sm:w-28"
                />

                <div className="flex-1">
                  <h2 className="text-2xl text-[color:var(--foreground)]">{item.product.name}</h2>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--accent-dark)]">
                    {formatCurrency(item.product.price)}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/90 text-[color:var(--foreground)]"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold text-[color:var(--foreground)]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/90 text-[color:var(--foreground)]"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-between">
                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <p className="text-lg font-bold text-[color:var(--foreground)]">
                    {formatCurrency(item.product.price * item.quantity)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="lg:pt-14">
          <div className="surface-card-strong sticky top-28 p-6 sm:p-8">
            <h2 className="text-3xl text-[color:var(--foreground)]">{copy.page.summaryTitle}</h2>
            <div className="mt-6 space-y-3 text-sm text-[color:var(--muted)]">
              <div className="flex items-center justify-between">
                <span>{copy.page.itemsLabel}</span>
                <span>{cart.reduce((count, item) => count + item.quantity, 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{copy.page.deliveryLabel}</span>
                <span>{copy.page.deliveryValue}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{copy.page.paymentLabel}</span>
                <span>{copy.page.paymentValue}</span>
              </div>
            </div>

            <div className="mt-6 border-t border-[color:var(--line)] pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {copy.page.totalLabel}
                </span>
                <span className="text-3xl font-bold text-[color:var(--accent-dark)]">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button onClick={onCheckout} className="btn-primary w-full">
                {copy.page.checkoutCta}
              </button>
              <button onClick={onContinueShopping} className="btn-secondary w-full">
                {copy.page.continueCta}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
