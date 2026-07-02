/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prevent webpack from bundling these packages — they must run through
    // Node's native require so pdfjs-dist's module initialisation works correctly.
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  },

  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      // pptxgenjs dynamically imports node:fs / node:https at runtime.
      // Strip the node: prefix so webpack can then stub via resolve.fallback.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        })
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
        http: false,
        path: false,
        os: false,
        stream: false,
        buffer: false,
        url: false,
        util: false,
        zlib: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
