/**
 * Tests for AJAXRequest parameter serialization
 */

const { loadAJAXRequest, resetContext } = require('./helpers/loader');

describe('AJAXRequest parameter serialization', () => {
    let AJAXRequest;
    let xhrInstances;
    let MockXMLHttpRequest;

    beforeEach(() => {
        resetContext();

        xhrInstances = [];

        MockXMLHttpRequest = jest.fn(function() {
            this.open = jest.fn();
            this.send = jest.fn();
            this.setRequestHeader = jest.fn();
            this.readyState = 4;
            this.status = 200;
            this.active = false;
            xhrInstances.push(this);
        });

        AJAXRequest = loadAJAXRequest({
            mocks: {
                XMLHttpRequest: MockXMLHttpRequest,
                console: { ...console, info: jest.fn(), log: jest.fn(), warning: jest.fn() }
            }
        });
    });

    describe('string params', () => {
        test('string params passed through unchanged for GET', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                params: 'foo=bar&baz=qux'
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.open).toHaveBeenCalledWith('GET', 'https://example.com/api?foo=bar&baz=qux');
        });

        test('string params passed through unchanged for POST', () => {
            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/api',
                params: 'foo=bar&baz=qux'
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.send).toHaveBeenCalledWith('foo=bar&baz=qux');
        });
    });

    describe('object params for GET', () => {
        test('object params converted to query string', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                params: { name: 'john', age: 30 }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            const url = xhr.open.mock.calls[0][1];
            expect(url).toContain('name=john');
            expect(url).toContain('age=30');
            expect(url).toContain('&');
        });

        test('object params are URL encoded', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                params: { query: 'hello world', special: 'a=b&c=d' }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            const url = xhr.open.mock.calls[0][1];
            expect(url).toContain('query=hello%20world');
            expect(url).toContain(encodeURIComponent('a=b&c=d'));
        });
    });

    describe('object params for POST', () => {
        test('object params converted to FormData', () => {
            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/api',
                params: { username: 'testuser', password: 'secret' }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            // For POST with object params, send receives FormData
            expect(xhr.send).toHaveBeenCalled();
            const sentData = xhr.send.mock.calls[0][0];
            expect(sentData).toBeInstanceOf(FormData);
        });

        test('object params for PUT also converted to FormData', () => {
            const ajax = new AJAXRequest({
                method: 'PUT',
                url: 'https://example.com/api',
                params: { id: 123, name: 'updated' }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            const sentData = xhr.send.mock.calls[0][0];
            expect(sentData).toBeInstanceOf(FormData);
        });
    });

    describe('array values', () => {
        test('array values serialized as JSON-like strings for GET', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                params: { tags: ['red', 'green', 'blue'] }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            const url = xhr.open.mock.calls[0][1];
            // Array should be serialized - the exact format is ["red","green","blue"] URL encoded
            expect(url).toContain('tags=');
        });

        test('array with numbers serialized correctly', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                params: { ids: [1, 2, 3] }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            const url = xhr.open.mock.calls[0][1];
            expect(url).toContain('ids=');
            // Numbers should appear without quotes
            expect(url).toContain(encodeURIComponent('[1,2,3]'));
        });

        test('array with booleans serialized correctly', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                params: { flags: [true, false, true] }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            const url = xhr.open.mock.calls[0][1];
            expect(url).toContain('flags=');
            expect(url).toContain(encodeURIComponent('[true,false,true]'));
        });

        test('array values for POST added to FormData', () => {
            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/api',
                params: { items: ['a', 'b', 'c'] }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            const sentData = xhr.send.mock.calls[0][0];
            expect(sentData).toBeInstanceOf(FormData);
        });
    });

    describe('null/undefined values', () => {
        test('null values excluded from GET params', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                params: { valid: 'yes', empty: null, another: 'value' }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            const url = xhr.open.mock.calls[0][1];
            expect(url).toContain('valid=yes');
            expect(url).toContain('another=value');
            expect(url).not.toContain('empty=');
        });

        test('undefined values excluded from GET params', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                params: { valid: 'yes', missing: undefined, another: 'value' }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            const url = xhr.open.mock.calls[0][1];
            expect(url).toContain('valid=yes');
            expect(url).toContain('another=value');
            expect(url).not.toContain('missing=');
        });

        test('null values excluded from POST params', () => {
            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/api',
                params: { valid: 'yes', empty: null }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            const sentData = xhr.send.mock.calls[0][0];
            expect(sentData).toBeInstanceOf(FormData);
            // FormData should not contain 'empty' key
            expect(sentData.has('empty')).toBe(false);
        });
    });

    describe('File/Blob handling', () => {
        test('File objects handled correctly in POST', () => {
            // Create a mock File
            const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });

            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/upload',
                params: { document: mockFile, name: 'myfile' }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            const sentData = xhr.send.mock.calls[0][0];
            expect(sentData).toBeInstanceOf(FormData);
            // File should be in FormData
            expect(sentData.get('document')).toBeInstanceOf(File);
        });

        test('Blob objects handled correctly in POST', () => {
            const mockBlob = new Blob(['binary content'], { type: 'application/octet-stream' });

            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/upload',
                params: { data: mockBlob }
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            const sentData = xhr.send.mock.calls[0][0];
            expect(sentData).toBeInstanceOf(FormData);
            expect(sentData.get('data')).toBeInstanceOf(Blob);
        });
    });

    describe('FormData passthrough', () => {
        test('FormData passed through unchanged for POST', () => {
            const formData = new FormData();
            formData.append('field1', 'value1');
            formData.append('field2', 'value2');

            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/api',
                params: formData
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.send).toHaveBeenCalledWith(formData);
        });

        test('FormData with file passed through unchanged', () => {
            const formData = new FormData();
            const mockFile = new File(['content'], 'upload.txt', { type: 'text/plain' });
            formData.append('file', mockFile);
            formData.append('description', 'A test file');

            const ajax = new AJAXRequest({
                method: 'POST',
                url: 'https://example.com/upload',
                params: formData
            });

            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            expect(xhr.send).toHaveBeenCalledWith(formData);
        });
    });

    describe('setParams method', () => {
        test('setParams updates params before send', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api'
            });

            ajax.setParams({ key: 'value' });
            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            const url = xhr.open.mock.calls[0][1];
            expect(url).toContain('key=value');
        });

        test('setParams can replace existing params', () => {
            const ajax = new AJAXRequest({
                method: 'GET',
                url: 'https://example.com/api',
                params: { old: 'param' }
            });

            ajax.setParams({ new: 'param' });
            ajax.send();

            const xhr = xhrInstances[xhrInstances.length - 1];
            const url = xhr.open.mock.calls[0][1];
            expect(url).toContain('new=param');
            expect(url).not.toContain('old=param');
        });
    });
});
