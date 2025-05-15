/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{
            protocol: "https", hostname: "image.tmdb.org", port: "",
        }, {
            protocol: "https", hostname: "api.resend.com", port: "",
        }, {
            protocol: "https", hostname: "images.unsplash.com", port: "",
        }, {
            protocol: "https", hostname: "drive.google.com", port: "",
        }, {
            protocol: "https", hostname: "zdcryvewjhsccriuzltq.supabase.co", port: "",
        }, {
            protocol: "https", hostname: "*.sharkv.my", port: "",
        }, {
            protocol: "https", hostname: "sharkv-dev.s3.amazonaws.com", port: ""
        }, {
            protocol: "https", hostname: "s3.ap-southeast-1.wasabisys.com", port: ""
        }], // Add image optimization settings
        minimumCacheTTL: 60, deviceSizes: [640, 750, 828, 1080, 1200], imageSizes: [16, 32, 48, 64, 96],
    },

    // Enable compiler optimizations
    swcMinify: true,

    // Recommended performance optimizations
    compiler: {
        // Remove console.logs in production
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // // Configure Beasties for CSS optimization
    // experimental: {
    //   optimizeCss: {
    //     strategy: 'swap', // Use swap strategy for better performance
    //     inlineThreshold: 0, // Inline all small stylesheets
    //     minimumExternalSize: 4096, // Inline if external file would be smaller than 4KB
    //     preload: 'swap',
    //     noscriptFallback: true,
    //     inlineFonts: false,
    //     preloadFonts: true,
    //     compress: true,
    //     logLevel: 'warn'
    //   }
    // },

    // Enable response compression
    compress: true,

    // Disable production source maps for better performance
    productionBrowserSourceMaps: false,

    // Strict mode for a better development experience
    reactStrictMode: true,
};

module.exports = nextConfig;
