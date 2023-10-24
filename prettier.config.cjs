// @ts-check
/* eslint-env node */

const { EsLint, Prettier, merge } = require('@snailicide/build-config')
const options = {
    plugins: ['@shopify/prettier-plugin-liquid'],
    overrides: [
        {
            files: '*.liquid',
            options: {
                tabWidth: 2,
            },
        },
        {
            files: 'locales/*.json',
            options: {
                tabWidth: 2,
            },
        },
    ],
}

module.exports = merge(Prettier.config, options)
