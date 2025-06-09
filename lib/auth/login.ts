"use server";
import * as z from "zod";
import { LoginSchema } from "@/schemas/loginSchema";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validateFields = LoginSchema.safeParse(values);

  if (!validateFields.success) {
    return { error: "Please check your credentials and try again" };
  }

  const { email, password } = validateFields.data;

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
      redirect: false, // Don't auto-redirect, let the component handle it
    });

    if (result?.error) {
      return { error: "Invalid email or password" };
    }

    return { success: "Login successful!" };
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        case "AccessDenied":
          return { error: "Your account has been suspended" };
        case "CallbackRouteError":
          return { error: "Failed to complete login" };
        default:
          return { error: "Something went wrong. Please try again later" };
      }
    }
    return { error: "Something went wrong. Please try again later" };
  }
};
