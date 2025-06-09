"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

interface FormSuccessProps {
  message?: string;
}

export default function FormSuccess({ message }: FormSuccessProps) {
  if (!message) return null;

  return (
    <Alert variant={"default"} className="mt-2">
      <CheckCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
