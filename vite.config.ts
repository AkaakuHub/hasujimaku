import { randomUUID } from "node:crypto";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const buildId = randomUUID();

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [
    react(),
    {
      name: "build-version",
      apply: "build",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "version.json",
          source: JSON.stringify({ buildId }),
        });
      },
    },
  ],
});
