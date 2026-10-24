import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  // Include the worker dependency up front: late discovery otherwise reloads
  // the first development session while the user is running their first PCA.
  optimizeDeps: { include: ["ml-pca", "plotly.js-basic-dist-min"] },
  test: { include: ["src/**/*.test.ts"] },
});
