"use client";
import Register from "@/components/authorization/Register";
import SignIn from "@/components/authorization/SignIn";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { ModeToggle } from "@/components/settings/theme/Toggle";

export default function Home() {
  const [selectedModal, setSelectedModal] = useState<"signIn" | "register">(
    "signIn"
  );
  const { data: session } = useSession();
  if (session) {
    redirect("/chat");
  }
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {/* Theme toggle positioned at top right */}
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      {selectedModal === "signIn" ? <SignIn /> : <Register />}
      <Button
        onClick={() => {
          if (selectedModal === "signIn") {
            setSelectedModal("register");
          } else {
            setSelectedModal("signIn");
          }
        }}
      >
        {selectedModal === "signIn" ? "Register" : "Sign In"}
      </Button>
    </div>
  );
}
