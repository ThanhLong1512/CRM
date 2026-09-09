import type { NextConfig } from "next";

/**
 * PWA (future): wrap this config with @serwist/next when enabling offline CRM.
 *
 * Conceptual setup:
 *   import withSerwistInit from "@serwist/next";
 *   const withSerwist = withSerwistInit({
 *     swSrc: "src/sw.ts",
 *     swDest: "public/sw.js",
 *   });
 *   export default withSerwist(nextConfig);
 *
 * Install later: `npm install @serwist/next serwist` and add a service worker source.
 * Deferred here so the boilerplate compiles without extra PWA tooling.
 */
const nextConfig: NextConfig = {
  devIndicators: false,
  // reload trigger: 2026-09-09
};

export default nextConfig;
