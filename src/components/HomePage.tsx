import { ArrowRight, Clock3, Gift, GraduationCap, Heart, ShieldCheck, Star } from 'lucide-react';
import { SiteCopy } from '../content';
import { fallbackReviews, siteMedia } from '../content/siteMedia';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Review {
  id: string;
  customerName: string;
  productName: string;
  rating: number;
  feedback: string;
  avatar: string;
}

interface HomePageProps {
  reviews: Review[];
  reviewsLoading: boolean;
  onShopNow: () => void;
  copy: SiteCopy['home'];
}
const featureIcons = [Clock3, Heart, ShieldCheck];
const occasionIcons = [GraduationCap, Gift, Heart];

export default function HomePage({ reviews, reviewsLoading, onShopNow, copy }: HomePageProps) {
  const reviewList = reviews.length > 0 ? reviews : fallbackReviews;
  const marqueeReviews = [...reviewList.slice(0, 10), ...reviewList.slice(0, 10)];

  return (
    <div className="overflow-hidden">
      <section className="shell-wide grid gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14 lg:py-20">
        <div className="relative z-10">
          <span className="section-kicker">{copy.heroKicker}</span>
          <h1 className="section-title max-w-3xl text-5xl sm:text-6xl lg:text-7xl">{copy.heroTitle}</h1>
          <p className="section-copy mt-6 max-w-xl">
            {copy.heroCopy}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={onShopNow} className="btn-primary">
              {copy.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </button>
            <span className="btn-secondary">{copy.ctaSecondary}</span>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {copy.stats.map((stat) => (
              <div key={stat.value} className="surface-card rounded-[24px] p-5">
                <p className="brand-heading text-3xl">{stat.value}</p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="surface-card-strong overflow-hidden rounded-[28px] p-3">
              <ImageWithFallback
                src={siteMedia.home.heroMain}
                alt="Flourish bouquet closeup"
                className="h-[320px] w-full rounded-[22px] object-cover sm:h-[420px] lg:h-[520px]"
              />
            </div>
            <div className="space-y-4 sm:space-y-5">
              <div className="surface-card-strong overflow-hidden rounded-[28px] p-3">
                <ImageWithFallback
                  src={siteMedia.home.heroSecondary}
                  alt="Wrapped flower bunch"
                  className="h-[150px] w-full rounded-[22px] object-cover sm:h-[205px]"
                />
              </div>
              <div className="surface-card-strong rounded-[28px] p-6">
                <p className="section-kicker mb-3">{copy.signature.kicker}</p>
                <p className="brand-heading text-3xl text-[color:var(--foreground)]">
                  {copy.signature.title}
                </p>
                <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
                  {copy.signature.copy}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="surface-card-strong grid gap-10 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-12">
          <div>
            <span className="section-kicker">{copy.brandStory.kicker}</span>
            <h2 className="section-title">{copy.brandStory.title}</h2>
          </div>
          <div className="space-y-5 text-[color:var(--muted)]">
            {copy.brandStory.paragraphs.map((paragraph) => (
              <p key={paragraph} className="section-copy">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="section-kicker">{copy.whyFlourish.kicker}</span>
            <h2 className="section-title">{copy.whyFlourish.title}</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
            {copy.whyFlourish.copy}
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {copy.whyFlourish.features.map(({ title, description }, index) => {
            const Icon = featureIcons[index];
            return (
              <div key={title} className="surface-card p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(203,111,134,0.12)] text-[color:var(--accent-dark)]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-2xl text-[color:var(--foreground)]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section-shell">
        <div className="mb-8">
          <span className="section-kicker">{copy.occasions.kicker}</span>
          <h2 className="section-title">{copy.occasions.title}</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {copy.occasions.items.map(({ title, description }, index) => {
            const Icon = occasionIcons[index];
            return (
              <div key={title} className="surface-card flex items-start gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(211,154,74,0.14)] text-[color:var(--gold)]">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl text-[color:var(--foreground)]">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pb-16 pt-4 sm:pb-20">
        <div className="shell-wide">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="section-kicker">{copy.reviews.kicker}</span>
              <h2 className="section-title">{copy.reviews.title}</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
              {copy.reviews.copy}
            </p>
          </div>

          <div className="review-marquee-mask">
            {reviewsLoading ? (
              <div className="grid gap-5 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <article key={index} className="surface-card review-card min-h-[220px] p-6">
                    <div className="flex items-center gap-3">
                      <div className="skeleton-block h-12 w-12 rounded-full" />
                      <div className="flex-1">
                        <div className="skeleton-line w-1/2" />
                        <div className="mt-2 skeleton-line w-1/3" />
                      </div>
                    </div>
                    <div className="mt-5 skeleton-line w-24" />
                    <div className="mt-4 skeleton-line h-20 w-full" />
                  </article>
                ))}
              </div>
            ) : (
              <div className="review-track">
                {marqueeReviews.map((review, index) => (
                  <article key={`${review.id}-${index}`} className="surface-card review-card min-h-[220px] p-6">
                    <div className="flex items-center gap-3">
                      {review.avatar ? (
                        <ImageWithFallback
                          src={review.avatar}
                          alt={review.customerName}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(203,111,134,0.14)] text-sm font-bold text-[color:var(--accent-dark)]">
                          {review.customerName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[color:var(--foreground)]">{review.customerName}</p>
                        <p className="text-sm text-[color:var(--muted)]">{review.productName}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-1">
                      {Array.from({ length: 5 }).map((_, ratingIndex) => (
                        <Star
                          key={ratingIndex}
                          className={`h-4 w-4 ${
                            ratingIndex < review.rating
                              ? 'fill-[color:var(--gold)] text-[color:var(--gold)]'
                              : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">{review.feedback}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
