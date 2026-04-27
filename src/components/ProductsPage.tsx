import { ChevronLeft, Heart, ShieldCheck, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SiteCopy } from '../content';
import { siteMedia } from '../content/siteMedia';
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

interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface ProductsPageProps {
  products: Product[];
  categories: string[];
  isLoading: boolean;
  query: string;
  selectedCategory: string;
  sort: string;
  pagination: PaginationState;
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  selectedProduct: Product | null;
  onBack: () => void;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onPageChange: (page: number) => void;
  copy: SiteCopy['products'];
}

const fallbackImage = siteMedia.products.fallbackImage;

function ProductSkeleton() {
  return (
    <article className="surface-card overflow-hidden p-3">
      <div className="skeleton-block aspect-square rounded-[22px]" />
      <div className="px-2 pb-2 pt-5">
        <div className="skeleton-line w-2/3" />
        <div className="mt-3 skeleton-line w-1/3" />
        <div className="mt-4 skeleton-line h-12 sm:h-16 w-full" />
        <div className="mt-5 skeleton-line w-1/2" />
      </div>
    </article>
  );
}

export default function ProductsPage({
  products,
  categories,
  isLoading,
  query,
  selectedCategory,
  sort,
  pagination,
  cart,
  onAddToCart,
  onViewProduct,
  selectedProduct,
  onBack,
  onQueryChange,
  onCategoryChange,
  onSortChange,
  onPageChange,
  copy,
}: ProductsPageProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedProduct?.id]);

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
          {copy.detail.backToShop}
        </button>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="surface-card-strong overflow-hidden p-3">
              <div className="flex aspect-square items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,232,225,0.92))] p-4">
                <ImageWithFallback
                  src={galleryImages[selectedImageIndex] || fallbackImage}
                  alt={selectedProduct.name}
                  className="h-full w-full rounded-[20px] object-contain"
                />
              </div>
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
                    alt={copy.detail.galleryAlt(selectedProduct.name, index)}
                    className="aspect-square w-full rounded-[16px] bg-[rgba(255,255,255,0.92)] object-contain p-2"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="surface-card-strong p-8 sm:p-10">
            <div className="flex flex-wrap gap-2">
              <span className="pill">{selectedProduct.category}</span>
              {selectedProduct.isBestSeller && <span className="pill">{copy.detail.bestSellerPill}</span>}
              {inCartCount > 0 && <span className="pill">{copy.detail.inCartPill(inCartCount)}</span>}
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
                  {copy.detail.cards[0].title}
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  {copy.detail.cards[0].description}
                </p>
              </div>
              <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
                <ShieldCheck className="h-5 w-5 text-[color:var(--accent-dark)]" />
                <p className="mt-3 text-sm font-semibold text-[color:var(--foreground)]">
                  {copy.detail.cards[1].title}
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  {copy.detail.cards[1].description}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => onAddToCart(selectedProduct)} className="btn-primary">
                <ShoppingCart className="h-4 w-4" />
                {copy.detail.addToCart}
              </button>
              <button onClick={onBack} className="btn-secondary">
                {copy.detail.keepBrowsing}
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
          <span className="section-kicker">{copy.listing.kicker}</span>
          <h1 className="section-title">{copy.listing.title}</h1>
        </div>
        <p className="max-w-xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
          {copy.listing.copy}
        </p>
      </div>

      {categories.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryChange('all')}
            className={selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={selectedCategory === category ? 'btn-primary' : 'btn-secondary'}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_240px]">
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="input-field"
          placeholder="Search by bouquet name, category, or description"
        />
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
          className="input-field"
        >
          <option value="featured">Featured first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name_asc">Name: A to Z</option>
        </select>
      </div>

      {bestSellers.length > 0 && !isLoading && (
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="brand-heading text-3xl text-[color:var(--foreground)]">{copy.listing.bestSellersTitle}</h2>
            <span className="text-sm text-[color:var(--muted)]">{copy.listing.bestSellersCopy}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 min-[520px]:grid-cols-3 xl:grid-cols-4 xl:gap-5">
            {bestSellers.map((product) => {
              const inCartCount =
                cart.find((item) => item.product.id === product.id)?.quantity ?? 0;

              return (
                <article
                  key={product.id}
                  className="surface-card group overflow-hidden p-3 transition duration-200 hover:-translate-y-1"
                >
                  <button onClick={() => onViewProduct(product)} className="block w-full text-left">
                    <div className="flex aspect-square items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,232,225,0.9))] p-4">
                      <ImageWithFallback
                        src={product.images[0] || fallbackImage}
                        alt={product.name}
                        className="h-full w-full rounded-[18px] object-contain"
                      />
                    </div>
                    <div className="px-2 pb-2 pt-5">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xl text-[color:var(--foreground)] sm:text-2xl">{product.name}</h3>
                        <span className="pill">{copy.listing.bestSellerPill}</span>
                      </div>
                      <p className="mt-2 text-xs text-[color:var(--muted)] sm:text-sm">{product.category}</p>
                      <p className="mt-4 text-base font-semibold text-[color:var(--accent-dark)] sm:text-lg">
                        {formatCurrency(product.price)}
                      </p>
                      {inCartCount > 0 && (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                          {copy.listing.inCartLabel(inCartCount)}
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
          <h2 className="brand-heading text-3xl text-[color:var(--foreground)]">{copy.listing.allProductsTitle}</h2>
          <span className="text-sm text-[color:var(--muted)]">
            {copy.listing.availableLabel(pagination.totalItems || products.length)}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 min-[520px]:grid-cols-3 xl:grid-cols-4 xl:gap-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="surface-card p-10 text-center">
            <h3 className="text-3xl text-[color:var(--foreground)]">{copy.listing.emptyTitle}</h3>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[color:var(--muted)]">
              {copy.listing.emptyCopy}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 min-[520px]:grid-cols-3 xl:grid-cols-4 xl:gap-5">
            {products.map((product) => {
              const inCartCount =
                cart.find((item) => item.product.id === product.id)?.quantity ?? 0;

              return (
                <article
                  key={product.id}
                  className="surface-card group overflow-hidden p-3 transition duration-200 hover:-translate-y-1"
                >
                  <button onClick={() => onViewProduct(product)} className="block w-full text-left">
                    <div className="flex aspect-square items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,232,225,0.9))] p-4">
                      <ImageWithFallback
                        src={product.images[0] || fallbackImage}
                        alt={product.name}
                        className="h-full w-full rounded-[18px] object-contain"
                      />
                    </div>
                    <div className="px-2 pb-2 pt-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl text-[color:var(--foreground)] sm:text-2xl">{product.name}</h3>
                          <p className="mt-1 text-xs text-[color:var(--muted)] sm:text-sm">{product.category}</p>
                        </div>
                        {product.isBestSeller && <span className="pill">{copy.listing.popularPill}</span>}
                      </div>
                      <p className="mt-3 line-clamp-2 text-xs leading-6 text-[color:var(--muted)] sm:line-clamp-3 sm:text-sm sm:leading-7">
                        {product.description}
                      </p>
                      <div className="mt-5 flex items-center justify-between">
                        <p className="text-base font-semibold text-[color:var(--accent-dark)] sm:text-lg">
                          {formatCurrency(product.price)}
                        </p>
                        {inCartCount > 0 && (
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                            {copy.listing.inCartLabel(inCartCount)}
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

        {pagination.totalPages > 1 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={!pagination.hasPrevious}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous page
            </button>
            <span className="pill">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={!pagination.hasNext}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next page
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
