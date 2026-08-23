/**
 * Test helper to load AJAXRequest in jsdom environment
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let cachedContext = null;

/**
 * Loads AJAXRequest.js and returns the AJAXRequest constructor.
 * Results are cached for performance.
 * 
 * @returns {Function} AJAXRequest constructor
 */
function loadAJAXRequest() {
  if (cachedContext) {
    return cachedContext.AJAXRequest;
  }

  const sourceCode = fs.readFileSync(
    path.join(__dirname, '..', '..', 'AJAXRequest.js'),
    'utf8'
  );

  const context = vm.createContext({
    ...global,
    window: global,
    document: global.document,
    XMLHttpRequest: global.XMLHttpRequest,
    FormData: global.FormData,
    console: console
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
 * Clears the cached context (useful for isolation between test suites)
 */
function resetContext() {
  cachedContext = null;
}

module.exports = {
  loadAJAXRequest,
  getGlobalAjax,
  resetContext
};
