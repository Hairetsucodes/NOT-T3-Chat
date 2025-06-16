"use client";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";

export const SocialLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const onClick = async (provider: "google" | "github") => {
    setIsLoading(true);
    await signIn(provider, { callbackUrl: "/chat" });
  };
  return (
    <div className="justify-between w-full mt-4 flex gap-2">
      <Button
        variant={"outline"}
        disabled={isLoading}
        className="w-[calc(50%-4px)]"
        onClick={() => {
          onClick("google");
        }}
      >
        <FcGoogle className={"h-5 w-5"} />
      </Button>
      <Button
        disabled={isLoading}
        variant={"outline"}
        className="w-[calc(50%-4px)]"
        onClick={() => {
          onClick("github");
        }}
      >
        <FaGithub className={"h-5 w-5"} />
      </Button>
    </div>
  );
};
