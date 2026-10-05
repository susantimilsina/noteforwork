import { notFound } from 'next/navigation';
import { getPage } from '../../../../lib/content';
import { pageMetadata } from '../../../../lib/meta';
import { DocumentView } from '../../../../views/document';

const page = getPage('careers', 'careers', 'es');
export const metadata = page ? pageMetadata(page) : {};

export default function Empleo() {
  if (!page) notFound();
  return <DocumentView page={page} />;
}
