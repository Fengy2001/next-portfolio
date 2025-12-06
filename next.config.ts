import type { NextConfig } from "next";
import { output } from "three/tsl";

const nextConfig: NextConfig = {
  output: "standalone",
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: 'asset/source'
    });

    return config;
  }
};

export default nextConfig;
