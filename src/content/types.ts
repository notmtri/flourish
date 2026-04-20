export interface ReviewContent {
  id: string;
  customerName: string;
  productName: string;
  rating: number;
  feedback: string;
  avatar: string;
}

export interface SiteCopy {
  header: {
    brandName: string;
    brandTagline: string;
    nav: {
      home: string;
      products: string;
      cart: string;
    };
    adminAriaLabel: string;
    cartAriaLabel: string;
    logoAlt: string;
  };
  footer: {
    description: string;
    socialLinks: {
      instagram: string;
      facebook: string;
    };
    quickAccessTitle: string;
    connectTitle: string;
    contact: {
      email: string;
      phone: string;
      location: string;
    };
    bottomLine: string;
    bottomTagline: string;
  };
  home: {
    heroKicker: string;
    heroTitle: string;
    heroCopy: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stats: Array<{
      value: string;
      label: string;
    }>;
    signature: {
      kicker: string;
      title: string;
      copy: string;
    };
    brandStory: {
      kicker: string;
      title: string;
      paragraphs: string[];
    };
    whyFlourish: {
      kicker: string;
      title: string;
      copy: string;
      features: Array<{
        title: string;
        description: string;
      }>;
    };
    occasions: {
      kicker: string;
      title: string;
      items: Array<{
        title: string;
        description: string;
      }>;
    };
    reviews: {
      kicker: string;
      title: string;
      copy: string;
    };
  };
  products: {
    listing: {
      kicker: string;
      title: string;
      copy: string;
      bestSellersTitle: string;
      bestSellersCopy: string;
      allProductsTitle: string;
      availableLabel: (count: number) => string;
      emptyTitle: string;
      emptyCopy: string;
      bestSellerPill: string;
      popularPill: string;
      inCartLabel: (count: number) => string;
    };
    detail: {
      backToShop: string;
      bestSellerPill: string;
      inCartPill: (count: number) => string;
      cards: Array<{
        title: string;
        description: string;
      }>;
      addToCart: string;
      keepBrowsing: string;
      galleryAlt: (productName: string, index: number) => string;
    };
  };
  cart: {
    empty: {
      title: string;
      copy: string;
      cta: string;
    };
    page: {
      kicker: string;
      title: string;
      copy: string;
      summaryTitle: string;
      itemsLabel: string;
      deliveryLabel: string;
      deliveryValue: string;
      paymentLabel: string;
      paymentValue: string;
      totalLabel: string;
      checkoutCta: string;
      continueCta: string;
    };
  };
  checkout: {
    empty: {
      title: string;
      copy: string;
      cta: string;
    };
    page: {
      kicker: string;
      title: string;
      copy: string;
      deliveryTitle: string;
      fields: {
        fullName: string;
        phone: string;
        address: string;
      };
      placeholders: {
        fullName: string;
        phone: string;
        address: string;
      };
      paymentTitle: string;
      codTitle: string;
      codCopy: string;
      qrTitle: string;
      qrCopy: string;
      generateQr: string;
      generatingQr: string;
      manualTransferLabel: string;
      qrUnavailableTitle: string;
      qrUnavailableCopy: string;
      amountLabel: string;
      orderNumberLabel: string;
      paymentDescriptionLabel: string;
      accountNumberLabel: string;
      accountNameLabel: string;
      bankBinLabel: string;
      transferModeLabel: string;
      transferModeLive: string;
      transferModeFallback: string;
      uploadCopy: string;
      refreshQr: string;
      retryQr: string;
      refreshingQr: string;
      uploadLabel: string;
      uploadTitle: string;
      uploadCopySecondary: string;
      submit: string;
      summaryTitle: string;
      quantityLabel: (count: number) => string;
      totalLabel: string;
      reviewFlowTitle: string;
      reviewFlowCopy: string;
    };
    alerts: {
      nameRequiredForQr: string;
      requiredFields: string;
      uploadScreenshot: string;
      generateTransferDetails: string;
      qrUnavailable: string;
      generateQrFailed: string;
      paymentReferenceFallback: string;
      generatingOrderNumber: string;
    };
  };
  app: {
    addedToCart: (productName: string) => string;
    placeOrderFailed: string;
    deleteProductConfirm: string;
    addProductFailed: string;
    updateProductFailed: string;
    deleteProductFailed: string;
    deleteOrderConfirm: (orderNumber: string) => string;
    deleteOrderFailed: string;
    updateOrderFailed: string;
    backendLoadingTitle: string;
    backendLoadingCopy: string;
    loading: {
      placingOrderTitle: string;
      placingOrderCopy: string;
      generatingQrTitle: string;
      generatingQrCopy: string;
      adminLoginTitle: string;
      adminLoginCopy: string;
      savingProductTitle: string;
      savingProductCopy: string;
      deletingProductTitle: string;
      deletingProductCopy: string;
      updatingOrderTitle: string;
      updatingOrderCopy: string;
      deletingOrderTitle: string;
      deletingOrderCopy: string;
    };
    adminLogin: {
      kicker: string;
      title: string;
      copy: string;
      usernameLabel: string;
      usernamePlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      login: string;
      cancel: string;
      footnote: string;
    };
    orderSuccess: {
      kicker: string;
      title: string;
      copy: string;
      homeCta: string;
      productsCta: string;
    };
  };
}
