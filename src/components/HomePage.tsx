import { ArrowRight, Clock3, Gift, GraduationCap, Heart, ShieldCheck, Star } from 'lucide-react';
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
  onShopNow: () => void;
}

const fallbackReviews: Review[] = [
  {
    id: 'demo-1',
    customerName: 'Minh Anh',
    productName: 'Graduation Bouquet',
    rating: 5,
    feedback: 'The bouquet looked elegant in photos and still sits perfectly on my desk weeks later.',
    avatar: '',
  },
  {
    id: 'demo-2',
    customerName: 'Hoang Vy',
    productName: 'Velvet Rose Wrap',
    rating: 5,
    feedback: 'Gifted this to my best friend and she loved how thoughtful and long-lasting it felt.',
    avatar: '',
  },
  {
    id: 'demo-3',
    customerName: 'Gia Bao',
    productName: 'Celebration Bundle',
    rating: 5,
    feedback: 'Beautiful finishing, careful wrapping, and it arrived ready to gift right away.',
    avatar: '',
  },
];

const featureCards = [
  {
    icon: Clock3,
    title: 'Made to last',
    description: 'Each bunch is designed to stay beautiful well beyond the day you gift it.',
  },
  {
    icon: Heart,
    title: 'Handmade with intention',
    description: 'Every stem is shaped and wrapped by hand so the final bouquet feels personal.',
  },
  {
    icon: ShieldCheck,
    title: 'Reliable gifting',
    description: 'Clean wrapping, clear checkout, and easy order confirmation for important moments.',
  },
];

const occasions = [
  { title: 'Graduation', description: 'Celebrate milestones with bouquets that look polished in photos.', icon: GraduationCap },
  { title: 'Meaningful gifts', description: 'A thoughtful keepsake for friends, partners, teachers, and family.', icon: Gift },
  { title: 'Romantic moments', description: 'Soft textures and lasting colors for anniversaries and love notes.', icon: Heart },
];

export default function HomePage({ reviews, onShopNow }: HomePageProps) {
  const reviewList = reviews.length > 0 ? reviews : fallbackReviews;

  return (
    <div className="overflow-hidden">
      <section className="shell grid gap-12 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
        <div className="relative z-10">
          <span className="section-kicker">Flowers that never fade</span>
          <h1 className="section-title max-w-xl text-5xl sm:text-6xl lg:text-7xl">
            Flowers that never fade.
          </h1>
          <p className="section-copy mt-6 max-w-xl">
            Handmade velvet wire flowers designed to last beyond every special moment.
            Flourish creates warm, photo-ready bouquets for graduation, gifting, and
            celebrations that deserve something lasting.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={onShopNow} className="btn-primary">
              Shop now
              <ArrowRight className="h-4 w-4" />
            </button>
            <span className="btn-secondary">Handmade in Ho Chi Minh City</span>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="surface-card rounded-[24px] p-5">
              <p className="brand-heading text-3xl">100%</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">Hand-shaped stems and bouquet wrapping</p>
            </div>
            <div className="surface-card rounded-[24px] p-5">
              <p className="brand-heading text-3xl">3-5</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">Angles shown per product for better buying confidence</p>
            </div>
            <div className="surface-card rounded-[24px] p-5">
              <p className="brand-heading text-3xl">Lasting</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">A bouquet that stays with the memory, not just the moment</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            <div className="surface-card-strong overflow-hidden rounded-[28px] p-3">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900"
                alt="Flourish bouquet closeup"
                className="h-[320px] w-full rounded-[22px] object-cover sm:h-[420px]"
              />
            </div>
            <div className="space-y-4 sm:space-y-5">
              <div className="surface-card-strong overflow-hidden rounded-[28px] p-3">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=900"
                  alt="Wrapped flower bunch"
                  className="h-[150px] w-full rounded-[22px] object-cover sm:h-[205px]"
                />
              </div>
              <div className="surface-card-strong rounded-[28px] p-6">
                <p className="section-kicker mb-3">Signature feeling</p>
                <p className="brand-heading text-3xl text-[color:var(--foreground)]">
                  Soft textures, quiet luxury, and gift-ready details.
                </p>
                <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
                  Designed to feel delicate, polished, and meaningful from the first glance to the unwrapping moment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="surface-card-strong grid gap-10 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-12">
          <div>
            <span className="section-kicker">Brand story</span>
            <h2 className="section-title">A bouquet that keeps the feeling alive.</h2>
          </div>
          <div className="space-y-5 text-[color:var(--muted)]">
            <p className="section-copy">
              We believe that some moments deserve more than flowers that fade away.
            </p>
            <p className="section-copy">
              Each of our velvet wire flowers is carefully handcrafted to capture emotions that last,
              whether it is love, friendship, gratitude, or celebration.
            </p>
            <p className="section-copy">
              What started as a small idea between friends has grown into a way to make meaningful gifts
              more accessible, beautiful, and lasting.
            </p>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="section-kicker">Why Flourish</span>
            <h2 className="section-title">Consistent, thoughtful, gift-ready.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
            The experience should feel calm and polished from browsing to checkout. We design the site with that same care.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {featureCards.map(({ icon: Icon, title, description }) => (
            <div key={title} className="surface-card p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(203,111,134,0.12)] text-[color:var(--accent-dark)]">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-2xl text-[color:var(--foreground)]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <div className="mb-8">
          <span className="section-kicker">Perfect for</span>
          <h2 className="section-title">Bouquets for every meaningful occasion.</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {occasions.map(({ title, description, icon: Icon }) => (
            <div key={title} className="surface-card flex items-start gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(211,154,74,0.14)] text-[color:var(--gold)]">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl text-[color:var(--foreground)]">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-16 pt-4 sm:pb-20">
        <div className="shell">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="section-kicker">Customer feedback</span>
              <h2 className="section-title">A rolling wall of kind words.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
              Social proof matters most when it feels personal. These cards keep the page lively without overwhelming the rest of the brand.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {reviewList.slice(0, 6).map((review) => (
              <article key={review.id} className="surface-card min-h-[220px] p-6">
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
        </div>
      </section>
    </div>
  );
}
