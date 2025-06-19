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
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormResults from "@/components/authorization/form/Results";
import { register } from "@/lib/auth/register";
import { startTransition } from "react";
import { RegisterSchema } from "@/schemas/register";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth/login";
import { Loader2 } from "lucide-react";

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const router = useRouter();
  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof RegisterSchema>) {
    setIsLoading(true);
    setError("");
    startTransition(async () => {
      const registerData = await register(values);
      if (registerData.success) {
        await login({
          email: values.email,
          password: values.password,
          remember: true,
        });
        router.refresh();
        router.push("/chat");
      } else {
        setError(registerData.error);
        setIsLoading(false);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-card-foreground">
                Full Name
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  className="w-full px-2 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  type="email"
                  className="w-full px-2 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
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
                  type="password"
                  className="w-full px-2 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormResults message={error} type="error" />
          <Button
            type="submit"
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
