import { SiteShell } from '../../components/site-shell';
import { rootMetadata } from '../../lib/meta';
import '../globals.css';

export const metadata = rootMetadata('en');

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell lang="en">{children}</SiteShell>;
}
