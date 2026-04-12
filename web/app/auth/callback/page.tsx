import Link from "next/link";

type CallbackPageProps = {
  searchParams?: {
    status?: string;
  };
};

export default function AuthCallbackPage({ searchParams }: CallbackPageProps) {
  const status = searchParams?.status;
  const success = status === "success";

  return (
    <main className="min-h-screen bg-gradient-to-b from-sr-surface to-white px-4 py-16">
      <div className="mx-auto max-w-xl rounded-[32px] border border-sr-line bg-white p-8 shadow-sr">
        <div className="text-sm font-semibold text-sr-primary">Auth Callback</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-sr-text">
          {success ? "카카오 로그인이 완료되었습니다." : "로그인 처리에 실패했습니다."}
        </h1>
        <p className="mt-4 text-base leading-7 text-sr-muted">
          {success
            ? "이제 홈으로 돌아가면 로그인된 사용자 상태를 확인할 수 있습니다."
            : "카카오 앱 설정과 Redirect URI, REST API 키가 정확한지 다시 확인해보세요."}
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/" className="inline-flex items-center justify-center rounded-2xl bg-sr-text px-5 py-3 font-semibold text-white">
            홈으로 가기
          </Link>
        </div>
      </div>
    </main>
  );
}
