import { calculatePca, fitPca } from "../domain/pca";
import type { G25Dataset, Scaling } from "../domain/g25";
self.onmessage = (
  event: MessageEvent<{ text: string; scaling: Scaling; dataset?: G25Dataset }>,
) => {
  try {
    self.postMessage({
      result: event.data.dataset
        ? fitPca(event.data.dataset)
        : calculatePca(event.data.text, event.data.scaling),
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
