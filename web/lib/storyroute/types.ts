export type Category = "attraction" | "culture" | "food";
export type Phase = "create" | "discover" | "course";
export interface Intent {
  region: "gangwon";
  city: string | null;
  durationDays: 1;
  categories: Category[];
  keywords: string[];
  preferences: string[];
  unsupportedConditions: string[];
}
export interface Place {
  id: string;
  name: string;
  category: Category;
  address: string;
  city: string;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  overview: string;
  visitInfo: { key: string; label: string; value: string }[];
  evidence: string[];
  source: "tourapi";
  retrievedAt: string;
}
export interface Course {
  orderedPlaces: Place[];
  explanations: { placeId: string; text: string; mode: "ai" | "facts" }[];
  notices: string[];
  retrievedAt: string;
}
export interface SearchResult {
  places: Place[];
  appliedIntent: Intent;
  page: number;
  hasMore: boolean;
  notices: string[];
  retrievedAt: string;
}
export const categoryLabels: Record<Category, string> = {
  attraction: "풍경·명소", culture: "문화시설", food: "음식점·카페",
};
export const defaultIntent: Intent = {
  region: "gangwon", city: null, durationDays: 1, categories: ["attraction", "food"],
  keywords: [], preferences: [], unsupportedConditions: [],
};
export interface Regions { region: string; name: string; cities: { code: string; name: string }[] }
export interface Connection { tourismReady: boolean; aiReady: boolean; testing: boolean; photosReady: boolean; audioReady: boolean; relatedReady: boolean; accessReady: boolean; routeReady: boolean }
export interface CourseRoute {
  orderedPlaceIds: string[];
  mode: "car";
  source: "kakaomobility";
  segments: { originId: string; destinationId: string; status: "ready" | "unavailable" | "missing-coordinates";
    distanceMeters: number | null; durationSeconds: number | null; path: [number, number][]; notice: string | null; retrievedAt: string }[];
  totalDistanceMeters: number | null;
  totalDurationSeconds: number | null;
  notices: string[];
  retrievedAt: string;
}
export interface TravelPhoto { id: string; title: string; location: string; city: string | null; imageUrl: string; photographer: string; keywords: string[]; source: string }
export interface PhotoResult {
  photos: TravelPhoto[];
  // 서버가 마지막으로 조회에 성공한 원본 페이지. 추가 조회는 page + 1에서 시작한다.
  page: number;
  hasMore: boolean;
  appliedCity: string | null;
  appliedKeyword: string;
  notices: string[];
  retrievedAt: string;
}
export interface StoryResult { placeId: string; stories: { id: string; title: string; script: string; audioUrl: string | null; matchMethod: string; source: string }[]; notices: string[]; retrievedAt: string }
export interface RelatedResult { placeId: string; candidates: { id: string; name: string; city: string; category: string; rank: number | null; place: Place | null }[]; baseMonth: string; notices: string[]; retrievedAt: string }
export interface AccessResult { placeId: string; matched: boolean; fields: { key: string; label: string; group: string; value: string }[]; source: "with-tour"; sourceModifiedDate: string | null; notices: string[]; retrievedAt: string }
