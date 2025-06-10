"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ResultsProps {
  message?: string;
  type?: "error" | "success";
}

export default function FormResults({ message, type }: ResultsProps) {
  if (!message) return null;
  return (
    <Alert
      variant={type === "error" ? "destructive" : "default"}
      className="mt-2"
    >
      {type === "success" ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
