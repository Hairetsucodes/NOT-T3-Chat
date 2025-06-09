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
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
