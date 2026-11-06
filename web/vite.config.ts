import path, { resolve } from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import monacoEditorPlugin from "vite-plugin-monaco-editor";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "PROXY_");
  const proxyHost =
    process.env.PROXY_HOST || env.PROXY_HOST || "127.0.0.1:8971";

  const proxyProtocol =
    process.env.PROXY_PROTOCOL || env.PROXY_PROTOCOL || "https";
  const proxyTarget = `${proxyProtocol}://${proxyHost}`;

  return {
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          secure: false,
          ws: true,
        },
        "/vod": {
          target: proxyTarget,
          secure: false,
        },
        "/clips": {
          target: proxyTarget,
          secure: false,
        },
        "/exports": {
          target: proxyTarget,
          secure: false,
        },
        "/ws": {
          target: proxyTarget,
          secure: false,
          ws: true,
        },
        "/live": {
          target: proxyTarget,
          secure: false,
          ws: true,
        },
      },
    },
    build: {
      rolldownOptions: {
        input: {
          main: resolve(import.meta.dirname, "index.html"),
          login: resolve(import.meta.dirname, "login.html"),
        },
        output: {
          keepNames: true,
        },
      },
    },
    plugins: [
      {
        name: "architel-login-page",
        configureServer(server) {
          server.middlewares.use((request, _response, next) => {
            if (request.url?.split("?")[0] === "/login") {
              request.url = request.url.replace(/^\/login/, "/login.html");
            }
            next();
          });
        },
      },
      react(),
      monacoEditorPlugin.default({
        customWorkers: [{ label: "yaml", entry: "monaco-yaml/yaml.worker" }],
        languageWorkers: ["editorWorkerService"], // we don't use any of the default languages
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  };
});
