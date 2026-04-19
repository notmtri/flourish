import { Edit, LogOut, Package, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
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
  paymentScreenshot?: string;
  createdAt: string;
}

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (id: string, product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateOrderStatus: (id: string, status: string, paymentStatus: string) => void;
  onLogout: () => void;
}

function StatusPill({ children }: { children: string }) {
  return <span className="pill">{children.replaceAll('_', ' ')}</span>;
}

export default function AdminPanel({
  products,
  orders,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onLogout,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    images: '',
    category: 'Bouquet',
    isBestSeller: false,
  });

  const orderStats = useMemo(
    () => [
      {
        label: 'Products',
        value: String(products.length),
        icon: Package,
      },
      {
        label: 'Orders',
        value: String(orders.length),
        icon: ShoppingBag,
      },
      {
        label: 'Awaiting payment review',
        value: String(
          orders.filter((order) => order.paymentStatus === 'awaiting_verification').length,
        ),
        icon: ShoppingBag,
      },
    ],
    [orders, products.length],
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
        <div className="grid gap-4 md:grid-cols-3">
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
              {products.map((product) => (
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

            {orders.length === 0 ? (
              <div className="surface-card p-10 text-center">
                <h3 className="text-3xl text-[color:var(--foreground)]">No orders yet</h3>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[color:var(--muted)]">
                  Once customers start checking out, this board will show their details, payment proof, and current status.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {orders.map((order) => (
                  <article key={order.id} className="surface-card-strong p-6 sm:p-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill>{order.status}</StatusPill>
                          <StatusPill>{order.paymentStatus}</StatusPill>
                          <StatusPill>{order.paymentMethod}</StatusPill>
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
                                onUpdateOrderStatus(order.id, order.status, event.target.value)
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
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
