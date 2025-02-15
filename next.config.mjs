const isFitDomain = typeof window !== 'undefined' && window.location.hostname === 'fit.neu.edu.vn';

const nextConfig = {
  /* config options here */
  basePath: isFitDomain ? '/submit-code' : '',
  trailingSlash: false,
};

export default nextConfig;
