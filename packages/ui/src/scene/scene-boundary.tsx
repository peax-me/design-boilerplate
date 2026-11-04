"use client";

import { Component, type ReactNode } from "react";

interface SceneBoundaryProps {
  children: ReactNode;
  onError: () => void;
}

interface SceneBoundaryState {
  failed: boolean;
}

/* A scene that fails to load or render (rejected import, lost chunk, error rethrown by the canvas) renders nothing and reports it, instead of taking the page down. */
export class SceneBoundary extends Component<SceneBoundaryProps, SceneBoundaryState> {
  override state: SceneBoundaryState = { failed: false };

  static getDerivedStateFromError(): SceneBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(): void {
    this.props.onError();
  }

  override render(): ReactNode {
    if (this.state.failed) {
      return null;
    }
    return this.props.children;
  }
}
