import type { NextConfig } from "next";

/* Set by the Pages workflow: a static export served under the repository path (ADR-0023).
   Partial prerendering needs a server, so the export turns it off; every route is static anyway. */
const pagesBasePath = process.env["PAGES_BASE_PATH"];
const serverRendering = pagesBasePath === undefined;

const nextConfig: NextConfig = {
  ...(serverRendering ? {} : { output: "export", basePath: pagesBasePath }),
  env: { NEXT_PUBLIC_BASE_PATH: pagesBasePath ?? "" },
  cacheComponents: serverRendering,
  partialPrefetching: serverRendering,
  reactCompiler: true,
  typedRoutes: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75],
    unoptimized: !serverRendering,
  },
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
