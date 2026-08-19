/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            borderRadius: {
                sm: "12px",
                md: "18px",
                lg: "24px",
                xl: "28px",
                "2xl": "32px",
                full: "9999px",
            },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
                popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
                primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
                secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
                muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
                accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
                destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                },
                
                terracota: {
                    DEFAULT: "#E06C4C",
                    hover: "#C85A3F",
                    light: "#FDECE8",
                },
                
                forest: {
                    DEFAULT: "#2D6A4F",
                    hover: "#1B4332",
                    light: "#D8F3DC",
                },
                
                sand: {
                    app: "#FAF9F6",
                    subtle: "#F3F2EE",
                },
                brand: {
                    // 50: "#FFF5EC",
                    // 100: "#FFE9D3",
                    // 200: "#FFCFA5",
                    // 300: "#FAAD6D",
                    // 400: "#FF7E32",
                    // 500: "#FF5B0A",
                    // 600: "#F44000",
                    // 700: "#CC2B02",
                    // 800: "#A1220B",
                    // 900: "#821F0C",
                    // 950: "#460C04",
                    50: "#FFF8F2",
                    100: "#FFEFD9",
                    200: "#FFD8B3",
                    300: "#FFB774",
                    400: "#FF933D",
                    500: "#F97316", // Primary
                    600: "#EA580C", // Hover
                    700: "#C2410C",
                    800: "#9A3412",
                    900: "#7C2D12",
                },
                
                surface: {
                    app: "#FFFBF7",
                    card: "#FFFFFF",
                    subtle: "#FFF6EE",
                    elevated: "#FFFFFF",
                },
                
                warmBorder: {
                    DEFAULT: "#EEE5DB",
                    light: "#F8E8DB",
                },
                
                success: "#2D8C5F",
                warning: "#FFB545",
                danger: "#D72638",
                
                terracotatext: {
                    primary: "#172554",
                    secondary: "#6B7280",
                    muted: "#9CA3AF",
                },
            },
            boxShadow: {
                card: "0 8px 24px rgba(244,64,0,0.08)",
                cardHover: "0 14px 34px rgba(244,64,0,0.14)",
                sidebar: "0 18px 60px rgba(244,64,0,0.12)",
                floating: "0 14px 40px rgba(244,64,0,0.22)",
                button: "0 8px 22px rgba(244,64,0,0.20)",
              },
            fontFamily: {
                display: ['Manrope', 'system-ui', 'sans-serif'],
                body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace']
            },
            keyframes: {
                'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
                'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
