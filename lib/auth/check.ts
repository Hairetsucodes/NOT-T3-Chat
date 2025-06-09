import { auth } from "@/auth";

export const checkUser = async ({ userId }: { userId: string }) => {
  const session = await auth();
  if (session?.user.id !== userId) {
    return { error: "Unauthorized" };
  }
  return {
    success: "Authenticated",
    authToken: session.user.authToken,
  };
};
