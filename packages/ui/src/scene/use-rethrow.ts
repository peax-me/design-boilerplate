import { useCallback, useState } from "react";

/* An error caught outside rendering (a frame of the ticker, a promise) is thrown again in the next render, where the stage's error boundary sees it and brings the poster back. */
export function useRethrow(): (error: unknown) => void {
  const [failure, setFailure] = useState<Error | null>(null);
  const rethrow = useCallback((error: unknown) => {
    setFailure(error instanceof Error ? error : new Error("The scene failed", { cause: error }));
  }, []);

  if (failure !== null) {
    throw failure;
  }
  return rethrow;
}
