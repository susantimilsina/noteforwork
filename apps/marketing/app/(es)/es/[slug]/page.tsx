import { notFound } from 'next/navigation';
import { getPage, pagesOf } from '../../../../lib/content';
import { pageMetadata } from '../../../../lib/meta';
import { DocumentView } from '../../../../views/document';

type Props = { params: Promise<{ slug: string }> };

/** Spanish articles: translations (content/pages-es) and Spanish-original pages. */
export const dynamicParams = false;
export const generateStaticParams = () => pagesOf('article', 'es').map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: Props) {
  const page = getPage('article', (await params).slug, 'es');
  return page ? pageMetadata(page) : {};
}

export default async function Articulo({ params }: Props) {
  const page = getPage('article', (await params).slug, 'es');
  if (!page) notFound();
  return <DocumentView page={page} />;
}
