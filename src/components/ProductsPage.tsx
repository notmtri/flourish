import { ChevronLeft, Heart, ShieldCheck, ShoppingCart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '../utils/format';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  isBestSeller: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface ProductsPageProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  selectedProduct: Product | null;
  onBack: () => void;
}

const fallbackImage =
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900';

export default function ProductsPage({
  products,
  cart,
  onAddToCart,
  onViewProduct,
  selectedProduct,
  onBack,
}: ProductsPageProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedProduct?.id]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))),
    [products],
  );

  if (selectedProduct) {
    const galleryImages =
      selectedProduct.images.length > 0
        ? selectedProduct.images
        : [fallbackImage, fallbackImage, fallbackImage, fallbackImage];
    const inCartCount =
      cart.find((item) => item.product.id === selectedProduct.id)?.quantity ?? 0;

    return (
      <div className="section-shell">
        <button onClick={onBack} className="btn-ghost">
          <ChevronLeft className="h-4 w-4" />
          Back to shop
        </button>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="surface-card-strong overflow-hidden p-3">
              <ImageWithFallback
                src={galleryImages[selectedImageIndex] || fallbackImage}
                alt={selectedProduct.name}
                className="h-[320px] w-full rounded-[24px] object-cover sm:h-[480px]"
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              {galleryImages.slice(0, 4).map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`overflow-hidden rounded-[20px] border p-1.5 transition ${
                    index === selectedImageIndex
                      ? 'border-[color:var(--accent)] bg-white'
                      : 'border-[color:var(--line)] bg-white/80'
                  }`}
                >
                  <ImageWithFallback
                    src={image}
                    alt={`${selectedProduct.name} preview ${index + 1}`}
                    className="h-20 w-full rounded-[16px] object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="surface-card-strong p-8 sm:p-10">
            <div className="flex flex-wrap gap-2">
              <span className="pill">{selectedProduct.category}</span>
              {selectedProduct.isBestSeller && <span className="pill">Best seller</span>}
              {inCartCount > 0 && <span className="pill">In cart: {inCartCount}</span>}
            </div>

            <h1 className="mt-5 text-4xl text-[color:var(--foreground)] sm:text-5xl">
              {selectedProduct.name}
            </h1>
            <p className="mt-4 text-3xl font-bold text-[color:var(--accent-dark)]">
              {formatCurrency(selectedProduct.price)}
            </p>
            <p className="mt-6 text-base leading-8 text-[color:var(--muted)]">
              {selectedProduct.description}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
                <Heart className="h-5 w-5 text-[color:var(--accent-dark)]" />
                <p className="mt-3 text-sm font-semibold text-[color:var(--foreground)]">
                  Thoughtful gifting
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  Designed to look elegant for graduation, birthdays, thank-you gifts, and keepsakes.
                </p>
              </div>
              <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
                <ShieldCheck className="h-5 w-5 text-[color:var(--accent-dark)]" />
                <p className="mt-3 text-sm font-semibold text-[color:var(--foreground)]">
                  Gift-ready finish
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  Clean bouquet wrapping, polished presentation, and details that feel premium in hand.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => onAddToCart(selectedProduct)} className="btn-primary">
                <ShoppingCart className="h-4 w-4" />
                Add to cart
              </button>
              <button onClick={onBack} className="btn-secondary">
                Keep browsing
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const bestSellers = products.filter((product) => product.isBestSeller).slice(0, 4);

  return (
    <div className="section-shell">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="section-kicker">Product page</span>
          <h1 className="section-title">Handmade bunches for gifting, milestones, and everyday sweetness.</h1>
        </div>
        <p className="max-w-xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
          Browse polished product cards, view multiple angles, and add pieces to cart with confidence.
        </p>
      </div>

      {categories.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span key={category} className="pill">
              {category}
            </span>
          ))}
        </div>
      )}

      {bestSellers.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="brand-heading text-3xl text-[color:var(--foreground)]">Best sellers</h2>
            <span className="text-sm text-[color:var(--muted)]">The bouquets customers pick most often</span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {bestSellers.map((product) => {
              const inCartCount =
                cart.find((item) => item.product.id === product.id)?.quantity ?? 0;

              return (
                <article
                  key={product.id}
                  className="surface-card group overflow-hidden p-3 transition duration-200 hover:-translate-y-1"
                >
                  <button onClick={() => onViewProduct(product)} className="block w-full text-left">
                    <ImageWithFallback
                      src={product.images[0] || fallbackImage}
                      alt={product.name}
                      className="h-56 w-full rounded-[22px] object-cover"
                    />
                    <div className="px-2 pb-2 pt-5">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-2xl text-[color:var(--foreground)]">{product.name}</h3>
                        <span className="pill">Best seller</span>
                      </div>
                      <p className="mt-2 text-sm text-[color:var(--muted)]">{product.category}</p>
                      <p className="mt-4 text-lg font-semibold text-[color:var(--accent-dark)]">
                        {formatCurrency(product.price)}
                      </p>
                      {inCartCount > 0 && (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                          In cart: {inCartCount}
                        </p>
                      )}
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="brand-heading text-3xl text-[color:var(--foreground)]">All products</h2>
          <span className="text-sm text-[color:var(--muted)]">{products.length} available</span>
        </div>

        {products.length === 0 ? (
          <div className="surface-card p-10 text-center">
            <h3 className="text-3xl text-[color:var(--foreground)]">No products yet</h3>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[color:var(--muted)]">
              Add your first bouquets from the admin panel and they will appear here in the same card layout.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => {
              const inCartCount =
                cart.find((item) => item.product.id === product.id)?.quantity ?? 0;

              return (
                <article
                  key={product.id}
                  className="surface-card group overflow-hidden p-3 transition duration-200 hover:-translate-y-1"
                >
                  <button onClick={() => onViewProduct(product)} className="block w-full text-left">
                    <ImageWithFallback
                      src={product.images[0] || fallbackImage}
                      alt={product.name}
                      className="h-56 w-full rounded-[22px] object-cover"
                    />
                    <div className="px-2 pb-2 pt-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-2xl text-[color:var(--foreground)]">{product.name}</h3>
                          <p className="mt-1 text-sm text-[color:var(--muted)]">{product.category}</p>
                        </div>
                        {product.isBestSeller && <span className="pill">Popular</span>}
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-[color:var(--muted)]">
                        {product.description}
                      </p>
                      <div className="mt-5 flex items-center justify-between">
                        <p className="text-lg font-semibold text-[color:var(--accent-dark)]">
                          {formatCurrency(product.price)}
                        </p>
                        {inCartCount > 0 && (
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                            {inCartCount} in cart
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
