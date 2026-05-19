import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ className = "" }) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}