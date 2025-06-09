"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface FormErrorProps {
  message?: string;
}

export default function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <Alert variant="destructive" className="mt-2">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
