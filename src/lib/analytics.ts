declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

export const initializeGoogleAnalytics = () => {
  const analyticsId = import.meta.env.VITE_GA_ID;

  if (!analyticsId) {
    return;
  }

  window.addEventListener(
    "load",
    () => {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
      document.head.append(script);

      window.dataLayer = window.dataLayer ?? [];
      window.gtag = (...args) => {
        window.dataLayer?.push(args);
      };
      window.gtag("js", new Date());
      window.gtag("config", analyticsId);
    },
    { once: true },
  );
};
