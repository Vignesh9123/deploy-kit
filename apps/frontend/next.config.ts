import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins:['fe.vignesh-tech.me'] // TODO: Will remove once deployment is changed from dev to prod
};

export default nextConfig;
