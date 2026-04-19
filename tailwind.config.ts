import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dynamix: {
          DEFAULT: "#123E7C",
          dark: "#0B2A59",
          light: "#1E5BB8",
          accent: "#3B82F6",
          cream: "#FAFBFD",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
