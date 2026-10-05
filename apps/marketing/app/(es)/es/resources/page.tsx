import type { Metadata } from 'next';
import { t } from '../../../../content/i18n';
import { alternates } from '../../../../lib/meta';
import { ResourcesView } from '../../../../views/resources';

export const metadata: Metadata = {
  title: t('es').resources.metaTitle,
  description: t('es').resources.metaDescription,
  alternates: alternates('es', '/es/resources'),
};

export default function Recursos() {
  return <ResourcesView lang="es" />;
}
