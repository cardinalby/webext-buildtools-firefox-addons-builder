module.exports = {
    preset: 'ts-jest',

    transform: {
        "^.+\\.(t|j)sx?$": "ts-jest"
    },
    moduleDirectories: [
        "node_modules",
        "src"
    ],
    transformIgnorePatterns: [
        "node_modules/(?!(sign-addon/.*))"
    ],
    testEnvironment: 'node',
};