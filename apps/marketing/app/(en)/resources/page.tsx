import type { Metadata } from 'next';
import { t } from '../../../content/i18n';
import { alternates } from '../../../lib/meta';
import { ResourcesView } from '../../../views/resources';

export const metadata: Metadata = {
  title: t('en').resources.metaTitle,
  description: t('en').resources.metaDescription,
  alternates: alternates('en', '/resources.html'),
};

export default function Resources() {
  return <ResourcesView lang="en" />;
}
