/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Light theme colors from Color.png
                'sky-blue': {
                    DEFAULT: '#A8C5D9',
                    50: '#F0F6FA',
                    100: '#D4E4F0',
                    200: '#A8C5D9',
                    300: '#7BA3C4',
                    400: '#5A8BB0',
                    500: '#4A7BA0',
                },
                'cream': {
                    DEFAULT: '#F5E6D3',
                    50: '#FDF8F3',
                    100: '#F5E6D3',
                    200: '#E8D4B8',
                    300: '#D9C19D',
                    400: '#C9AE82',
                },
                'taupe': {
                    DEFAULT: '#8B7355',
                    50: '#F5F3F0',
                    100: '#E8E0D8',
                    200: '#A68F75',
                    300: '#8B7355',
                    400: '#6B5A42',
                    500: '#4A3D2E',
                },
                'maroon': {
                    DEFAULT: '#8B2E3C',
                    50: '#F5E8EA',
                    100: '#E8C4C9',
                    200: '#D9A0A8',
                    300: '#A84A5A',
                    400: '#8B2E3C',
                    500: '#6B1F2D',
                    600: '#4D151F',
                },
            },
        },
    },
}
