import { notFound } from 'next/navigation';
import { getPage, pagesOf } from '../../../../lib/content';
import { pageMetadata } from '../../../../lib/meta';
import { DocumentView } from '../../../../views/document';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => pagesOf('article', 'en').map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: Props) {
  const page = getPage('article', (await params).slug, 'en');
  return page ? pageMetadata(page) : {};
}

export default async function Article({ params }: Props) {
  const page = getPage('article', (await params).slug, 'en');
  if (!page) notFound();
  return <DocumentView page={page} />;
}
