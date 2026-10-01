import { Link, useLocation } from 'react-router-dom';
import { ButtonLink } from '../components/ui/Button';

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-5">
      <div className="blueprint pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brass-400/[0.07] blur-[120px]" />

      <div className="relative max-w-lg text-center">
        <p className="engrave">404 · no such room</p>
        <h1 className="mt-4 font-display text-display-lg font-semibold leading-[0.9] text-text">
          That corridor
          <br />
          <span className="text-brass-600">doesn’t exist</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[42ch] text-sm leading-relaxed text-text-mist text-pretty">
          Nothing is registered at{' '}
          <code className="rounded-md border border-graphite-950/10 bg-graphite-950/[0.06] px-1.5 py-0.5 font-mono text-xs text-text">
            {pathname}
          </code>
          . The floor plan, your duty, and the demo sign-in are all still where you left them.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-2.5">
          <ButtonLink to="/dashboard">Go to the overview</ButtonLink>
          <ButtonLink to="/floor" variant="ghost">
            Open the floor plan
          </ButtonLink>
        </div>
        <p className="mt-8 text-xs text-text-dim">
          Wrong link?{' '}
          <Link to="/" className="link-underline text-text-mist">
            Back to the site
          </Link>
        </p>
      </div>
    </main>
  );
}
