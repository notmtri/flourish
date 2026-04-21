import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import AdminPanel from './components/AdminPanel';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import Footer from './components/Footer';
import Header from './components/Header';
import HomePage from './components/HomePage';
import ProductsPage from './components/ProductsPage';
import { content } from './content';
import {
  brandSettingsStorageKey,
  BrandSettings,
  defaultBrandSettings,
} from './content/siteMedia';
import './index.css';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"

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

interface Review {
  id: string;
  customerName: string;
  productName: string;
  rating: number;
  feedback: string;
  avatar: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  address: string;
  phone: string;
  items: CartItem[];
  paymentMethod: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  hasPaymentScreenshot?: boolean;
  adminNotes?: string;
  paymentScreenshot?: string;
  createdAt: string;
}

interface VietQrPreview {
  orderNumber: string;
  transferContent: string;
  amount: number;
  qrCode: string;
  qrDataURL: string;
  providerAvailable: boolean;
  error?: string;
  bankInfo: {
    accountNo: string;
    accountName: string;
    acqId: string;
    template: string;
    format: string;
  };
}

type Page = 'home' | 'products' | 'cart' | 'checkout' | 'admin' | 'order-success';

const validPages: Page[] = ['home', 'products', 'cart', 'checkout', 'admin', 'order-success'];
const localApiBase = 'http://127.0.0.1:8000/api';
const cartStorageKey = 'flourish_cart';
const checkoutDraftStorageKey = 'flourish_checkout_draft';
const defaultPagination: PaginationState = {
  page: 1,
  pageSize: 24,
  totalItems: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};
const routeByPage: Record<Page, string> = {
  home: '/',
  products: '/products',
  cart: '/cart',
  checkout: '/checkout',
  admin: '/admin',
  'order-success': '/order-success',
};

function getPageFromPathname(pathname: string): Page {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const match = (Object.entries(routeByPage).find(([, path]) => path === normalizedPath) || [])[0];
  return (match as Page) || 'home';
}

function readStoredCart(): CartItem[] {
  const storedCart = localStorage.getItem(cartStorageKey);
  if (!storedCart) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedCart);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Invalid saved cart:', error);
    return [];
  }
}

export default function App() {
  const copy = content;
  const [currentPage, setCurrentPage] = useState<Page>(() => getPageFromPathname(window.location.pathname));
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(() => {
    const savedSettings = localStorage.getItem(brandSettingsStorageKey);

    if (!savedSettings) {
      return defaultBrandSettings;
    }

    try {
      return {
        ...defaultBrandSettings,
        ...JSON.parse(savedSettings),
      };
    } catch (error) {
      console.error('Invalid saved brand settings:', error);
      return defaultBrandSettings;
    }
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [productsPagination, setProductsPagination] = useState<PaginationState>(defaultPagination);
  const [cart, setCart] = useState<CartItem[]>(() => readStoredCart());
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersPagination, setOrdersPagination] = useState<PaginationState>({
    ...defaultPagination,
    pageSize: 20,
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adminToken, setAdminToken] = useState<string>(() => localStorage.getItem('flourish_admin_token') || '');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [backendTaskCount, setBackendTaskCount] = useState(0);
  const [backendTaskLabel, setBackendTaskLabel] = useState<{
    title: string;
    copy: string;
  } | null>(null);
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');
  const [placedPaymentMethod, setPlacedPaymentMethod] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [productCategory, setProductCategory] = useState('all');
  const [productSort, setProductSort] = useState('featured');
  const [productPage, setProductPage] = useState(1);
  const [orderQuery, setOrderQuery] = useState('');
  const [orderPage, setOrderPage] = useState(1);

  const configuredApiBase = process.env.REACT_APP_API_BASE?.trim().replace(/\/+$/, '');
  const isLocalHost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const apiBase = configuredApiBase || (isLocalHost ? localApiBase : '');
  const isAdmin = Boolean(adminToken);

  useEffect(() => {
    localStorage.setItem(brandSettingsStorageKey, JSON.stringify(brandSettings));
  }, [brandSettings]);

  useEffect(() => {
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }, [cart]);

  const getApiUrl = (path: string) => {
    if (!apiBase) {
      throw new Error(
        'Missing REACT_APP_API_BASE. Set it to your deployed backend URL in Vercel.',
      );
    }

    return `${apiBase}${path}`;
  };

  const getFetchErrorMessage = (error: unknown, action: string) => {
    if (error instanceof TypeError) {
      return `${action} failed because the API could not be reached at ${apiBase || '[missing REACT_APP_API_BASE]'}. Make sure the Django server is running on port 8000 for local development, or set REACT_APP_API_BASE to your deployed backend URL.`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return `${action} failed.`;
  };

  const runWithBackendTask = async <T,>(
    title: string,
    taskCopy: string,
    task: () => Promise<T>,
  ) => {
    setBackendTaskLabel({ title, copy: taskCopy });
    setBackendTaskCount((count) => count + 1);

    try {
      return await task();
    } finally {
      setBackendTaskCount((count) => {
        const nextCount = Math.max(0, count - 1);
        if (nextCount === 0) {
          setBackendTaskLabel(null);
        }
        return nextCount;
      });
    }
  };

  useEffect(() => {
    if (!isProductsLoading && !isReviewsLoading) {
      setIsBootstrapping(false);
    }
  }, [isProductsLoading, isReviewsLoading]);

  useEffect(() => {
    if (!isAdmin && currentPage === 'admin') {
      window.history.replaceState({}, '', routeByPage.home);
      setCurrentPage('home');
    }
  }, [currentPage, isAdmin]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromPathname(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Token ${adminToken}`,
  });

  const navigateTo = (page: string) => {
    if (!validPages.includes(page as Page)) {
      return;
    }

    const nextPage = page as Page;
    window.history.pushState({}, '', routeByPage[nextPage]);
    setCurrentPage(nextPage);
    if (page !== 'products') {
      setSelectedProduct(null);
    }
  };

  const fetchProducts = async ({
    query = productQuery,
    category = productCategory,
    sort = productSort,
    page = productPage,
  }: {
    query?: string;
    category?: string;
    sort?: string;
    page?: number;
  } = {}) => {
    setIsProductsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '24',
      });
      if (query.trim()) {
        params.set('q', query.trim());
      }
      if (category && category !== 'all') {
        params.set('category', category);
      }
      if (sort && sort !== 'featured') {
        params.set('sort', sort);
      }

      const response = await fetch(getApiUrl(`/products/?${params.toString()}`));

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
      setProductCategories(data.categories || []);
      setProductsPagination(data.pagination || defaultPagination);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setProductCategories([]);
      setProductsPagination(defaultPagination);
    } finally {
      setIsProductsLoading(false);
    }
  };

  const fetchReviews = async () => {
    setIsReviewsLoading(true);
    try {
      const response = await fetch(getApiUrl('/reviews/'));

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  const fetchOrders = async ({
    query = orderQuery,
    page = orderPage,
  }: {
    query?: string;
    page?: number;
  } = {}) => {
    setIsOrdersLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
      });
      if (query.trim()) {
        params.set('q', query.trim());
      }

      const response = await fetch(getApiUrl(`/orders/?${params.toString()}`), {
        headers: {
          Authorization: `Token ${adminToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setAdminToken('');
          localStorage.removeItem('flourish_admin_token');
        }
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setOrdersPagination(data.pagination || { ...defaultPagination, pageSize: 20 });
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setOrdersPagination({ ...defaultPagination, pageSize: 20 });
    } finally {
      setIsOrdersLoading(false);
    }
  };

  const fetchAdminProducts = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '500',
      });
      const response = await fetch(getApiUrl(`/products/?${params.toString()}`));

      if (!response.ok) {
        throw new Error('Failed to fetch admin products');
      }

      const data = await response.json();
      setAdminProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching admin products:', error);
      setAdminProducts([]);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchProducts();
    }, productQuery ? 250 : 0);

    return () => window.clearTimeout(timeoutId);
  }, [productCategory, productPage, productQuery, productSort]);

  useEffect(() => {
    void fetchReviews();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setOrders([]);
      setAdminProducts([]);
      setOrdersPagination({ ...defaultPagination, pageSize: 20 });
      return;
    }

    void fetchAdminProducts();

    const timeoutId = window.setTimeout(() => {
      void fetchOrders();
    }, orderQuery ? 250 : 0);

    return () => window.clearTimeout(timeoutId);
  }, [adminToken, isAdmin, orderPage, orderQuery]);

  const handleLoadOrderDetails = async (id: string) => {
    try {
      const response = await fetch(getApiUrl(`/orders/${id}/`), {
        headers: {
          Authorization: `Token ${adminToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.id === id ? { ...order, ...data.order } : order)),
      );
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load the full order details.');
    }
  };

  const handleAddToCart = (product: Product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.product.id === product.id);

      if (existingItem) {
        return currentCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...currentCart, { product, quantity: 1 }];
    });

    toast.success(copy.app.addedToCart(product.name));
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.product.id !== productId));
  };

  const handlePlaceOrder = async (orderData: {
    orderNumber?: string;
    customerName: string;
    address: string;
    phone: string;
    paymentMethod: string;
    paymentScreenshot?: string;
  }) => {
    try {
      await runWithBackendTask(
        copy.app.loading.placingOrderTitle,
        copy.app.loading.placingOrderCopy,
        async () => {
          const response = await fetch(getApiUrl('/orders/'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...orderData,
              items: cart,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create order');
          }

          const data = await response.json();
          setPlacedOrderNumber(data.order?.orderNumber || '');
          setPlacedPaymentMethod(data.order?.paymentMethod || orderData.paymentMethod);
          setCart([]);
          localStorage.removeItem(checkoutDraftStorageKey);
          navigateTo('order-success');
        },
      );
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(copy.app.placeOrderFailed);
    }
  };

  const handleGenerateVietQr = async (input: {
    customerName: string;
    amount: number;
    orderNumber?: string;
  }) => {
    return runWithBackendTask(
      copy.app.loading.generatingQrTitle,
      copy.app.loading.generatingQrCopy,
      async () => {
        const response = await fetch(getApiUrl('/payments/vietqr/preview/'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        });

        const data = await response.json();
        if (!response.ok) {
          if (response.status === 503 && data.orderNumber && data.transferContent && data.bankInfo) {
            return {
              ...data,
              qrCode: data.qrCode || '',
              qrDataURL: data.qrDataURL || '',
              providerAvailable: false,
            } as VietQrPreview;
          }
          throw new Error(data.error || 'Failed to generate VietQR code');
        }

        return {
          ...data,
          providerAvailable: true,
        } as VietQrPreview;
      }
    );
  };

  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      await runWithBackendTask(
        copy.app.loading.savingProductTitle,
        copy.app.loading.savingProductCopy,
        async () => {
          const response = await fetch(getApiUrl('/products/'), {
            method: 'POST',
            headers: {
              ...getAuthHeaders(),
            },
            body: JSON.stringify(productData),
          });

          if (!response.ok) {
            throw new Error('Failed to add product');
          }

          const data = await response.json();
          setAdminProducts((currentProducts) => [data.product, ...currentProducts]);
          setProducts((currentProducts) => [data.product, ...currentProducts]);
        },
      );
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(copy.app.addProductFailed);
    }
  };

  const handleUpdateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      await runWithBackendTask(
        copy.app.loading.savingProductTitle,
        copy.app.loading.savingProductCopy,
        async () => {
          const response = await fetch(getApiUrl(`/products/${id}/`), {
            method: 'PUT',
            headers: {
              ...getAuthHeaders(),
            },
            body: JSON.stringify(productData),
          });

          if (!response.ok) {
            throw new Error('Failed to update product');
          }

          const data = await response.json();
          setAdminProducts((currentProducts) =>
            currentProducts.map((product) => (product.id === id ? data.product : product)),
          );
          setProducts((currentProducts) =>
            currentProducts.map((product) => (product.id === id ? data.product : product)),
          );
        },
      );
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(copy.app.updateProductFailed);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm(copy.app.deleteProductConfirm)) {
      return;
    }

    try {
      await runWithBackendTask(
        copy.app.loading.deletingProductTitle,
        copy.app.loading.deletingProductCopy,
        async () => {
          const response = await fetch(getApiUrl(`/products/${id}/`), {
            method: 'DELETE',
            headers: {
              Authorization: `Token ${adminToken}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to delete product');
          }

          setAdminProducts((currentProducts) => currentProducts.filter((product) => product.id !== id));
          setProducts((currentProducts) => currentProducts.filter((product) => product.id !== id));
        },
      );
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(copy.app.deleteProductFailed);
    }
  };

  const handleUpdateOrderStatus = async (
    id: string,
    status: string,
    paymentStatus: string,
    adminNotes?: string,
  ) => {
    try {
      await runWithBackendTask(
        copy.app.loading.updatingOrderTitle,
        copy.app.loading.updatingOrderCopy,
        async () => {
          const response = await fetch(getApiUrl(`/orders/${id}/`), {
            method: 'PUT',
            headers: {
              ...getAuthHeaders(),
            },
            body: JSON.stringify({ status, paymentStatus, adminNotes }),
          });

          if (!response.ok) {
            throw new Error('Failed to update order');
          }

          const data = await response.json();
          setOrders((currentOrders) =>
            currentOrders.map((order) => (order.id === id ? data.order : order)),
          );
        },
      );
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(copy.app.updateOrderFailed);
    }
  };

  const handleDeleteOrder = async (id: string, orderNumber: string) => {
    if (!window.confirm(copy.app.deleteOrderConfirm(orderNumber))) {
      return;
    }

    try {
      await runWithBackendTask(
        copy.app.loading.deletingOrderTitle,
        copy.app.loading.deletingOrderCopy,
        async () => {
          let response = await fetch(getApiUrl(`/orders/${id}/`), {
            method: 'DELETE',
            headers: {
              Authorization: `Token ${adminToken}`,
            },
          });

          if (response.status === 405) {
            response = await fetch(getApiUrl(`/orders/${id}/delete/`), {
              method: 'POST',
              headers: {
                Authorization: `Token ${adminToken}`,
              },
            });
          }

          if (!response.ok) {
            throw new Error('Failed to delete order');
          }

          setOrders((currentOrders) => currentOrders.filter((order) => order.id !== id));
        },
      );
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(copy.app.deleteOrderFailed);
    }
  };

  const handleAdminLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await runWithBackendTask(
        copy.app.loading.adminLoginTitle,
        copy.app.loading.adminLoginCopy,
        async () => {
          const response = await fetch(getApiUrl('/auth/login/'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: adminUsername,
              password: adminPassword,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Login failed');
          }

          setAdminToken(data.token);
          localStorage.setItem('flourish_admin_token', data.token);
          setShowAdminLogin(false);
          navigateTo('admin');
          setAdminUsername('');
          setAdminPassword('');
        },
      );
      return;
    } catch (error) {
      const message = getFetchErrorMessage(error, 'Admin login');
      toast.error(message);
    }
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (showAdminLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="surface-card-strong w-full max-w-lg p-8 sm:p-10">
          <span className="section-kicker">{copy.app.adminLogin.kicker}</span>
          <h1 className="text-4xl text-[color:var(--foreground)]">{copy.app.adminLogin.title}</h1>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
            {copy.app.adminLogin.copy}
          </p>

          <form onSubmit={handleAdminLogin} className="mt-8 space-y-5">
            <div>
              <label className="field-label">{copy.app.adminLogin.usernameLabel}</label>
              <input
                type="text"
                value={adminUsername}
                onChange={(event) => setAdminUsername(event.target.value)}
                className="input-field mb-4"
                placeholder={copy.app.adminLogin.usernamePlaceholder}
              />
              <label className="field-label">{copy.app.adminLogin.passwordLabel}</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                className="input-field"
                placeholder={copy.app.adminLogin.passwordPlaceholder}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn-primary">
                {copy.app.adminLogin.login}
              </button>
              <button
                type="button"
                onClick={() => setShowAdminLogin(false)}
                className="btn-secondary"
              >
                {copy.app.adminLogin.cancel}
              </button>
            </div>
          </form>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            {copy.app.adminLogin.footnote}
          </p>
        </div>
      </div>
    );
  }

  if (isAdmin && currentPage === 'admin') {
    return (
      <AdminPanel
        products={adminProducts}
        orders={orders}
        ordersPagination={ordersPagination}
        brandSettings={brandSettings}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onDeleteOrder={handleDeleteOrder}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onUpdateBrandSettings={setBrandSettings}
        onLoadOrderDetails={handleLoadOrderDetails}
        orderQuery={orderQuery}
        onOrderQueryChange={(value) => {
          setOrderQuery(value);
          setOrderPage(1);
        }}
        onOrderPageChange={setOrderPage}
        isOrdersLoading={isOrdersLoading}
        onLogout={() => {
          void fetch(getApiUrl('/auth/logout/'), {
            method: 'POST',
            headers: {
              Authorization: `Token ${adminToken}`,
            },
          }).catch(() => undefined);
          setAdminToken('');
          localStorage.removeItem('flourish_admin_token');
          navigateTo('home');
        }}
      />
    );
  }

  if (currentPage === 'order-success') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="surface-card-strong w-full max-w-2xl p-8 text-center sm:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(125,170,117,0.16)]">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <span className="section-kicker mt-6">{copy.app.orderSuccess.kicker}</span>
          <h1 className="text-4xl text-[color:var(--foreground)] sm:text-5xl">
            {copy.app.orderSuccess.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
            {copy.app.orderSuccess.copy}
          </p>
          {placedPaymentMethod === 'QR' && (
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[color:var(--muted)]">
              Your payment proof has been received and is now waiting for verification.
            </p>
          )}
          {placedOrderNumber && (
            <p className="mx-auto mt-4 inline-flex rounded-full border border-[color:var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--foreground)]">
              Order number: {placedOrderNumber}
            </p>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setPlacedOrderNumber('');
                setPlacedPaymentMethod('');
                navigateTo('home');
              }}
              className="btn-primary"
            >
              {copy.app.orderSuccess.homeCta}
            </button>
            <button
              onClick={() => {
                setPlacedOrderNumber('');
                setPlacedPaymentMethod('');
                navigateTo('products');
              }}
              className="btn-secondary"
            >
              {copy.app.orderSuccess.productsCta}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {isBootstrapping && (
        <div className="border-b border-[color:var(--line)] bg-[rgba(211,154,74,0.16)]">
          <div className="shell-wide flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-[rgba(53,38,31,0.22)] border-t-[color:var(--accent-dark)]"
                aria-hidden="true"
              />
              <p className="font-semibold text-[color:var(--foreground)]">
                {copy.app.backendLoadingTitle}
              </p>
            </div>
            <p className="text-[color:var(--muted)]">{copy.app.backendLoadingCopy}</p>
          </div>
        </div>
      )}

      {backendTaskCount > 0 && backendTaskLabel && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(53,38,31,0.22)] px-4 backdrop-blur-[2px]">
          <div
            className="surface-card-strong w-full max-w-md p-8 text-center"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <span
              className="mx-auto inline-flex h-12 w-12 animate-spin rounded-full border-[3px] border-[rgba(53,38,31,0.18)] border-t-[color:var(--accent-dark)]"
              aria-hidden="true"
            />
            <h2 className="mt-5 text-3xl text-[color:var(--foreground)]">
              {backendTaskLabel.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
              {backendTaskLabel.copy}
            </p>
          </div>
        </div>
      )}

      {currentPage !== 'admin' && (
        <Header
          cartItemCount={cartItemCount}
          onNavigate={navigateTo}
          onOpenAdmin={() => setShowAdminLogin(true)}
          currentPage={currentPage}
          brandSettings={brandSettings}
          copy={copy.header}
        />
      )}

      <main className={(currentPage === 'products' || currentPage === 'home') && cartItemCount > 0 ? 'pb-24 md:pb-0' : undefined}>
        {currentPage === 'home' && (
          <HomePage
            reviews={reviews}
            reviewsLoading={isReviewsLoading}
            cartItemCount={cartItemCount}
            onShopNow={() => navigateTo('products')}
            onOpenCart={() => navigateTo('cart')}
            onContinueCheckout={() => navigateTo(cartItemCount > 0 ? 'checkout' : 'products')}
            copy={copy.home}
          />
        )}

        {currentPage === 'products' && (
          <ProductsPage
            products={products}
            categories={productCategories}
            isLoading={isProductsLoading}
            query={productQuery}
            selectedCategory={productCategory}
            sort={productSort}
            pagination={productsPagination}
            cart={cart}
            onAddToCart={handleAddToCart}
            onViewProduct={(product) => setSelectedProduct(product)}
            selectedProduct={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onQueryChange={(value) => {
              setProductQuery(value);
              setProductPage(1);
            }}
            onCategoryChange={(value) => {
              setProductCategory(value);
              setProductPage(1);
            }}
            onSortChange={(value) => {
              setProductSort(value);
              setProductPage(1);
            }}
            onPageChange={setProductPage}
            copy={copy.products}
          />
        )}

        {currentPage === 'cart' && (
          <CartPage
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={() => navigateTo('checkout')}
            onContinueShopping={() => navigateTo('products')}
            copy={copy.cart}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            cart={cart}
            onPlaceOrder={handlePlaceOrder}
            onGenerateVietQr={handleGenerateVietQr}
            onContinueShopping={() => navigateTo('products')}
            copy={copy.checkout}
          />
        )}
      </main>

      {(currentPage === 'products' || currentPage === 'home') && cartItemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-[55] border-t border-[color:var(--line)] bg-[#fffaf6]/95 px-4 py-4 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <button
              onClick={() => navigateTo('cart')}
              className="btn-secondary min-h-12 flex-1"
            >
              Cart ({cartItemCount})
            </button>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Ready
              </p>
              <p className="text-lg font-bold text-[color:var(--accent-dark)]">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(cartTotal)}
              </p>
            </div>
            <button
              onClick={() => navigateTo('checkout')}
              className="btn-primary min-h-12 flex-1"
            >
              Checkout
            </button>
          </div>
        </div>
      )}

      {currentPage !== 'admin' && <Footer onNavigate={navigateTo} copy={copy.footer} navCopy={copy.header.nav} />}
      <Toaster position="top-center" richColors closeButton />
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
