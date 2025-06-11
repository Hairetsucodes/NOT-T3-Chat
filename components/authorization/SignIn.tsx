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
import FormResults from "@/components/authorization/form/Results";
import { login } from "@/lib/auth/login";
import { startTransition, useState } from "react";
import { LoginSchema } from "@/schemas/login";
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
            router.push("/chat");
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
    <div className="flex min-h-screen items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-foreground">
              Sign in to your account
            </h2>
          </div>

          <div className="bg-card rounded-lg shadow-md p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="w-full"
                          placeholder="Enter your email"
                          autoComplete="email"
                          type="email"
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  name="password"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="w-full"
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          type="password"
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormResults message={error} type="error" />
                  <FormResults message={success} type="success" />
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
