import type { Metadata } from 'next';
import { t } from '../../lib/i18n';
import { AppShell } from '../../views/app-shell';
import '../globals.css';

export const metadata: Metadata = { title: t('en').meta.title, robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell lang="en">{children}</AppShell>;
}
