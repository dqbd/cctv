export const theme = {
  colors: {
    blue400: "hsl(220, 16%, 27%)",
    blue500: "hsl(220, 16%, 31%)",
    blue600: "hsl(220, 16%, 39%)",
    blue700: "hsl(220, 16%, 48%)",
    lightBlue900: "hsl(220, 28%, 88%)",
    red500: "hsl(0, 78%, 63%)",
    gray100: "hsl(0, 0%, 3%)",
    white: "hsl(0, 0%, 100%)",
  },
  gradients: {
    top: "linear-gradient(rgba(10, 10, 10, 1), rgba(10, 10, 10, 0))",
    bottom: "linear-gradient(rgba(10, 10, 10, 0), rgba(10, 10, 10, 1))",
  },
  shadows: {
    sm: "0px 4px 10px rgba(0, 0, 0, 0.3)",
    md: "0 3.4px 2.7px rgba(0, 0, 0, 0.019), 0 8.7px 6.9px rgba(0, 0, 0, 0.027), 0 17.7px 14.2px rgba(0, 0, 0, 0.033), 0 36.5px 29.2px rgba(0, 0, 0, 0.041), 0 100px 80px rgba(0, 0, 0, 0.06)",
  },
} as const
