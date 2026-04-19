import { CreditCard, Landmark, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatCurrency } from '../utils/format';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CheckoutPageProps {
  cart: CartItem[];
  onPlaceOrder: (orderData: {
    orderNumber?: string;
    customerName: string;
    address: string;
    phone: string;
    paymentMethod: string;
    paymentScreenshot?: string;
  }) => void;
  onGenerateVietQr: (input: {
    customerName: string;
    amount: number;
    orderNumber?: string;
  }) => Promise<{
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
  }>;
  onContinueShopping: () => void;
}

export default function CheckoutPage({
  cart,
  onPlaceOrder,
  onGenerateVietQr,
  onContinueShopping,
}: CheckoutPageProps) {
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'QR'>('COD');
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [generatedOrderNumber, setGeneratedOrderNumber] = useState('');
  const [generatedTransferContent, setGeneratedTransferContent] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [bankInfo, setBankInfo] = useState<{
    accountNo: string;
    accountName: string;
    acqId: string;
    template: string;
    format: string;
  } | null>(null);
  const [providerAvailable, setProviderAvailable] = useState(true);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrError, setQrError] = useState('');

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const paymentReference = useMemo(() => {
    const trimmed = customerName.trim();
    if (!trimmed) {
      return 'FLOURISH ORDER';
    }

    const pieces = trimmed.split(/\s+/).filter(Boolean);
    const initials = pieces.slice(0, 3).map((piece) => piece[0]?.toUpperCase()).join('');
    return `${initials} FLOURISH`;
  }, [customerName]);

  const handleGenerateQr = async () => {
    if (!customerName.trim()) {
      alert('Please enter your name before generating the transfer details.');
      return;
    }

    setIsGeneratingQr(true);
    setQrError('');

    try {
      const data = await onGenerateVietQr({
        customerName,
        amount: total,
        orderNumber: generatedOrderNumber || undefined,
      });
      setGeneratedOrderNumber(data.orderNumber);
      setGeneratedTransferContent(data.transferContent);
      setQrImage(data.qrDataURL);
      setBankInfo(data.bankInfo);
      setProviderAvailable(data.providerAvailable);
      setShowPaymentDetails(true);
      if (!data.providerAvailable) {
        setQrError(data.error || 'VietQR is temporarily unavailable. Use the manual transfer details below.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate QR code.';
      setQrError(message);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!customerName || !address || !phone) {
      alert('Please fill in all required fields.');
      return;
    }

    if (paymentMethod === 'QR' && !paymentScreenshot) {
      alert('Please upload your payment screenshot before placing the order.');
      return;
    }

    if (paymentMethod === 'QR' && !generatedOrderNumber) {
      alert('Please generate the transfer details before placing the order.');
      return;
    }

    onPlaceOrder({
      orderNumber: paymentMethod === 'QR' ? generatedOrderNumber || undefined : undefined,
      customerName,
      address,
      phone,
      paymentMethod,
      paymentScreenshot: paymentMethod === 'QR' ? paymentScreenshot : undefined,
    });
  };

  if (cart.length === 0) {
    return (
      <div className="section-shell">
        <div className="surface-card-strong mx-auto max-w-2xl p-10 text-center sm:p-14">
          <h1 className="text-4xl text-[color:var(--foreground)]">There is nothing to check out yet.</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[color:var(--muted)] sm:text-base">
            Add a bouquet to your cart first, then come back here to complete delivery and payment details.
          </p>
          <button onClick={onContinueShopping} className="btn-primary mt-8">
            Browse products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-shell">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <span className="section-kicker">Checkout</span>
          <h1 className="section-title">Confirm delivery details and choose how you want to pay.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
            Keep the form simple, make the payment choice clear, and show proof-upload only when it is actually needed.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="surface-card-strong p-6 sm:p-8">
              <h2 className="text-3xl text-[color:var(--foreground)]">Delivery information</h2>
              <div className="mt-6 grid gap-5">
                <div>
                  <label className="field-label">Full name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className="input-field"
                    placeholder="Nguyen Van A"
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Phone number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="input-field"
                    placeholder="09xx xxx xxx"
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Delivery address *</label>
                  <textarea
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="textarea-field"
                    placeholder="Street, ward, district, city..."
                    required
                  />
                </div>
              </div>
            </div>

            <div className="surface-card-strong p-6 sm:p-8">
              <h2 className="text-3xl text-[color:var(--foreground)]">Payment method</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-[24px] border p-5 transition ${
                    paymentMethod === 'COD'
                      ? 'border-[color:var(--accent)] bg-[rgba(203,111,134,0.08)]'
                      : 'border-[color:var(--line)] bg-white/80'
                  }`}
                >
                  <input
                    type="radio"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(203,111,134,0.12)] text-[color:var(--accent-dark)]">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-[color:var(--foreground)]">Cash on delivery</p>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                        Customer pays when the bouquet is delivered.
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`cursor-pointer rounded-[24px] border p-5 transition ${
                    paymentMethod === 'QR'
                      ? 'border-[color:var(--accent)] bg-[rgba(203,111,134,0.08)]'
                      : 'border-[color:var(--line)] bg-white/80'
                  }`}
                >
                  <input
                    type="radio"
                    value="QR"
                    checked={paymentMethod === 'QR'}
                    onChange={() => setPaymentMethod('QR')}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(211,154,74,0.14)] text-[color:var(--gold)]">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-[color:var(--foreground)]">VietQR transfer</p>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                        Customer transfers first, then uploads payment proof for admin review.
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {paymentMethod === 'QR' && (
                <div className="mt-6 space-y-5">
                  {!showPaymentDetails ? (
                    <>
                      <button
                        type="button"
                        onClick={handleGenerateQr}
                        disabled={isGeneratingQr}
                        className="btn-secondary"
                      >
                        {isGeneratingQr ? 'Preparing transfer...' : 'Generate transfer details'}
                      </button>
                      {qrError && (
                        <p className="text-sm font-semibold text-red-600">{qrError}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="rounded-[28px] border border-[color:var(--line)] bg-white/86 p-6">
                        <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
                          <div className="flex aspect-square items-center justify-center rounded-[24px] border border-dashed border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(203,111,134,0.08),rgba(211,154,74,0.06))] p-5 text-center">
                            {qrImage ? (
                              <ImageWithFallback
                                src={qrImage}
                                alt="VietQR payment code"
                                className="h-full w-full rounded-[16px] object-contain"
                              />
                            ) : (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                                  Manual transfer
                                </p>
                                <p className="brand-heading mt-3 text-3xl text-[color:var(--foreground)]">
                                  QR unavailable
                                </p>
                                <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                                  Continue with the bank details on the right and upload your payment proof after transferring.
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                Amount to transfer
                              </p>
                              <p className="mt-2 text-3xl font-bold text-[color:var(--accent-dark)]">
                                {formatCurrency(total)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                Order number
                              </p>
                              <p className="mt-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                                {generatedOrderNumber || 'Generating...'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                Payment description
                              </p>
                              <p className="mt-2 rounded-2xl border border-[color:var(--line)] bg-[rgba(203,111,134,0.06)] px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                                {generatedTransferContent || paymentReference}
                              </p>
                            </div>
                            {bankInfo && (
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                    Account number
                                  </p>
                                  <p className="mt-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                                    {bankInfo.accountNo}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                    Account name
                                  </p>
                                  <p className="mt-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                                    {bankInfo.accountName}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                    Bank BIN
                                  </p>
                                  <p className="mt-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                                    {bankInfo.acqId}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                    Transfer mode
                                  </p>
                                  <p className="mt-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                                    {providerAvailable ? 'VietQR live' : 'Manual fallback'}
                                  </p>
                                </div>
                              </div>
                            )}
                            <p className="text-sm leading-7 text-[color:var(--muted)]">
                              After completing the transfer, upload a screenshot below so the order can move into payment verification.
                            </p>
                            <button type="button" onClick={handleGenerateQr} disabled={isGeneratingQr} className="btn-secondary">
                              {isGeneratingQr ? 'Refreshing...' : providerAvailable ? 'Refresh VietQR' : 'Retry VietQR'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {qrError && (
                        <p className="text-sm font-semibold text-red-600">{qrError}</p>
                      )}

                      <div>
                        <label className="field-label">Upload payment screenshot *</label>
                        <div className="rounded-[28px] border border-dashed border-[color:var(--line)] bg-white/80 p-4 sm:p-6">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="payment-screenshot-upload"
                          />
                          <label
                            htmlFor="payment-screenshot-upload"
                            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[22px] bg-[rgba(203,111,134,0.04)] px-6 py-10 text-center"
                          >
                            {paymentScreenshot ? (
                              <ImageWithFallback
                                src={paymentScreenshot}
                                alt="Payment screenshot"
                                className="max-h-56 w-full rounded-[18px] object-contain"
                              />
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-[color:var(--accent-dark)]" />
                                <div>
                                  <p className="text-sm font-semibold text-[color:var(--foreground)]">
                                    Click to upload payment proof
                                  </p>
                                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                                    JPG, PNG, or screenshot image from your banking app.
                                  </p>
                                </div>
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary w-full">
              Place order
            </button>
          </form>
        </section>

        <aside className="lg:pt-14">
          <div className="surface-card-strong sticky top-28 p-6 sm:p-8">
            <h2 className="text-3xl text-[color:var(--foreground)]">Order summary</h2>
            <div className="mt-6 space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">{item.product.name}</p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-[color:var(--foreground)]">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-[color:var(--line)] pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Total
                </span>
                <span className="text-3xl font-bold text-[color:var(--accent-dark)]">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-[color:var(--line)] bg-white/80 p-5">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">
                Payment review flow
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                QR orders should move to awaiting verification after proof upload. COD orders can stay simple and proceed straight to confirmation.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
