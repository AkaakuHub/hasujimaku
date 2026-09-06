import { Component, type ReactNode } from "react";

interface LazyLoadBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface LazyLoadBoundaryState {
  hasError: boolean;
}

export default class LazyLoadBoundary extends Component<
  LazyLoadBoundaryProps,
  LazyLoadBoundaryState
> {
  state: LazyLoadBoundaryState = { hasError: false };

  static getDerivedStateFromError(): LazyLoadBoundaryState {
    return { hasError: true };
  }

  render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
