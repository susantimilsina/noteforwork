import { SiteShell } from '../../components/site-shell';
import { rootMetadata } from '../../lib/meta';
import '../globals.css';

export const metadata = rootMetadata('es');

export default function SpanishLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell lang="es">{children}</SiteShell>;
}
