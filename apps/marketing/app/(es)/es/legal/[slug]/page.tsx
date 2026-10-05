import { notFound } from 'next/navigation';
import { getPage, pagesOf } from '../../../../../lib/content';
import { pageMetadata } from '../../../../../lib/meta';
import { DocumentView } from '../../../../../views/document';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => pagesOf('legal', 'es').map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: Props) {
  const page = getPage('legal', (await params).slug, 'es');
  return page ? pageMetadata(page) : {};
}

export default async function Legal({ params }: Props) {
  const page = getPage('legal', (await params).slug, 'es');
  if (!page) notFound();
  return <DocumentView page={page} />;
}
