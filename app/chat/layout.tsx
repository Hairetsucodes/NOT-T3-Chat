import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await auth();
  if (!user) {
    redirect("/");
  }
  return (
    <div className="">
      <div className="">{children}</div>
    </div>
  );
}
