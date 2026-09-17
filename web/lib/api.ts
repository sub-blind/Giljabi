import type { AccessResult, Connection, Course, Intent, Place, SearchResult, Regions, PhotoResult, StoryResult, RelatedResult } from "./storyroute/types";

const prefix = "/api/v1/day-trip";

async function request<T>(path: string, data?: unknown, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(abort, 35000);
  try {
    const response = await fetch(prefix + path, {
      method: data === undefined ? "GET" : "POST", cache: "no-store",
      headers: data === undefined ? undefined : { "Content-Type": "application/json" },
      body: data === undefined ? undefined : JSON.stringify(data), signal: controller.signal,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message ?? "입력 조건을 확인하고 다시 시도해주세요.");
    return result as T;
  } catch (error) {
    if (controller.signal.aborted) throw new Error("요청이 중단됐거나 응답이 늦어지고 있어요. 다시 시도해주세요.");
    if (error instanceof TypeError || error instanceof SyntaxError) throw new Error("서버 연결을 확인하고 다시 시도해주세요.");
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

export const getStatus = (signal?: AbortSignal) => request<Connection>("/status", undefined, signal);
export const getRegions = (signal?: AbortSignal) => request<Regions>("/regions", undefined, signal);
export const parseIntent = (query: string, signal?: AbortSignal) => request<{ intent: Intent; mode: "ai" | "manual"; notices: string[] }>("/intent", { query }, signal);
export const searchPlaces = (intent: Intent, page = 1, signal?: AbortSignal) => request<SearchResult>("/places/search", { intent, page }, signal);
export const getPlace = (id: string, signal?: AbortSignal) => request<Place>("/places/" + encodeURIComponent(id), undefined, signal);
export const createCourse = (placeIds: string[], intent: Intent, signal?: AbortSignal) => request<Course>("/course", { placeIds, intent }, signal);
export const searchPhotos = (city: string | null, keyword: string, page: number, signal?: AbortSignal) => request<PhotoResult>("/photos/search", { city, keyword, page }, signal);
export const getStories = (id: string, signal?: AbortSignal) => request<StoryResult>("/places/" + encodeURIComponent(id) + "/stories", undefined, signal);
export const getRelated = (id: string, signal?: AbortSignal) => request<RelatedResult>("/places/" + encodeURIComponent(id) + "/related", undefined, signal);
export const getAccessibility = (id: string, signal?: AbortSignal) => request<AccessResult>("/places/" + encodeURIComponent(id) + "/accessibility", undefined, signal);
