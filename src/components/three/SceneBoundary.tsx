import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Boxes, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Shown instead of the 3D scene when WebGL is unavailable or a scene faults. */
  label?: string;
}

interface State {
  failed: boolean;
}

/**
 * WebGL is the one dependency a visitor might not have. A failure inside the
 * canvas must never take the page down with it, so the scene is boxed in.
 */
export class SceneBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[yotoqhonam] 3D scene failed, falling back to a static plan', error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="absolute inset-0 grid place-items-center px-6">
          <div className="max-w-sm text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-graphite-950/10 bg-ink-900 text-text-mist">
              <Boxes className="size-5" strokeWidth={1.5} />
            </span>
            <p className="mt-4 font-display text-base font-semibold text-text">
              The 3D plan needs WebGL
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-mist text-pretty">
              Your browser turned hardware acceleration off. Every other part of Yotoqhonam works
              without it — the room list, the duty checklist, and photo reports are all still here.
            </p>
            <button
              onClick={() => this.setState({ failed: false })}
              className="btn-ghost btn-sm mt-4"
              type="button"
            >
              <RefreshCw className="size-3.5" strokeWidth={1.7} />
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
