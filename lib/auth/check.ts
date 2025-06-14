"use server";
import { auth } from "@/auth";

export const checkUser = async () => {
  const session = await auth();
  if (!session?.user.id) {
    return { error: "Unauthorized" };
  }
  return {
    userId: session.user.id,
  };
};
