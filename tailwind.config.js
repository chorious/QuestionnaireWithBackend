/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        // Design tokens — see 2026-05-03-Opus-UI改造记录.md
        // Use these instead of rounded-xl/2xl/lg to keep surface vs control consistent.
        card: '12px',     // cards, modals, image previews
        control: '8px',   // buttons, inputs, option cells, small chips
        pill: '9999px',   // tags, badges, progress bars, dots
      },
    },
  },
  plugins: [],
};
