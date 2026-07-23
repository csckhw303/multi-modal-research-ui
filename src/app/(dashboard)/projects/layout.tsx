
import { Sidebar } from "@/components/layout/Sidebar";
import { auth} from "@clerk/nextjs/server"
import { redirect } from "next/navigation";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const {userId} = await auth();
  if (!userId) {
    redirect("/sign-in");
  } 
  return (
    <>
       <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </>
  );
};

export default DashboardLayout;