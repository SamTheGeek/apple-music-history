// React 18+ / react-dom expects this when a test runner wraps updates in `act(...)`
// (Vitest + jsdom do not set it automatically). See react-dom `isConcurrentActEnvironment`.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
