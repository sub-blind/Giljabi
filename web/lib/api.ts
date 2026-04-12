import type { TourItem } from "./tour";
import { extractTourItems } from "./tour";

export function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  return base.replace(/\/$/, "");
}

export function getKakaoLoginUrl(): string {
  return `${getApiBase()}/api/v1/auth/kakao/login`;
}

export type SessionUser = {
  userId: string;
  provider: string;
  nickname?: string | null;
  email?: string | null;
};

export async function fetchAuthSession(): Promise<{
  ok: boolean;
  authenticated: boolean;
  hasRefreshToken?: boolean;
  user?: SessionUser | null;
}> {
  const res = await fetch(`${getApiBase()}/api/v1/auth/session`, {
    credentials: "include",
    cache: "no-store",
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error("로그인 상태를 확인하지 못했습니다.");
  }
  return raw as {
    ok: boolean;
    authenticated: boolean;
    hasRefreshToken?: boolean;
    user?: SessionUser | null;
  };
}

export async function logout(): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("로그아웃에 실패했습니다.");
  }
}

export async function fetchPlacesByArea(params: {
  areaCode?: number;
  pageNo?: number;
  numOfRows?: number;
}): Promise<{ items: TourItem[]; raw: unknown }> {
  const q = new URLSearchParams();
  if (params.areaCode != null) q.set("area_code", String(params.areaCode));
  if (params.pageNo != null) q.set("page_no", String(params.pageNo));
  if (params.numOfRows != null) q.set("num_of_rows", String(params.numOfRows));

  const url = `${getApiBase()}/api/v1/tour/list-by-area?${q.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      typeof raw === "object" && raw && "detail" in raw
        ? String((raw as { detail: unknown }).detail)
        : res.statusText;
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return { items: extractTourItems(raw), raw };
}

export async function fetchPlacesByKeyword(keyword: string, areaCode?: number): Promise<{ items: TourItem[]; raw: unknown }> {
  const q = new URLSearchParams({ keyword });
  if (areaCode != null) q.set("area_code", String(areaCode));

  const url = `${getApiBase()}/api/v1/tour/list-by-keyword?${q.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      typeof raw === "object" && raw && "detail" in raw
        ? String((raw as { detail: unknown }).detail)
        : res.statusText;
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return { items: extractTourItems(raw), raw };
}
