/// <reference types="next/image-types/global" />

declare namespace NodeJS {
  interface ProcessEnv {
    /* Path the site is served under; empty outside the GitHub Pages build (next.config.ts). */
    readonly NEXT_PUBLIC_BASE_PATH: string;
  }
}
