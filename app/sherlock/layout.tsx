import { InfoPanelProvider } from "@/components/sherlock/info-panel";

export default function SherlockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="theme-sherlock">
      <InfoPanelProvider>{children}</InfoPanelProvider>
    </div>
  );
}
