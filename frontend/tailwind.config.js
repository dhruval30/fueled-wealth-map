/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: '#003087',
          accent: '#146FF6',
          darkBlue: '#001E4C',
          lightGray: '#F8F9FB',
          offWhite: '#FCFCFC',
          textBase: '#1E1E1E',
          // Include default colors you need
          white: '#ffffff',
          black: '#000000',
          transparent: 'transparent',
        }
      }
    },
    plugins: [],
  }