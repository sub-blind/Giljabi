"""현재 하루 여행 API만 실제 서버 스키마에서 추출한다."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.main import create_app


def main():
    schema = create_app().openapi()
    paths = {path: definition for path, definition in schema["paths"].items() if path.startswith("/api/v1/day-trip/")}
    used = set()
    def refs(node):
        if isinstance(node, dict):
            if "$ref" in node:
                name = node["$ref"].split("/")[-1]
                if name not in used:
                    used.add(name)
                    refs(schema["components"]["schemas"][name])
            for value in node.values():
                refs(value)
        elif isinstance(node, list):
            for value in node:
                refs(value)
    refs(paths)
    result = {"openapi": schema["openapi"], "info": {"title": "StoryRoute 강릉 하루 여행 API", "version": "0.1.0",
              "description": "현재 React 화면이 사용하는 내부 API. 관광 원형 응답이나 과거 확장 계획과 구분한다."},
              "paths": paths, "components": {"schemas": {name: schema["components"]["schemas"][name] for name in sorted(used)}}}
    (ROOT / "contracts" / "day-trip.openapi.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("하루 여행 API 계약 추출 완료")


if __name__ == "__main__":
    main()
