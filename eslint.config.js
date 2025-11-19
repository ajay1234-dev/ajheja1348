import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

export default [
  {
    ignores: ["dist/", "node_modules/", "client/node_modules/"]
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: {
      react: pluginReact,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off"
    }
  },
  ...tseslint.configs.recommended,
];
