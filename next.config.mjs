// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/submit-code/:path*',
        destination: 'https://submit-code-next.vercel.app/:path*', // Trỏ tới dự án submit-code đã được triển khai trên Vercel
      },
    ];
  },
};
