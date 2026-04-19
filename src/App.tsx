import { useEffect, useState } from 'react';
import AdminPanel from './components/AdminPanel';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import Footer from './components/Footer';
import Header from './components/Header';
import HomePage from './components/HomePage';
import ProductsPage from './components/ProductsPage';
import './index.css';
import { Analytics } from "@vercel/analytics/react"

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

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adminToken, setAdminToken] = useState<string>(() => localStorage.getItem('flourish_admin_token') || '');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const apiBase = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000/api';
  const isAdmin = Boolean(adminToken);

  useEffect(() => {
    void fetchProducts();
    void fetchReviews();
    if (isAdmin) {
      void fetchOrders();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin && currentPage === 'admin') {
      setCurrentPage('home');
    }
  }, [currentPage, isAdmin]);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Token ${adminToken}`,
  });

  const navigateTo = (page: string) => {
    if (!validPages.includes(page as Page)) {
      return;
    }

    setCurrentPage(page as Page);
    if (page !== 'products') {
      setSelectedProduct(null);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${apiBase}/products/`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${apiBase}/reviews/`);

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${apiBase}/orders/`, {
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
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
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

    alert(`${product.name} has been added to your cart.`);
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
      const response = await fetch(`${apiBase}/orders/`, {
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

      if (orderData.paymentScreenshot) {
        await fetch(`${apiBase}/orders/${data.order.id}/payment/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ screenshot: orderData.paymentScreenshot }),
        });
      }

      setCart([]);
      setCurrentPage('order-success');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  const handleGenerateVietQr = async (input: {
    customerName: string;
    amount: number;
    orderNumber?: string;
  }) => {
    const response = await fetch(`${apiBase}/payments/vietqr/preview/`, {
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
  };

  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      const response = await fetch(`${apiBase}/products/`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Failed to add product');
      }

      await fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product.');
    }
  };

  const handleUpdateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const response = await fetch(`${apiBase}/products/${id}/`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      await fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBase}/products/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${adminToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product.');
    }
  };

  const handleUpdateOrderStatus = async (
    id: string,
    status: string,
    paymentStatus: string,
  ) => {
    try {
      const response = await fetch(`${apiBase}/orders/${id}/`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status, paymentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      await fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order.');
    }
  };

  const handleAdminLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(`${apiBase}/auth/login/`, {
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
      setCurrentPage('admin');
      setAdminUsername('');
      setAdminPassword('');
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      alert(message);
    }
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (showAdminLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="surface-card-strong w-full max-w-lg p-8 sm:p-10">
          <span className="section-kicker">Private access</span>
          <h1 className="text-4xl text-[color:var(--foreground)]">Admin sign in</h1>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
            Keep the operational side separate, but styled with the same care as the storefront.
          </p>

          <form onSubmit={handleAdminLogin} className="mt-8 space-y-5">
            <div>
              <label className="field-label">Admin username</label>
              <input
                type="text"
                value={adminUsername}
                onChange={(event) => setAdminUsername(event.target.value)}
                className="input-field mb-4"
                placeholder="Admin username"
              />
              <label className="field-label">Admin password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                className="input-field"
                placeholder="Enter admin password"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn-primary">
                Login
              </button>
              <button
                type="button"
                onClick={() => setShowAdminLogin(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Use a real Django staff account
          </p>
        </div>
      </div>
    );
  }

  if (isAdmin && currentPage === 'admin') {
    return (
      <AdminPanel
        products={products}
        orders={orders}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onLogout={() => {
          void fetch(`${apiBase}/auth/logout/`, {
            method: 'POST',
            headers: {
              Authorization: `Token ${adminToken}`,
            },
          }).catch(() => undefined);
          setAdminToken('');
          localStorage.removeItem('flourish_admin_token');
          setCurrentPage('home');
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
          <span className="section-kicker mt-6">Order confirmed</span>
          <h1 className="text-4xl text-[color:var(--foreground)] sm:text-5xl">
            Your Flourish order has been placed.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
            We received your request and will follow up with confirmation details. If you chose QR transfer, your payment proof will be reviewed in the admin queue.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={() => navigateTo('home')} className="btn-primary">
              Back to home
            </button>
            <button onClick={() => navigateTo('products')} className="btn-secondary">
              Continue shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {currentPage !== 'admin' && (
        <Header
          cartItemCount={cartItemCount}
          onNavigate={navigateTo}
          onOpenAdmin={() => setShowAdminLogin(true)}
          currentPage={currentPage}
        />
      )}

      <main>
        {currentPage === 'home' && (
          <HomePage reviews={reviews} onShopNow={() => navigateTo('products')} />
        )}

        {currentPage === 'products' && (
          <ProductsPage
            products={products}
            cart={cart}
            onAddToCart={handleAddToCart}
            onViewProduct={(product) => setSelectedProduct(product)}
            selectedProduct={selectedProduct}
            onBack={() => setSelectedProduct(null)}
          />
        )}

        {currentPage === 'cart' && (
          <CartPage
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={() => navigateTo('checkout')}
            onContinueShopping={() => navigateTo('products')}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            cart={cart}
            onPlaceOrder={handlePlaceOrder}
            onGenerateVietQr={handleGenerateVietQr}
            onContinueShopping={() => navigateTo('products')}
          />
        )}
      </main>

      {currentPage !== 'admin' && <Footer onNavigate={navigateTo} />}
    </div>
  );
}
