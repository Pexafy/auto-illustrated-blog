import type { NextConfig } from "next";

// BASE_PATH serves the app under a path, for example /auto-illustrated-blog on a shared
// demo site. Unset, the app lives at the root, as on Vercel.
const basePath = process.env.BASE_PATH || undefined;

const nextConfig: NextConfig = {
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath ?? "" },
  output: "standalone",
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
