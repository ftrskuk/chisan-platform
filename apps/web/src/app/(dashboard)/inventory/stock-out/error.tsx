"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[400px] flex-col items-center justify-center gap-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-semibold tracking-tight">
          문제가 발생했습니다
        </h2>
        <p className="text-sm text-muted-foreground max-w-[500px]">
          {error.message ||
            "페이지를 불러오는 도중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."}
        </p>
      </div>
      <Button onClick={() => reset()}>다시 시도</Button>
    </div>
  );
}
