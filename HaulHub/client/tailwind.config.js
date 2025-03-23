module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
      extend: {
        colors: {
          'haulhub-primary': '#16a34a', // green-600
          'haulhub-secondary': '#134e4a', // teal-900
          'haulhub-accent': '#15803d', // green-700
          'haulhub-background': '#f9fafb', // gray-50
          'haulhub-dark': '#1f2937', // gray-800
        },
      },
    },
    plugins: [require("daisyui")],
    daisyui: {
      themes: [
        {
          haulhub: {
            primary: "#16a34a",
            secondary: "#134e4a",
            accent: "#15803d",
            neutral: "#1f2937",
            "base-100": "#f9fafb",
          },
        },
      ],
    },
  }