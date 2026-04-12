/** TourAPI(KorService2) JSON → items[] 정규화 */

export type TourItem = {
  contentid?: string;
  contenttypeid?: string;
  title?: string;
  addr1?: string;
  addr2?: string;
  firstimage?: string;
  firstimage2?: string;
  mapx?: string;
  mapy?: string;
  tel?: string;
  overview?: string;
  desc?: string;
  [key: string]: string | undefined;
};

export function extractTourItems(data: unknown): TourItem[] {
  if (!data || typeof data !== "object") return [];
  const root = data as Record<string, unknown>;
  const response = root.response as Record<string, unknown> | undefined;
  if (!response) return [];
  const body = response.body as Record<string, unknown> | undefined;
  if (!body || typeof body !== "object") return [];
  const itemsWrap = body.items as Record<string, unknown> | undefined;
  if (!itemsWrap || typeof itemsWrap !== "object") return [];
  const raw = itemsWrap.item;
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as TourItem[];
  return [raw as TourItem];
}

export function itemTitle(item: TourItem): string {
  return item.title?.trim() || "이름 없음";
}

export function itemImage(item: TourItem): string | null {
  const u = item.firstimage2 || item.firstimage;
  return u && u.startsWith("http") ? u : null;
}
