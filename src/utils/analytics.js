export const GA_MEASUREMENT_ID = "G-N1ZCYZBPWQ";
// Log the page view when route changes
export const pageview = (url) => {
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// Log specific events
export const event = ({ action, params }) => {
  window.gtag("event", action, params);
};
