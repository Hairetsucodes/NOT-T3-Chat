"use client";
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

interface SocialLoginProps {
  setisLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}
export const SocialLogin = ({ setisLoading, isLoading }: SocialLoginProps) => {
  const onClick = async (provider: "google" | "github" | "linkedin") => {
    setisLoading(true);
    await signIn(provider, { callbackUrl: DEFAULT_LOGIN_REDIRECT });
  };
  return (
    <div className="flex items-center justify-center w-full gap-x-2">
      <Button
        size={"lg"}
        variant={"outline"}
        disabled={isLoading}
        className={"w-full"}
        onClick={() => {
          onClick("google");
        }}
      >
        <FcGoogle className={"h-5 w-5"} />
      </Button>
      <Button
        size={"lg"}
        disabled={isLoading}
        variant={"outline"}
        className={"w-full"}
        onClick={() => {
          onClick("github");
        }}
      >
        <FaGithub className={"h-5 w-5"} />
      </Button>
      <Button
        size={"lg"}
        disabled={isLoading}
        variant={"outline"}
        className={"w-full"}
        onClick={() => {
          onClick("linkedin");
        }}
      >
        <FaLinkedin className={"h-5 w-5"} />
      </Button>
    </div>
  );
};
