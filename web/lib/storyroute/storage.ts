import { defaultIntent, type Category, type Intent } from "./types";

const key = "storyroute.day-trip.v2";
interface SavedCourse { version: 2; placeIds: string[]; intent: Intent; savedAt: string }

export function saveCourse(placeIds: string[], intent: Intent) {
  const saved: SavedCourse = { version: 2, placeIds, intent, savedAt: new Date().toISOString() };
  localStorage.setItem(key, JSON.stringify(saved));
}

export function loadCourse(): SavedCourse | null {
  const raw = localStorage.getItem(key) ?? localStorage.getItem("storyroute.day-trip.v1");
  if (!raw) return null;
  const value = JSON.parse(raw);
  if (![1, 2].includes(value.version) || typeof value.savedAt !== "string" || !Number.isFinite(Date.parse(value.savedAt)) ||
    !Array.isArray(value.placeIds) || value.placeIds.length < 1 || value.placeIds.length > 3 ||
    new Set(value.placeIds).size !== value.placeIds.length ||
    !value.placeIds.every((id: unknown) => typeof id === "string" && /^(12|14|39)_\d{1,15}$/.test(id))) {
    throw new Error("저장한 코스 형식을 확인할 수 없어요. 새 코스를 만들어주세요.");
  }
  const intent = value.version === 1 && value.intent?.region === "gangneung" ?
    { ...value.intent, region: "gangwon", city: "강릉시" } : value.intent;
  if (!intent || intent.region !== "gangwon" || (intent.city !== null && (typeof intent.city !== "string" || intent.city.length > 20)) || intent.durationDays !== 1 ||
    !Array.isArray(intent.categories) || intent.categories.length < 1 || intent.categories.length > 3 ||
    !intent.categories.every((item: Category) => ["attraction", "culture", "food"].includes(item)) ||
    ![intent.keywords, intent.preferences, intent.unsupportedConditions].every(items => Array.isArray(items) && items.length <= 3 &&
      items.every((item: unknown) => typeof item === "string" && item.length <= 160)) || intent.keywords.some((item: string) => item.length > 30)) {
    throw new Error("저장한 여행 조건을 확인할 수 없어요. 새 코스를 만들어주세요.");
  }
  return { version: 2, placeIds: value.placeIds, savedAt: value.savedAt,
    intent: { ...defaultIntent, ...intent } };
}
