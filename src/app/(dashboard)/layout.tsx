import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import SchoolLogo from "@/components/SchoolLogo";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex">
      <Menu />
      {/* RIGHT */}
      <div className="flex-1 bg-[#F7F8FA] overflow-scroll flex flex-col">
        <div className="sticky top-0 z-20 bg-white">
          <div className="lg:hidden h-16 flex items-center px-4">
            <SchoolLogo className="ml-12" />
          </div>
          <div className="hidden lg:flex h-16 items-center px-4">
            <SchoolLogo />
          </div>
          <Navbar />
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
