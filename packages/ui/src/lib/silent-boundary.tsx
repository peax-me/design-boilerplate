"use client";

import { Component, type ReactNode } from "react";

interface SilentBoundaryProps {
  children: ReactNode;
  onError?: () => void;
}

interface SilentBoundaryState {
  failed: boolean;
}

/* A part of the page that fails to load or render (rejected import, lost chunk, error rethrown by a canvas) renders nothing and reports it, instead of taking the page down. */
export class SilentBoundary extends Component<SilentBoundaryProps, SilentBoundaryState> {
  override state: SilentBoundaryState = { failed: false };

  static getDerivedStateFromError(): SilentBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(): void {
    this.props.onError?.();
  }

  override render(): ReactNode {
    if (this.state.failed) {
      return null;
    }
    return this.props.children;
  }
}
