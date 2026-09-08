/**
 * ESM bundle runtime verification (#125)
 *
 * Verifies that the ESM build (dist/ajaxrequest.esm.js) imports correctly
 * in a real Node ES module context and exposes the expected API surface.
 *
 * Run via: npm run test:esm
 * This script is intentionally separate from the Jest suite because Jest
 * runs in CJS mode by default and cannot natively import ES modules from
 * dist/ without additional Babel/transform configuration.
 *
 * Exit code 0 = all checks passed. Non-zero = failure (fails CI).
 */


import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const esmBundle = path.resolve(__dirname, '../dist/ajaxrequest.esm.js');

let passed = 0;
let failed = 0;

function check(label, fn) {
    try {
        fn();
        console.log(`  ✓ ${label}`);
        passed++;
    } catch (e) {
        console.error(`  ✕ ${label}`);
        console.error(`    ${e.message}`);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

console.log('\nESM bundle verification (dist/ajaxrequest.esm.js)');
console.log('─'.repeat(52));

// ── Import ──────────────────────────────────────────────────────────────────
let AJAXRequest;
try {
    const mod = await import(esmBundle);
    AJAXRequest = mod.default;
    console.log('  ✓ import() does not throw');
    passed++;
} catch (e) {
    console.error('  ✕ import() threw:', e.message);
    failed++;
    process.exit(1); // can't continue without the module
}

// ── Export contract ─────────────────────────────────────────────────────────
check('default export is a function', () => {
    assert(typeof AJAXRequest === 'function', `expected function, got ${typeof AJAXRequest}`);
});

check('constructor name is AJAXRequest', () => {
    assert(AJAXRequest.name === 'AJAXRequest', `expected 'AJAXRequest', got '${AJAXRequest.name}'`);
});

// ── Static API ───────────────────────────────────────────────────────────────
check('META is defined', () => {
    assert(AJAXRequest.META !== undefined, 'META is undefined');
});

check('META.VERSION is a string', () => {
    assert(typeof AJAXRequest.META.VERSION === 'string', `expected string, got ${typeof AJAXRequest.META.VERSION}`);
    assert(AJAXRequest.META.VERSION.length > 0, 'VERSION is empty');
});

check('META.RELEASE_DATE is a string', () => {
    assert(typeof AJAXRequest.META.RELEASE_DATE === 'string', `expected string, got ${typeof AJAXRequest.META.RELEASE_DATE}`);
});

check('CALLBACK_POOLS is an array', () => {
    assert(Array.isArray(AJAXRequest.CALLBACK_POOLS), 'CALLBACK_POOLS is not an array');
});

check('CALLBACK_POOLS contains expected pools', () => {
    const required = ['success', 'servererror', 'clienterror', 'connectionlost',
        'beforeajax', 'afterajax', 'error', 'timeout', 'abort'];
    for (const pool of required) {
        assert(AJAXRequest.CALLBACK_POOLS.includes(pool), `missing pool: ${pool}`);
    }
});

check('BACKOFF enum is defined with correct values', () => {
    assert(AJAXRequest.BACKOFF !== undefined, 'BACKOFF is undefined');
    assert(AJAXRequest.BACKOFF.FIXED === 'fixed', 'BACKOFF.FIXED wrong');
    assert(AJAXRequest.BACKOFF.LINEAR === 'linear', 'BACKOFF.LINEAR wrong');
    assert(AJAXRequest.BACKOFF.EXPONENTIAL === 'exponential', 'BACKOFF.EXPONENTIAL wrong');
});

// ── ESM minified bundle ──────────────────────────────────────────────────────
const esmMinBundle = path.resolve(__dirname, '../dist/ajaxrequest.esm.min.js');
console.log('\nESM minified bundle verification (dist/ajaxrequest.esm.min.js)');
console.log('─'.repeat(52));

let AJAXRequestMin;
try {
    const mod = await import(esmMinBundle);
    AJAXRequestMin = mod.default;
    console.log('  ✓ import() does not throw');
    passed++;
} catch (e) {
    console.error('  ✕ import() threw:', e.message);
    failed++;
}

if (AJAXRequestMin) {
    check('minified default export is a function', () => {
        assert(typeof AJAXRequestMin === 'function', `expected function, got ${typeof AJAXRequestMin}`);
    });

    check('minified META.VERSION matches non-minified', () => {
        assert(
            AJAXRequestMin.META.VERSION === AJAXRequest.META.VERSION,
            `version mismatch: ${AJAXRequestMin.META.VERSION} vs ${AJAXRequest.META.VERSION}`
        );
    });
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
