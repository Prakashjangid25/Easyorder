export const YOUPI_CONFIG = {
  scriptUrl: import.meta.env.VITE_YOUPI_SCRIPT_URL || 'https://pay.yourdomain.com/youpi.js',
  publicKey: import.meta.env.VITE_YOUPI_PUBLIC_KEY || '',
};

let isLoaded = false;
let loadPromise = null;

export function loadYoupi() {
  if (isLoaded) return Promise.resolve(window.Youpi);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = YOUPI_CONFIG.scriptUrl;
    script.dataset.youpiKey = YOUPI_CONFIG.publicKey;
    script.dataset.currency = 'INR';
    script.async = true;
    script.onload = () => {
      isLoaded = true;
      resolve(window.Youpi);
    };
    script.onerror = () => reject(new Error('YouPI script load failed'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function youpiPay(params, callbacks) {
  return loadYoupi().then((Youpi) => {
    return new Promise((resolve, reject) => {
      Youpi.pay({
        order_id: params.orderId,
        amount: String(params.amount),
        currency: 'INR',
        name: params.name || 'EasyOrder',
        description: params.description || 'Order Payment',
        handler: (res) => {
          callbacks?.onSuccess?.(res);
          resolve(res);
        },
        onClose: () => {
          callbacks?.onClose?.();
          reject(new Error('user_closed'));
        }
      });
    });
  });
}
