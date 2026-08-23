/**
 * Test helper to load AJAXRequest in jsdom environment
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let cachedContext = null;

/**
 * Loads AJAXRequest.js and returns the AJAXRequest constructor.
 * 
 * @param {Object} options - Options for loading
 * @param {Object} options.mocks - Objects to override in the context (e.g., XMLHttpRequest)
 * @returns {Function} AJAXRequest constructor
 */
function loadAJAXRequest(options = {}) {
  const { mocks = {} } = options;

  const sourceCode = fs.readFileSync(
    path.join(__dirname, '..', '..', 'AJAXRequest.js'),
    'utf8'
  );

  const context = vm.createContext({
    ...global,
    window: global,
    document: global.document,
    XMLHttpRequest: mocks.XMLHttpRequest || global.XMLHttpRequest,
    FormData: mocks.FormData || global.FormData,
    console: mocks.console || console,
    ...mocks
  });

  vm.runInContext(sourceCode, context);
  cachedContext = context;

  return context.AJAXRequest;
}

/**
 * Gets the global ajax instance
 * @returns {Object} Global ajax instance
 */
function getGlobalAjax() {
  if (!cachedContext) {
    loadAJAXRequest();
  }
  return cachedContext.ajax;
}

/**
 * Gets the current context
 * @returns {Object} VM context
 */
function getContext() {
  return cachedContext;
}

/**
 * Clears the cached context (useful for isolation between test suites)
 */
function resetContext() {
  cachedContext = null;
}

module.exports = {
  loadAJAXRequest,
  getGlobalAjax,
  getContext,
  resetContext
};
