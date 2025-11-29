import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/*.d.ts",
      "**/coverage/**",
      "**/.next/**",
      "**/out/**"
    ]
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsparser },
    plugins: { "@typescript-eslint": tseslint },
    rules: { "no-unused-vars": "warn" }
  }
];
