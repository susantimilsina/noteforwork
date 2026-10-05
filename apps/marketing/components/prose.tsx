import { renderHtml } from '../lib/content';

/** Renders sanitized, imported page HTML with the site's article typography. */
export function Prose({ html }: { html: string }) {
  return <div className="prose-nfw" dangerouslySetInnerHTML={{ __html: renderHtml(html) }} />;
}
