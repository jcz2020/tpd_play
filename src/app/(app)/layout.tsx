import AcousticHarmonyApp from '@/components/AcousticHarmonyApp';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AcousticHarmonyApp>
      {children}
    </AcousticHarmonyApp>
  );
}
