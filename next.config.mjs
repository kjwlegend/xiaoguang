import webpack from "webpack"

const mode = process.env.BUILD_MODE ?? "standalone"
console.log("[Next] build mode", mode)

const disableChunk = !!process.env.DISABLE_CHUNK || mode === "export"
console.log("[Next] build with chunk: ", !disableChunk)


/** @type {import('next').NextConfig} */
const nextConfig = {

  webpack (config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    })

    if (disableChunk) {
      config.plugins.push(
        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
      )
    }

    config.resolve.fallback = {
      child_process: false,

    }

    return config
  },
  distDir: "build",
  output: mode,
  images: {
    unoptimized: mode === "export",
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
    ],
  },
  experimental: {
    forceSwcTransforms: true,
  },


  generateBuildId: async () => {
    // You can, for example, get the latest git commit hash here
    return 'my-build-id1117'
  },


}


const CorsHeaders = [
  { key: "Access-Control-Allow-Credentials", value: "true" },
  { key: "Access-Control-Allow-Origin", value: "*" },
  {
    key: "Access-Control-Allow-Methods",
    value: "*",
  },
  {
    key: "Access-Control-Allow-Headers",
    value: "*",
  },
  {
    key: "Access-Control-Max-Age",
    value: "86400",
  },
]

if (mode !== "export") {
  nextConfig.headers = async () => {
    return [
      {
        source: "/api/:path*",
        headers: CorsHeaders,
      },
    ]
  }

  nextConfig.rewrites = async () => {
    const ret = [
      {
        source: "/api/proxy/:path*",
        destination: "https://api.openai.com/:path*",
      },
      {
        source: "/google-fonts/:path*",
        destination: "https://fonts.googleapis.com/:path*",
      },
      {
        source: "/sharegpt",
        destination: "https://sharegpt.com/api/conversations",
      },
    ]

    return {
      beforeFiles: ret,
    }
  }
}

export default nextConfig