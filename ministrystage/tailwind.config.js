/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/stage/**/*.{html,js}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ms: {
          bg:       '#0a0a0a',
          surface0: '#000000',
          surface1: '#111111',
          surface2: '#1a1a1a',
          surface3: '#222222',
          surface4: '#2a2a2a',
          accent:   '#e8e8e8',
          green:    '#22c55e',
          red:      '#ef4444',
          amber:    '#f59e0b',
          blue:     '#3b82f6',
          text1:    '#f5f5f5',
          text2:    '#999999',
          text3:    '#555555',
          text4:    '#333333',
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.25s ease both',
        'fade-in': 'fadeIn 0.2s ease both',
        'blink': 'blink 1.2s ease-in-out infinite',
        'lyric-in': 'lyricSlide 0.25s cubic-bezier(0.34,1.2,0.64,1) both',
      }
    },
  },
  plugins: [],
}
