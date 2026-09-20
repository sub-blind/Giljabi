import type { Intent } from "./storyroute/types";

export interface SavedAccountCourse {
  id: string;
  title: string;
  intent: Intent;
  placeIds: string[];
  createdAt: string;
  updatedAt: string;
}

async function request<T>(path = "", init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/account/courses${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) },
  });
  if (response.status === 401) throw new Error("다시 로그인해주세요.");
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message ?? body?.detail ?? "내 코스를 처리하지 못했어요.");
  return body as T;
}

export const listAccountCourses = () => request<{ courses: SavedAccountCourse[] }>();
export const saveAccountCourse = (title: string, placeIds: string[], intent: Intent) => request<SavedAccountCourse>("", {
  method: "POST", body: JSON.stringify({ title, placeIds, intent }),
});
export const deleteAccountCourse = (id: string) => request<void>(`/${encodeURIComponent(id)}`, { method: "DELETE" });
