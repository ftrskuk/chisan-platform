"use client";

import Link from "next/link";
import { ArrowLeft, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link href="/production/slitting">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            <h1 className="font-semibold">슬리팅 작업</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-lg p-4">{children}</main>
    </div>
  );
}
