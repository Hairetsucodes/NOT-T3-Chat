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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-card-foreground">
                Email Address
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="w-full px-2 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
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
              <FormLabel className="text-sm font-medium text-card-foreground">
                Password
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="w-full px-2 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  type="password"
                  disabled={isLoading}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormResults message={error} type="error" />
          <FormResults message={success} type="success" />

          <Button
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
