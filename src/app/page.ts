import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/dist/client/components/navigation";
import Image from "next/image";

export default async function Home() {
  const {userId} = await auth();
  console.log("User ID:", userId);
  if (!userId) {
    redirect("/sign-in"); 
  } else {
    redirect("/projects")
  }
  
}
