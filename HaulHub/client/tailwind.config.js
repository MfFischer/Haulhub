module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
      extend: {
        colors: {
          'microsendr-primary': '#16a34a', // green-600
          'microsendr-secondary': '#134e4a', // teal-900
          'microsendr-accent': '#15803d', // green-700
          'microsendr-background': '#f9fafb', // gray-50
          'microsendr-dark': '#1f2937', // gray-800
        },
      },
    },
    plugins: [require("daisyui")],
    daisyui: {
      themes: [
        {
          microsendr: {
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
