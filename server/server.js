// This file satisfies the "node server.js" start command for Render
// It triggers the main application logic from the built files.
require('dotenv').config();

// Once built, we require the compiled Express app
const app = require('./dist/index.js').default;

// The port is handled inside dist/index.js now, but we'll ensure it's logged here too
// Note: If you renamed your entry file to index.ts, 'dist/index.js' is where it lives after 'npm run build'
