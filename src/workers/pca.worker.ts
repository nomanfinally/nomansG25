import { calculatePca } from "../domain/pca";
import type { Scaling } from "../domain/g25";

self.onmessage = (event: MessageEvent<{ text: string; scaling: Scaling }>) => {
  try {
    self.postMessage({
      result: calculatePca(event.data.text, event.data.scaling),
    });
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error
          ? error.message
          : "The PCA could not be calculated. Check the coordinate rows and try again.",
    });
  }
};
