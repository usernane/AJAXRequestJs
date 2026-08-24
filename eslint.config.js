import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "script",
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        XMLHttpRequest: "readonly",
        FormData: "readonly",
        File: "readonly",
        Blob: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        // Library globals
        AJAXRequest: "writable",
        ajax: "writable"
      }
    },
    rules: {
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-console": "off",
      "semi": ["error", "always"],
      "quotes": ["warn", "single", { "avoidEscape": true }],
      "indent": ["warn", 4],
      "no-trailing-spaces": "warn",
      "eol-last": ["warn", "always"]
    }
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        // Jest globals
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly"
      }
    }
  },
  {
    ignores: ["dist/", "node_modules/", "coverage/", "examples/"]
  }
];
