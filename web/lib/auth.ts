export interface AuthUser {
  userId: string;
  provider: "kakao";
  nickname: string | null;
}

export interface AuthSession {
  authenticated: boolean;
  hasRefreshToken: boolean;
  user: AuthUser | null;
}

async function authRequest<T>(path: string, method = "GET"): Promise<T> {
  const response = await fetch(`/api/v1/auth${path}`, {
    method,
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.error?.message ?? body?.detail;
    throw new Error(typeof message === "string" ? message : "로그인 상태를 확인하지 못했어요.");
  }
  return body as T;
}

export const getAuthSession = () => authRequest<AuthSession>("/session");
export const refreshAuthSession = () => authRequest<{ ok: true }>("/refresh", "POST");
export const logoutAuthSession = () => authRequest<{ ok: true }>("/logout", "POST");

export function beginKakaoLogin(returnTo = "/?restore=1") {
  sessionStorage.setItem("storyroute.auth.return-to", returnTo);
  window.location.assign("/api/v1/auth/kakao/login?request_nickname=true");
}

export function consumeLoginReturnTo() {
  const value = sessionStorage.getItem("storyroute.auth.return-to");
  sessionStorage.removeItem("storyroute.auth.return-to");
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}
