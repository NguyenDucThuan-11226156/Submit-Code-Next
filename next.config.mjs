// // import type { NextConfig } from 'next';
// import type { NextConfig } from 'next';

// const isProd = process.env.NODE_ENV === 'production';
const isProd = process.env.NODE_ENV === 'production';

// const nextConfig = {
//   /* config options here */
//   basePath: isProd ? '/submit-code' : '',
//   trailingSlash: false,
// };
const nextConfig = {
  /* config options here */
  basePath: isProd ? '/submit-code' : '',
  trailingSlash: false,
};

// export default nextConfig;
export default nextConfig;