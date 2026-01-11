/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.php",
    "./inc/**/*.php",
    "./template-parts/**/*.php",
    "./js/**/*.js",
    "./header.php",
    "./footer.php"
  ],
  theme: {
    extend: {
      colors: {
        'apfel-gold': {
            500: '#D4AF37', // Standard Gold
            600: '#B8860B', // Dark Goldenrod
            300: '#FCF6BA', // Light Gold
        },
        'apfel-black': '#0a0a0a',
        'apfel-card': '#111111',
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(212, 175, 55, 0.3)',
        'gold-glow-lg': '0 0 30px rgba(212, 175, 55, 0.6)',
      },
      animation: {
        'gold-pulse': 'goldPulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        goldPulse: {
          '0%, 100%': { 
            borderColor: 'rgba(212, 175, 55, 0.3)',
            boxShadow: '0 0 5px rgba(212, 175, 55, 0.1)' 
          },
          '50%': { 
            borderColor: 'rgba(212, 175, 55, 1)',
            boxShadow: '0 0 25px rgba(212, 175, 55, 0.6)' 
          },
        }
      }
    },
  },
  plugins: [],
}
