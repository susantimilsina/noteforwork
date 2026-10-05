import { notFound } from 'next/navigation';
import { getPage } from '../../../lib/content';
import { pageMetadata } from '../../../lib/meta';
import { DocumentView } from '../../../views/document';

const page = getPage('careers', 'careers', 'en');
export const metadata = page ? pageMetadata(page) : {};

export default function Careers() {
  if (!page) notFound();
  return <DocumentView page={page} />;
}
