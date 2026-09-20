import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    // 기존 이벤트·비동기 흐름은 React Compiler를 사용하지 않으며 Next 15에서 검증한 동작을 유지한다.
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      // OAuth는 Next 라우터가 아니라 동일 출처 API를 거쳐 카카오 인증 서버로 이동한다.
      "@next/next/no-location-assign-relative-destination": "off",
    },
  },
  {
    files: ["tests/**/*.cjs"],
    rules: {
      "@next/next/no-assign-module-variable": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores(["next-env.d.ts", ".next/**", ".next-preview/**"]),
]);
