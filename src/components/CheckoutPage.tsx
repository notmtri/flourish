import { CreditCard, Landmark, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SiteCopy } from '../content';
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
  copy: SiteCopy['checkout'];
}

export default function CheckoutPage({
  cart,
  onPlaceOrder,
  onGenerateVietQr,
  onContinueShopping,
  copy,
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
      return copy.alerts.paymentReferenceFallback;
    }

    const pieces = trimmed.split(/\s+/).filter(Boolean);
    const initials = pieces.slice(0, 3).map((piece) => piece[0]?.toUpperCase()).join('');
    return `${initials} FLOURISH`;
  }, [customerName]);

  const handleGenerateQr = async () => {
    if (!customerName.trim()) {
      alert(copy.alerts.nameRequiredForQr);
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
        setQrError(data.error || copy.alerts.qrUnavailable);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.alerts.generateQrFailed;
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
      alert(copy.alerts.requiredFields);
      return;
    }

    if (paymentMethod === 'QR' && !paymentScreenshot) {
      alert(copy.alerts.uploadScreenshot);
      return;
    }

    if (paymentMethod === 'QR' && !generatedOrderNumber) {
      alert(copy.alerts.generateTransferDetails);
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
          <h1 className="text-4xl text-[color:var(--foreground)]">{copy.empty.title}</h1>
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
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <span className="section-kicker">{copy.page.kicker}</span>
          <h1 className="section-title">{copy.page.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
            {copy.page.copy}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="surface-card-strong p-6 sm:p-8">
              <h2 className="text-3xl text-[color:var(--foreground)]">{copy.page.deliveryTitle}</h2>
              <div className="mt-6 grid gap-5">
                <div>
                  <label className="field-label">{copy.page.fields.fullName}</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className="input-field"
                    placeholder={copy.page.placeholders.fullName}
                    required
                  />
                </div>

                <div>
                  <label className="field-label">{copy.page.fields.phone}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="input-field"
                    placeholder={copy.page.placeholders.phone}
                    required
                  />
                </div>

                <div>
                  <label className="field-label">{copy.page.fields.address}</label>
                  <textarea
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="textarea-field"
                    placeholder={copy.page.placeholders.address}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="surface-card-strong p-6 sm:p-8">
              <h2 className="text-3xl text-[color:var(--foreground)]">{copy.page.paymentTitle}</h2>
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
                      <p className="text-lg font-semibold text-[color:var(--foreground)]">{copy.page.codTitle}</p>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                        {copy.page.codCopy}
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
                      <p className="text-lg font-semibold text-[color:var(--foreground)]">{copy.page.qrTitle}</p>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                        {copy.page.qrCopy}
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
                        {isGeneratingQr ? copy.page.generatingQr : copy.page.generateQr}
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
                                  {copy.page.manualTransferLabel}
                                </p>
                                <p className="brand-heading mt-3 text-3xl text-[color:var(--foreground)]">
                                  {copy.page.qrUnavailableTitle}
                                </p>
                                <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                                  {copy.page.qrUnavailableCopy}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                {copy.page.amountLabel}
                              </p>
                              <p className="mt-2 text-3xl font-bold text-[color:var(--accent-dark)]">
                                {formatCurrency(total)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                {copy.page.orderNumberLabel}
                              </p>
                              <p className="mt-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                                {generatedOrderNumber || copy.alerts.generatingOrderNumber}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                {copy.page.paymentDescriptionLabel}
                              </p>
                              <p className="mt-2 rounded-2xl border border-[color:var(--line)] bg-[rgba(203,111,134,0.06)] px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                                {generatedTransferContent || paymentReference}
                              </p>
                            </div>
                            {bankInfo && (
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                    {copy.page.accountNumberLabel}
                                  </p>
                                  <p className="mt-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                                    {bankInfo.accountNo}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                    {copy.page.accountNameLabel}
                                  </p>
                                  <p className="mt-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                                    {bankInfo.accountName}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                    {copy.page.bankBinLabel}
                                  </p>
                                  <p className="mt-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                                    {bankInfo.acqId}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                                    {copy.page.transferModeLabel}
                                  </p>
                                  <p className="mt-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]">
                                    {providerAvailable ? copy.page.transferModeLive : copy.page.transferModeFallback}
                                  </p>
                                </div>
                              </div>
                            )}
                            <p className="text-sm leading-7 text-[color:var(--muted)]">
                              {copy.page.uploadCopy}
                            </p>
                            <button type="button" onClick={handleGenerateQr} disabled={isGeneratingQr} className="btn-secondary">
                              {isGeneratingQr ? copy.page.refreshingQr : providerAvailable ? copy.page.refreshQr : copy.page.retryQr}
                            </button>
                          </div>
                        </div>
                      </div>

                      {qrError && (
                        <p className="text-sm font-semibold text-red-600">{qrError}</p>
                      )}

                      <div>
                        <label className="field-label">{copy.page.uploadLabel}</label>
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
                                    {copy.page.uploadTitle}
                                  </p>
                                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                                    {copy.page.uploadCopySecondary}
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
              {copy.page.submit}
            </button>
          </form>
        </section>

        <aside className="lg:pt-14">
          <div className="surface-card-strong sticky top-28 p-6 sm:p-8">
            <h2 className="text-3xl text-[color:var(--foreground)]">{copy.page.summaryTitle}</h2>
            <div className="mt-6 space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">{item.product.name}</p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">{copy.page.quantityLabel(item.quantity)}</p>
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
                  {copy.page.totalLabel}
                </span>
                <span className="text-3xl font-bold text-[color:var(--accent-dark)]">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-[color:var(--line)] bg-white/80 p-5">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">
                {copy.page.reviewFlowTitle}
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                {copy.page.reviewFlowCopy}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
