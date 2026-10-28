"use client";

import { MotionProvider } from "@repo/ui/motion/motion-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

import { getQueryClient } from "@/lib/query-client";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <MotionProvider>{children}</MotionProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
