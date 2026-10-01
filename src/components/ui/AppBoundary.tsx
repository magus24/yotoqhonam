import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface State {
  error: Error | null;
}

/** Last line of defence. GitHub Pages must never show a blank white page. */
export class AppBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[yotoqhonam] unhandled render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="grid min-h-dvh place-items-center px-5">
        <div className="max-w-md text-center">
          <p className="engrave">Something broke</p>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-text">
            The app hit an error
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-text-mist text-pretty">
            Reloading usually clears it — the demo keeps your duty state in this browser, so nothing
            is lost.
          </p>
          <pre className="mt-5 max-h-32 overflow-auto rounded-xl border border-graphite-950/[0.09] bg-ink-900 p-3 text-left font-mono text-[11px] leading-relaxed text-alert">
            {this.state.error.message}
          </pre>
          <div className="mt-6 flex justify-center gap-2.5">
            <button
              onClick={() => {
                this.setState({ error: null });
              }}
              className="btn-ghost btn-sm"
              type="button"
            >
              <RefreshCw className="size-3.5" strokeWidth={1.7} />
              Retry
            </button>
            <button onClick={() => window.location.reload()} className="btn-primary btn-sm" type="button">
              Reload the page
            </button>
          </div>
        </div>
      </main>
    );
  }
}
