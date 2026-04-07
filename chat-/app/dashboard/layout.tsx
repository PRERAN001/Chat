export const metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Dashboard | Chat"
  }
};
export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}