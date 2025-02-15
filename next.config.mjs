const nextConfig = {
  trailingSlash: false,
  async rewrites() {
    return [
      {
        source: "/submit-code/:path*",
        destination: "https://submit-code-next.vercel.app/:path*", // Submit Code (Thuan)
      },
      // Các điều hướng khác...
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
