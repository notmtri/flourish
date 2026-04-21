import { CheckCircle2, Edit, LogOut, Package, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BrandSettings } from '../content/siteMedia';
import { formatCurrency, formatOrderDate } from '../utils/format';
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

interface OrderItem {
  product: {
    name: string;
    price: number;
  };
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  address: string;
  phone: string;
  items: OrderItem[];
  paymentMethod: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  adminNotes?: string;
  paymentScreenshot?: string;
  createdAt: string;
}

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  brandSettings: BrandSettings;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (id: string, product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onDeleteOrder: (id: string, orderNumber: string) => void;
  onUpdateOrderStatus: (id: string, status: string, paymentStatus: string, adminNotes?: string) => void;
  onUpdateBrandSettings: (settings: BrandSettings) => void;
  onLogout: () => void;
}

function StatusPill({ children }: { children: string }) {
  return <span className="pill">{children.replaceAll('_', ' ')}</span>;
}

function isPastOrder(order: Order) {
  return order.status === 'delivered' || order.status === 'cancelled';
}

function needsAttention(order: Order) {
  return order.paymentStatus === 'awaiting_verification' || order.status === 'pending';
}

export default function AdminPanel({
  products,
  orders,
  brandSettings,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onDeleteOrder,
  onUpdateOrderStatus,
  onUpdateBrandSettings,
  onLogout,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productQuery, setProductQuery] = useState('');
  const [orderQuery, setOrderQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    images: '',
    category: 'Bouquet',
    isBestSeller: false,
  });

  const ongoingOrders = useMemo(
    () =>
      orders
        .filter((order) => {
          const query = orderQuery.trim().toLowerCase();
          if (!query) {
            return true;
          }
          return [order.orderNumber, order.customerName, order.phone].some((value) =>
            value.toLowerCase().includes(query),
          );
        })
        .filter((order) => !isPastOrder(order))
        .sort((left, right) => {
          const leftScore = Number(needsAttention(left));
          const rightScore = Number(needsAttention(right));
          if (leftScore !== rightScore) {
            return rightScore - leftScore;
          }

          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        }),
    [orderQuery, orders],
  );

  const pastOrders = useMemo(
    () =>
      orders
        .filter((order) => {
          const query = orderQuery.trim().toLowerCase();
          if (!query) {
            return true;
          }
          return [order.orderNumber, order.customerName, order.phone].some((value) =>
            value.toLowerCase().includes(query),
          );
        })
        .filter((order) => isPastOrder(order))
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        ),
    [orderQuery, orders],
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const query = productQuery.trim().toLowerCase();
        if (!query) {
          return true;
        }
        return [product.name, product.category, product.description].some((value) =>
          value.toLowerCase().includes(query),
        );
      }),
    [productQuery, products],
  );

  const orderStats = useMemo(
    () => [
      {
        label: 'Products',
        value: String(products.length),
        icon: Package,
      },
      {
        label: 'Ongoing / awaiting',
        value: String(ongoingOrders.length),
        icon: ShoppingBag,
      },
      {
        label: 'Past orders',
        value: String(pastOrders.length),
        icon: CheckCircle2,
      },
      {
        label: 'Awaiting payment review',
        value: String(
          orders.filter((order) => order.paymentStatus === 'awaiting_verification').length,
        ),
        icon: ShoppingBag,
      },
    ],
    [ongoingOrders.length, orders, pastOrders.length, products.length],
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      images: '',
      category: 'Bouquet',
      isBestSeller: false,
    });
  };

  const handleSubmitProduct = (event: React.FormEvent) => {
    event.preventDefault();

    const productData = {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      images: formData.images
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean),
      category: formData.category,
      isBestSeller: formData.isBestSeller,
    };

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, productData);
    } else {
      onAddProduct(productData);
    }

    setShowProductForm(false);
    setEditingProduct(null);
    resetForm();
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: String(product.price),
      images: product.images.join(', '),
      category: product.category,
      isBestSeller: product.isBestSeller,
    });
    setShowProductForm(true);
  };

  const handleMarkOrderFinished = (order: Order) => {
    const nextPaymentStatus =
      order.paymentMethod === 'QR' && order.paymentStatus !== 'verified'
        ? 'verified'
        : order.paymentStatus;
    onUpdateOrderStatus(order.id, 'delivered', nextPaymentStatus, order.adminNotes);
  };

  const renderOrderCard = (order: Order) => {
    const showFinishAction = !isPastOrder(order);

    return (
      <article key={order.id} className="surface-card-strong p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusPill>{order.status}</StatusPill>
              <StatusPill>{order.paymentStatus}</StatusPill>
              <StatusPill>{order.paymentMethod}</StatusPill>
              {needsAttention(order) && <StatusPill>needs attention</StatusPill>}
            </div>
            <h3 className="mt-4 text-3xl text-[color:var(--foreground)]">{order.orderNumber}</h3>
            <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
              {formatOrderDate(order.createdAt)}
            </p>
          </div>

          <div className="text-left lg:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Order total
            </p>
            <p className="mt-2 text-3xl font-bold text-[color:var(--accent-dark)]">
              {formatCurrency(order.totalAmount)}
            </p>
            {showFinishAction && (
              <button
                onClick={() => handleMarkOrderFinished(order)}
                className="btn-primary mt-4"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark finished
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Customer
              </p>
              <p className="mt-3 text-lg font-semibold text-[color:var(--foreground)]">
                {order.customerName}
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{order.phone}</p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{order.address}</p>
            </div>

            <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Items
              </p>
              <ul className="mt-4 space-y-3 text-sm text-[color:var(--foreground)]">
                {order.items.map((item, index) => (
                  <li key={`${item.product.name}-${index}`} className="flex justify-between gap-4">
                    <span>
                      {item.product.name} x {item.quantity}
                    </span>
                    <span>{formatCurrency(item.product.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[24px] border border-[color:var(--line)] bg-[rgba(203,111,134,0.06)] p-5">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">Recommended workflow</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                Verify QR payments first, move the order to processing while preparing it, then use
                the finish button once delivery is complete.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="field-label">Order status</label>
                <select
                  value={order.status}
                  onChange={(event) =>
                    onUpdateOrderStatus(
                      order.id,
                      event.target.value,
                      order.paymentStatus,
                      order.adminNotes,
                    )
                  }
                  className="input-field"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="field-label">Payment status</label>
                <select
                  value={order.paymentStatus}
                  onChange={(event) =>
                    onUpdateOrderStatus(order.id, order.status, event.target.value, order.adminNotes)
                  }
                  className="input-field"
                >
                  <option value="pending">Pending</option>
                  <option value="awaiting_verification">Awaiting verification</option>
                  <option value="verified">Verified</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="field-label">Staff notes</label>
              <textarea
                value={order.adminNotes || ''}
                onBlur={(event) =>
                  event.target.value !== (order.adminNotes || '') &&
                  onUpdateOrderStatus(order.id, order.status, order.paymentStatus, event.target.value)
                }
                readOnly={false}
                className="textarea-field"
                rows={3}
                placeholder="Add internal notes about timing, substitutions, or delivery updates."
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {order.paymentStatus === 'awaiting_verification' && (
                <button
                  onClick={() => onUpdateOrderStatus(order.id, order.status, 'verified', order.adminNotes)}
                  className="btn-secondary"
                >
                  Verify payment
                </button>
              )}
              {order.status === 'pending' && (
                <button
                  onClick={() => onUpdateOrderStatus(order.id, 'processing', order.paymentStatus, order.adminNotes)}
                  className="btn-secondary"
                >
                  Start processing
                </button>
              )}
              {order.status === 'processing' && (
                <button
                  onClick={() => onUpdateOrderStatus(order.id, 'shipped', order.paymentStatus, order.adminNotes)}
                  className="btn-secondary"
                >
                  Mark shipped
                </button>
              )}
              <button
                onClick={() => onDeleteOrder(order.id, order.orderNumber)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                Delete order
              </button>
            </div>

            {order.paymentScreenshot && (
              <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Payment screenshot
                </p>
                <ImageWithFallback
                  src={order.paymentScreenshot}
                  alt="Payment proof"
                  className="mt-4 max-h-72 w-full rounded-[18px] object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff9f6_0%,#fff4ef_100%)]">
      <div className="border-b border-[color:var(--line)] bg-[#fffaf6]">
        <div className="shell flex flex-col gap-5 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="section-kicker">Admin panel</span>
            <h1 className="text-4xl text-[color:var(--foreground)]">Manage Flourish with one calm dashboard.</h1>
          </div>

          <button onClick={onLogout} className="btn-secondary self-start">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="section-shell pt-10">
        <section className="surface-card-strong mb-8 p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="section-kicker">Branding</span>
              <h2 className="text-3xl text-[color:var(--foreground)]">Edit the storefront logo.</h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                Paste any public image URL. Leaving the field empty restores the default lettermark.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-[1.3fr_0.7fr]">
              <div>
                <label className="field-label">Logo image URL</label>
                <input
                  type="url"
                  value={brandSettings.logoUrl}
                  onChange={(event) =>
                    onUpdateBrandSettings({
                      ...brandSettings,
                      logoUrl: event.target.value.trim(),
                    })
                  }
                  className="input-field"
                  placeholder="https://example.com/flourish-logo.png"
                />
              </div>

              <div>
                <p className="field-label">Preview</p>
                <div className="flex h-[88px] items-center gap-4 rounded-[24px] border border-[color:var(--line)] bg-white/80 px-5">
                  {brandSettings.logoUrl ? (
                    <ImageWithFallback
                      src={brandSettings.logoUrl}
                      alt="Brand logo preview"
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(203,111,134,0.14)] text-lg font-bold text-[color:var(--accent)]">
                      F
                    </div>
                  )}
                  <p className="text-sm text-[color:var(--muted)]">Header updates immediately after changes.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {orderStats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="surface-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(203,111,134,0.12)] text-[color:var(--accent-dark)]">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                {label}
              </p>
              <p className="brand-heading mt-2 text-4xl text-[color:var(--foreground)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            onClick={() => setActiveTab('products')}
            className={activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}
          >
            Orders
          </button>
        </div>

        {activeTab === 'products' && (
          <section className="mt-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl text-[color:var(--foreground)]">Product catalogue</h2>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  Keep descriptions, images, categories, and featured items polished here.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowProductForm(true);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" />
                Add product
              </button>
            </div>
            <input
              type="search"
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
              className="input-field"
              placeholder="Search products by name, category, or description"
            />

            {showProductForm && (
              <div className="surface-card-strong mb-6 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-3xl text-[color:var(--foreground)]">
                      {editingProduct ? 'Edit product' : 'Create product'}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                      Keep your inputs clean so cards on the storefront stay consistent.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProductForm(false);
                      setEditingProduct(null);
                      resetForm();
                    }}
                    className="btn-ghost"
                  >
                    <X className="h-4 w-4" />
                    Close
                  </button>
                </div>

                <form onSubmit={handleSubmitProduct} className="mt-6 grid gap-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="field-label">Product name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(event) =>
                          setFormData({ ...formData, name: event.target.value })
                        }
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="field-label">Category</label>
                      <select
                        value={formData.category}
                        onChange={(event) =>
                          setFormData({ ...formData, category: event.target.value })
                        }
                        className="input-field"
                      >
                        <option value="Bouquet">Bouquet</option>
                        <option value="Single Stem">Single Stem</option>
                        <option value="Gift Set">Gift Set</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="field-label">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(event) =>
                        setFormData({ ...formData, description: event.target.value })
                      }
                      className="textarea-field"
                      rows={4}
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="field-label">Price (VND)</label>
                      <input
                        type="number"
                        step="1000"
                        value={formData.price}
                        onChange={(event) =>
                          setFormData({ ...formData, price: event.target.value })
                        }
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="field-label">Image URLs (comma separated)</label>
                      <input
                        type="text"
                        value={formData.images}
                        onChange={(event) =>
                          setFormData({ ...formData, images: event.target.value })
                        }
                        className="input-field"
                        placeholder="https://example.com/1.jpg, https://example.com/2.jpg"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 rounded-[20px] border border-[color:var(--line)] bg-white/80 px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                    <input
                      type="checkbox"
                      checked={formData.isBestSeller}
                      onChange={(event) =>
                        setFormData({ ...formData, isBestSeller: event.target.checked })
                      }
                      className="h-4 w-4 rounded border-[color:var(--line)] text-[color:var(--accent)]"
                    />
                    Mark as best seller
                  </label>

                  <button type="submit" className="btn-primary self-start">
                    {editingProduct ? 'Update product' : 'Add product'}
                  </button>
                </form>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <article key={product.id} className="surface-card overflow-hidden p-3">
                  <ImageWithFallback
                    src={
                      product.images[0] ||
                      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900'
                    }
                    alt={product.name}
                    className="h-56 w-full rounded-[22px] object-cover"
                  />
                  <div className="px-2 pb-2 pt-5">
                    <div className="flex flex-wrap gap-2">
                      <StatusPill>{product.category}</StatusPill>
                      {product.isBestSeller && <StatusPill>Best seller</StatusPill>}
                    </div>
                    <h3 className="mt-4 text-3xl text-[color:var(--foreground)]">{product.name}</h3>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                      {product.description}
                    </p>
                    <p className="mt-5 text-lg font-semibold text-[color:var(--accent-dark)]">
                      {formatCurrency(product.price)}
                    </p>

                    <div className="mt-5 flex gap-3">
                      <button onClick={() => handleEditProduct(product)} className="btn-secondary flex-1">
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteProduct(product.id)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'orders' && (
          <section className="mt-8">
            <div className="mb-6">
              <h2 className="text-3xl text-[color:var(--foreground)]">Orders and payment review</h2>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                Keep the queue easy to scan so you can see what needs verification, production, or delivery next.
              </p>
            </div>
            <input
              type="search"
              value={orderQuery}
              onChange={(event) => setOrderQuery(event.target.value)}
              className="input-field mb-6"
              placeholder="Search orders by order number, customer, or phone"
            />

            {orders.length === 0 ? (
              <div className="surface-card p-10 text-center">
                <h3 className="text-3xl text-[color:var(--foreground)]">No orders yet</h3>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[color:var(--muted)]">
                  Once customers start checking out, this board will show their details, payment proof, and current status.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                <div>
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-2xl text-[color:var(--foreground)]">Ongoing / awaiting orders</h3>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                        Keep work-in-progress orders here until they are delivered or cancelled.
                      </p>
                    </div>
                    <span className="pill">{ongoingOrders.length} open</span>
                  </div>

                  {ongoingOrders.length === 0 ? (
                    <div className="surface-card p-8 text-center">
                      <h4 className="text-2xl text-[color:var(--foreground)]">No active orders</h4>
                      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[color:var(--muted)]">
                        New checkouts, payment reviews, and in-progress deliveries will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">{ongoingOrders.map(renderOrderCard)}</div>
                  )}
                </div>

                <div>
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-2xl text-[color:var(--foreground)]">Past orders</h3>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                        Delivered and cancelled orders move here automatically so the active queue stays clean.
                      </p>
                    </div>
                    <span className="pill">{pastOrders.length} archived</span>
                  </div>

                  {pastOrders.length === 0 ? (
                    <div className="surface-card p-8 text-center">
                      <h4 className="text-2xl text-[color:var(--foreground)]">No past orders yet</h4>
                      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[color:var(--muted)]">
                        Finished and cancelled orders will collect here once you close them out.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">{pastOrders.map(renderOrderCard)}</div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
