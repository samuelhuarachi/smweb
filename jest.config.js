/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest/presets/js-with-ts",
    testEnvironment: "node",
    coveragePathIgnorePatterns: ["/node_modules/", "/src/", "dist"],
    rootDir: "./__tests__",
    verbose: true,
    modulePathIgnorePatterns: [".docker", "node_modules", "./__tests__/app/coverage", "./__tests__/app/__mocks__", "src", "dist", "css_dependecy"],
    transform: {
        "node_modules/variables/.+\\.(j|t)sx?$": "ts-jest",
    },
    transformIgnorePatterns: ["node_modules/(?!variables/.*)"],
    coverageDirectory: "coverage",
    clearMocks: true,
    collectCoverage: false,
};
