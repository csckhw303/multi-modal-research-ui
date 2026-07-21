
import { Sidebar } from "@/components/layout/Sidebar";
import { auth} from "@clerk/nextjs/server"
import { redirect } from "next/navigation";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const {userId} = await auth();
  if (!userId) {
    redirect("/sign-in");
  } 
  return (
    <div >
      <Sidebar />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
};

export default DashboardLayout;