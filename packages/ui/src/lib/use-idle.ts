import { useEffect, useState } from "react";

import { whenIdle } from "./idle.ts";

/* False until the browser first goes idle, which is after the first paint. */
export function useIdle(): boolean {
  const [idle, setIdle] = useState(false);

  useEffect(
    () =>
      whenIdle(() => {
        setIdle(true);
      }),
    [],
  );

  return idle;
}
