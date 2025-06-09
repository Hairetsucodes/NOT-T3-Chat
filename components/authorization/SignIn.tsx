"use client";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import { zodResolver } from "@hookform/resolvers/zod";
import FormError from "@/components/authorization/forms/form-error";
import FormSuccess from "@/components/authorization/forms/form-success";
import { login } from "@/lib/auth/login";
import React, { startTransition } from "react";
import { LoginSchema } from "@/schemas/loginSchema";
import { useState } from "react";
import { SocialLogin } from "@/components/authorization/SocialSignUp";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

export default function SignIn() {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });
  function onSubmit(values: z.infer<typeof LoginSchema>) {
    setError("");
    setSuccess("");
    setIsLoading(true);

    startTransition(async () => {
      try {
        const result = await login(values);

        if (result?.error) {
          setError(result.error);
          setIsLoading(false);
        } else if (result?.success) {
          setSuccess(result.success);
          // Wait a moment to show success message, then redirect
          setTimeout(() => {
            router.push("/dashboard");
            router.refresh();
          }, 1000);
        }
      } catch (error) {
        console.error("Login error:", error);
        setError("Something went wrong. Please try again.");
        setIsLoading(false);
      }
    });
  }
  return (
    <div>
      <>
        <h2 className="mt-6 text-center text-3xl font-extrabold ">
          Sign in to your account
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className=" flex items-center justify-center bg-card "
        >
          <div className="max-w-md w-full space-y-4 px-10 bg-card   rounded-md">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mt-8 space-y-4"
              >
                <div className="rounded-md shadow-sm space-y-4">
                  <FormField
                    name={"email"}
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-sm font-medium ">
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="mt-1 block w-full bg-card rounded-md border-green-800 shadow-sm focus:border-green-700 focus:ring focus:ring-green-700 focus:ring-opacity-50"
                            placeholder=""
                            autoComplete={"email"}
                            type="text"
                            required
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    name={"password"}
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-sm font-medium ">
                          Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="mt-1 block w-full bg-card rounded-md border-green-800 shadow-sm focus:border-green-700 focus:ring focus:ring-green-700 focus:ring-opacity-50"
                            placeholder=""
                            autoComplete={"current-password"}
                            type="password"
                            required
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormError message={error} />
                  <FormSuccess message={success} />
                  <Button
                    className={"w-full flex justify-center"}
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="mt-4 relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <div className="mt-4">
              <SocialLogin isLoading={isLoading} setisLoading={setIsLoading} />
            </div>
          </div>
        </motion.div>
      </>
    </div>
  );
}
