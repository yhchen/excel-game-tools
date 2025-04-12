module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'prettier',
    ],
    plugins: ['@typescript-eslint', 'prettier'],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        createDefaultProgram: true,
    },
    rules: {
        'prettier/prettier': 'error',
        'no-console': 'off', // 允许使用console，因为这是一个CLI工具
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-function-return-type': 'warn',
        complexity: ['warn', 128],
        'max-depth': ['warn', 5],
        'max-lines-per-function': ['warn', 256],
        eqeqeq: ['error', 'smart'],
        '@typescript-eslint/no-namespace': 'off',
        // '@typescript-eslint/no-unsafe-member-access': 'warn',
        // '@typescript-eslint/no-unsafe-assignment': 'warn',
        // '@typescript-eslint/no-unsafe-call': 'warn',
        // '@typescript-eslint/no-unsafe-argument': 'warn',
        // '@typescript-eslint/restrict-template-expressions': [
        //     'warn',
        //     {
        //         allowNumber: true,
        //         allowBoolean: true,
        //         allowAny: false,
        //         allowNullish: true,
        //     },
        // ],
    },
    env: {
        node: true,
        jest: true,
    },
    ignorePatterns: [
        'dist/',
        'node_modules/',
        'bin/',
        'coverage/',
        'testcase/',
        'test/',
        '.eslintrc.js',
        'TypeDef/',
        'jest.config.js',
    ],
    settings: {
        // 确保 ESLint 与 VS Code 集成正常工作
        'import/resolver': {
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
            typescript: {},
        },
    },
};
