import { Layout } from '@/components/layout/layout';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}