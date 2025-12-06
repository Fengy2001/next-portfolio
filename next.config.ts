import type { NextConfig } from "next";
import { output } from "three/tsl";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: 'asset/source'
    });

    config.module.export = {
      output: "standalone",
    };

    return config;
  }
};

export default nextConfig;
