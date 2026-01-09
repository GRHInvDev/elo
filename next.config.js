/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "ufs.sh",
      },
    ],
  },
  // Configurações para WebSocket
  async headers() {
    return [
      {
        // Aplicar headers a todas as rotas da API
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
    ];
  },
};

export default config;

/**
 *  (`¬´)
 * (|  |) @jdalmeida
 */


/**
⠀⠀⠀⠀⠀⢀⡀⠤⠤⠤⠤⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢀⡤⠂⠁⠀⠀⠀⠀⣆⣢⢄⠀⠉⠒⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠉⠙⠛⠻⢶⡤⠄⢀⣿⢀⠡⠷⠄⠀⠀⠑⢤⠒⢩⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⡠⠂⠁⠀⠀⠀⠛⠁⠔⣨⣅⡢⡀⠀⠈⡦⠎⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠜⠀⠀⠀⠀⠀⠀⠀⠸⡘⠀⡀⠹⡞⠀⠀⣾⢥⠂⢄⠀⣀⠀⠀⠀
⠀⡌⠀⠀⢀⣠⣤⠆⠀⠀⠀⢣⢰⡞⠀⠹⡀⣽⡾⠀⢢⢈⢃⠔⢙⣄⠀
⢰⠀⣠⡴⠟⠻⠁⠀⠀⢢⣏⢖⡝⠡⠤⠐⠛⢿⠿⠀⣸⠀⡢⡎⠠⢬⠆
⢨⡴⠉⠀⠀⠇⠀⢀⣴⡿⢿⡶⠭⡥⢤⡴⢂⠁⠀⢰⣆⠻⣄⣘⣴⠖⠀
⠈⠀⠀⠀⠀⠀⢠⠞⢡⠊⣤⡒⢋⠀⡇⠀⠈⣇⡒⠊⡢⠤⠖⠁⠀⠀⠀
⠀⠀⠀⠀⠀⣇⠋⠀⢨⣦⠜⠈⡏⠓⢃⠀⢀⠇⠈⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠘⠀⠀⠀⠹⣧⠘⠁⠀⣄⣶⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠯⠿⡟⠻⡏⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡰⢠⣷⢁⡤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢀⣅⠃⠓⢊⠑⠠⠖⢢⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢀⡠⠵⠬⣄⢀⠱⠓⠟⠉⢉⠝⠂⠄⡀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⡰⠛⠒⠠⠀⠈⢢⠀⣾⠀⢰⠁⠀⠀⠀⠈⢢⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠊⠀⠀⠀⠀⢱⣀⡼⠊⠉⠙⠛⠒⠒⠶⠒⠒⠋⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠲⠤⠤⠤⠖⠚⠉⠀⠀⠀⠀⠀⠀ @rbxyz
 */