import { useEffect, useState } from "react";

import { whenIdle } from "./idle.ts";

/* False until the browser first goes idle, which is after the first paint; in a browser without idle callbacks (Safari), until the task after hydration (whenIdle). */
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
