import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">CHISAN Platform</h1>
      <p className="mt-4 text-muted-foreground">
        지산페이퍼 통합 비즈니스 플랫폼
      </p>
      <Link
        href="/login"
        className="mt-8 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        로그인
      </Link>
    </main>
  );
}
