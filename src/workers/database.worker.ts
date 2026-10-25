import { parseDatabase } from "../domain/database";
import type { Scaling } from "../domain/g25";
self.onmessage = (event: MessageEvent<{ text: string; scaling: Scaling }>) => {
  try {
    self.postMessage({
      result: parseDatabase(event.data.text, event.data.scaling),
    });
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error ? error.message : "Could not read this TSV.",
    });
  }
};
