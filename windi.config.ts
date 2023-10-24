import { defineConfig } from 'windicss/helpers'
import formsPlugin from 'windicss/plugin/forms'

export default defineConfig({
    darkMode: 'class',
    extract: {
        // accepts globs and file paths relative to project root
        include: ['**/**/*.{vue,html,jsx,liquid,ts,js}'],
        exclude: ['node_modules/**/*', '.git/**/*', ''],
    },
    //preflight: false,
    exclude: [/grid/],
    blocklist: ['grid'],
    safelist:
        'grid-test bg-red-500 radius-circle p-1 p-2 p-3 p-4 font-sans prose font-serif flex inline-flex flex-row flex-column justify-center items-center animate-spin w-8 h-8',
    theme: {
        extend: {
            colors: {
                teal: {
                    100: '#096',
                },
            },
        },
    },
    plugins: [formsPlugin],
})
