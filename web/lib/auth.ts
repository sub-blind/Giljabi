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
export const deleteAuthAccount = () => authRequest<{ ok: true }>("/account", "DELETE");

export const CURRENT_POLICY_VERSION = "2026-09-30";

export function beginKakaoLogin(returnTo = "/?restore=1", requestNickname = false) {
  sessionStorage.setItem("storyroute.auth.return-to", returnTo);
  const params = new URLSearchParams({
    request_nickname: String(requestNickname),
    policy_version: CURRENT_POLICY_VERSION,
    age_confirmed: "true",
    terms_agreed: "true",
  });
  window.location.assign(`/api/v1/auth/kakao/login?${params.toString()}`);
}

export function consumeLoginReturnTo() {
  const value = sessionStorage.getItem("storyroute.auth.return-to");
  sessionStorage.removeItem("storyroute.auth.return-to");
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}
