// 기존 코스 보존과 잘못된 브라우저 저장 입력을 검증한다.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const ts = require("typescript");

function storage(entries = {}) {
  const values = new Map(Object.entries(entries));
  const localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const modules = new Map();
  function load(name) {
    if (modules.has(name)) return modules.get(name);
    const module = { exports: {} };
    const source = fs.readFileSync(path.join(__dirname, "../lib/storyroute/", name + ".ts"), "utf8");
    const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    vm.runInNewContext(js, { exports: module.exports, module, localStorage, require: id => load(id.slice(2)) });
    modules.set(name, module.exports);
    return module.exports;
  }
  return { api: load("storage"), values, load, localStorage };
}
const intent = { region: "gangwon", city: null, durationDays: 1, categories: ["attraction"], keywords: [], preferences: [], unsupportedConditions: [] };
const saved = { version: 2, placeIds: ["12_1001"], intent, savedAt: "2026-09-17T00:00:00Z" };

test("기존 강릉 코스를 강원도·강릉시로 읽고 원본 저장을 보존한다", () => {
  const legacy = JSON.stringify({ ...saved, version: 1, intent: { ...intent, region: "gangneung", city: undefined } });
  const { api, values } = storage({ "storyroute.day-trip.v1": legacy });
  const restored = api.loadCourse();
  assert.equal(restored.intent.region, "gangwon");
  assert.equal(restored.intent.city, "강릉시");
  api.saveCourse(restored.placeIds, restored.intent);
  assert.equal(values.get("storyroute.day-trip.v1"), legacy);
  assert.equal(JSON.parse(values.get("storyroute.day-trip.v2")).version, 2);
});
test("새 강원도 코스는 ID·순서·조건만 저장한다", () => {
  const { api, values } = storage();
  api.saveCourse(["14_1002", "12_1001"], intent);
  const value = JSON.parse(values.get("storyroute.day-trip.v2"));
  assert.deepEqual(value.placeIds, ["14_1002", "12_1001"]);
  assert.deepEqual(Object.keys(value).sort(), ["intent", "placeIds", "savedAt", "version"]);
  assert.equal(api.loadCourse().intent.city, null);
});
test("사진 ID·중복 ID·잘못된 조건 저장은 복원하지 않는다", () => {
  for (const value of [{ ...saved, placeIds: ["photo_1001"] }, { ...saved, placeIds: ["12_1001", "12_1001"] },
    { ...saved, intent: { ...intent, keywords: ["가".repeat(31)] } }, { ...saved, savedAt: "invalid" }]) {
    const { api } = storage({ "storyroute.day-trip.v2": JSON.stringify(value) });
    assert.throws(() => api.loadCourse());
  }
});

test("방문 기록은 코스 순서를 바꿔도 복원하고 다른 코스와 분리한다", () => {
  const { load } = storage();
  const api = load("journey");
  api.saveJourney({ version: 1, placeIds: ["12_1001", "14_1002"], startedAt: saved.savedAt, visitedIds: ["12_1001"], notes: { "12_1001": "다시 가고 싶은 곳" } });
  const restored = api.loadJourney(["14_1002", "12_1001"]);
  assert.equal(restored.notes["12_1001"], "다시 가고 싶은 곳");
  assert.equal(restored.visitedIds[0], "12_1001");
  assert.equal(api.loadJourney(["12_1001"]), null);
});

test("다른 장소의 기록·중복 체크·과도한 메모·잘못된 시작일을 거절한다", () => {
  const base = { version: 1, placeIds: ["12_1001"], startedAt: saved.savedAt, visitedIds: [], notes: {} };
  for (const value of [{ ...base, visitedIds: ["12_9999"] }, { ...base, visitedIds: ["12_1001", "12_1001"] },
    { ...base, notes: { "12_1001": "가".repeat(501) } }, { ...base, notes: { "14_1002": "다른 곳" } }, { ...base, startedAt: "invalid" }]) {
    const { load } = storage({ "storyroute.journey.v1:12_1001": JSON.stringify(value) });
    assert.throws(() => load("journey").loadJourney(["12_1001"]));
  }
});

test("브라우저 저장이 차단되면 여행 기록 저장 오류를 전달한다", () => {
  const { load, localStorage } = storage();
  localStorage.setItem = () => { throw new Error("저장 차단"); };
  assert.throws(() => load("journey").saveJourney({ version: 1, placeIds: saved.placeIds, startedAt: saved.savedAt, visitedIds: [], notes: {} }));
});

test("구간 길찾기는 두 장소를 연결하고 좌표 누락은 검색으로 처리한다", () => {
  const { load } = storage();
  const api = load("navigation");
  const origin = { name: "출발 장소", address: "강원도", latitude: 37, longitude: 128 };
  const destination = { ...origin, name: "다음 장소", latitude: 38 };
  assert.equal(api.directionsUrl(destination, origin), `https://map.kakao.com/link/from/${encodeURIComponent(origin.name)},37,128/to/${encodeURIComponent(destination.name)},38,128`);
  assert.match(api.directionsUrl(destination, { ...origin, latitude: null }), /\/link\/to\//);
  assert.match(api.directionsUrl({ ...destination, longitude: null }, origin), /\/link\/search\//);
  assert.equal(api.directionsLabel({ ...destination, longitude: null }), "카카오맵에서 장소 검색");
});
