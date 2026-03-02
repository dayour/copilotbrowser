"use strict";
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientCertificatesProxy = void 0;
exports.getMatchingTLSOptionsForOrigin = getMatchingTLSOptionsForOrigin;
exports.rewriteOpenSSLErrorIfNeeded = rewriteOpenSSLErrorIfNeeded;
const events_1 = require("events");
const http2_1 = __importDefault(require("http2"));
const net_1 = __importDefault(require("net"));
const stream_1 = __importDefault(require("stream"));
const tls_1 = __importDefault(require("tls"));
const socksProxy_1 = require("./utils/socksProxy");
const utils_1 = require("../utils");
const browserContext_1 = require("./browserContext");
const network_1 = require("./utils/network");
const debugLogger_1 = require("./utils/debugLogger");
const happyEyeballs_1 = require("./utils/happyEyeballs");
const utilsBundle_1 = require("../utilsBundle");
let dummyServerTlsOptions = undefined;
function loadDummyServerCertsIfNeeded() {
    if (dummyServerTlsOptions)
        return;
    const { cert, key } = (0, utils_1.generateSelfSignedCertificate)();
    dummyServerTlsOptions = { key, cert };
}
// Client Certificates in copilotbrowser are implemented as a SOCKS5 proxy that injects client certificates into the TLS handshake.
// We do that to avoid patching the browsers TLS stack and expose the certificates there.
// The following shows two flow diagrams, one for http:// and one for https://.
// Key Decision Point: First byte check (0x16 = TLS handshake)
// HTTP FLOW (Plain text):
//     BROWSER                    PROXY                     SERVER
//        │                        │                         │
//        │   SOCKS5 Connect       │                         │
//        │───────────────────────►│                         │
//        │                        │    TCP Connect          │
//        │                        │────────────────────────►│
//        │                        │                         │
//        │   HTTP Request         │                         │
//        │───────────────────────►│                         │
//        │                        │ Check: not 0x16         │
//        │                        │ → Direct pipe           │
//        │                        │                         │
//        │                        │   HTTP Request          │
//        │                        │────────────────────────►│
//        │                        │                         │
//        │◄═══════════════════════│════════════════════════►│
//        │      Plain HTTP        │      Plain HTTP         │
// HTTPS FLOW (TLS with client certificates):
//     BROWSER                    PROXY                     SERVER
//        │                        │                         │
//        │   SOCKS5 Connect       │                         │
//        │───────────────────────►│                         │
//        │                        │    TCP Connect          │
//        │                        │────────────────────────►│
//        │                        │                         │
//        │   TLS ClientHello      │                         │
//        │   (with ALPN)          │                         │
//        │───────────────────────►│                         │
//        │                        │ Check: 0x16 = TLS       │
//        │                        │ Parse ALPN protocols    │
//        │                        │ Create dual TLS conns   │
//        │                        │                         │
//        │                        │   TLS ClientHello       │
//        │                        │   (with client cert)    │
//        │                        │────────────────────────►│
//        │                        │                         │
//        │                        │◄───── TLS Handshake ────│
//        │◄──── TLS Handshake ────│                         │
//        │                        │                         │
//        │◄═══════════════════════│════════════════════════►│
//        │      Encrypted Data    │    Encrypted Data       │
//        │      (HTTP/1.1 or H2)  │    (with client auth)   │
class SocksProxyConnection {
    socksProxy;
    uid;
    host;
    port;
    _firstPackageReceived = false;
    _serverEncrypted;
    _browserEncrypted;
    _brorwserDecrypted;
    _serverCloseEventListener;
    _closed = false;
    constructor(socksProxy, uid, host, port) {
        this.socksProxy = socksProxy;
        this.uid = uid;
        this.host = host;
        this.port = port;
        this._serverCloseEventListener = () => {
            this._browserEncrypted.destroy();
        };
        this._browserEncrypted = new stream_1.default.Duplex({
            read: () => { },
            write: (data, encoding, callback) => {
                this.socksProxy._socksProxy.sendSocketData({ uid: this.uid, data });
                callback();
            },
            destroy: (error, callback) => {
                if (error)
                    socksProxy._socksProxy.sendSocketError({ uid: this.uid, error: error.message });
                else
                    socksProxy._socksProxy.sendSocketEnd({ uid: this.uid });
                callback();
            },
        });
    }
    async connect() {
        const proxyAgent = this.socksProxy.getProxyAgent(this.host, this.port);
        if (proxyAgent)
            this._serverEncrypted = await proxyAgent.connect(new events_1.EventEmitter(), { host: rewriteToLocalhostIfNeeded(this.host), port: this.port, secureEndpoint: false });
        else
            this._serverEncrypted = await (0, happyEyeballs_1.createSocket)(rewriteToLocalhostIfNeeded(this.host), this.port);
        this._serverEncrypted.once('close', this._serverCloseEventListener);
        this._serverEncrypted.once('error', error => this._browserEncrypted.destroy(error));
        if (this._closed) {
            this._serverEncrypted.destroy();
            return;
        }
        this.socksProxy._socksProxy.socketConnected({
            uid: this.uid,
            host: this._serverEncrypted.localAddress,
            port: this._serverEncrypted.localPort,
        });
    }
    onClose() {
        // Close the other end and cleanup TLS resources.
        this._serverEncrypted.destroy();
        this._browserEncrypted.destroy();
        this._closed = true;
    }
    onData(data) {
        // HTTP / TLS are client-hello based protocols. This allows us to detect
        // the protocol on the first package and attach appropriate listeners.
        if (!this._firstPackageReceived) {
            this._firstPackageReceived = true;
            // 0x16 is SSLv3/TLS "handshake" content type: https://en.wikipedia.org/wiki/Transport_Layer_Security#TLS_record
            if (data[0] === 0x16)
                this._establishTlsTunnel(this._browserEncrypted, data);
            else
                this._establishPlaintextTunnel(this._browserEncrypted);
        }
        this._browserEncrypted.push(data);
    }
    _establishPlaintextTunnel(browserEncrypted) {
        browserEncrypted.pipe(this._serverEncrypted);
        this._serverEncrypted.pipe(browserEncrypted);
    }
    _establishTlsTunnel(browserEncrypted, clientHello) {
        const browserALPNProtocols = parseALPNFromClientHello(clientHello) || ['http/1.1'];
        debugLogger_1.debugLogger.log('client-certificates', `Browser->Proxy ${this.host}:${this.port} offers ALPN ${browserALPNProtocols}`);
        const serverDecrypted = tls_1.default.connect({
            socket: this._serverEncrypted,
            host: this.host,
            port: this.port,
            rejectUnauthorized: !this.socksProxy.ignoreHTTPSErrors,
            ALPNProtocols: browserALPNProtocols,
            servername: !net_1.default.isIP(this.host) ? this.host : undefined,
            secureContext: this.socksProxy.secureContextMap.get(new URL(`https://${this.host}:${this.port}`).origin),
        }, async () => {
            const browserDecrypted = await this._upgradeToTLSIfNeeded(browserEncrypted, serverDecrypted.alpnProtocol);
            debugLogger_1.debugLogger.log('client-certificates', `Proxy->Server ${this.host}:${this.port} chooses ALPN ${browserDecrypted.alpnProtocol}`);
            browserDecrypted.pipe(serverDecrypted);
            serverDecrypted.pipe(browserDecrypted);
            const cleanup = (error) => this._serverEncrypted.destroy(error);
            browserDecrypted.once('error', cleanup);
            serverDecrypted.once('error', cleanup);
            browserDecrypted.once('close', cleanup);
            serverDecrypted.once('close', cleanup);
            if (this._closed)
                serverDecrypted.destroy();
        });
        serverDecrypted.once('error', async (error) => {
            debugLogger_1.debugLogger.log('client-certificates', `error when connecting to server: ${error.message.replaceAll('\n', ' ')}`);
            // Once we receive an error, we manually close the server connection.
            // In case of an 'error' event on the server connection, we still need to perform the http2 handshake on the browser side.
            // This is an async operation, so we need to remove the listener to prevent the socket from being closed too early.
            // This means we call this._serverCloseEventListener manually.
            this._serverEncrypted.removeListener('close', this._serverCloseEventListener);
            this._serverEncrypted.destroy();
            const browserDecrypted = await this._upgradeToTLSIfNeeded(this._browserEncrypted, serverDecrypted.alpnProtocol);
            const responseBody = (0, utils_1.escapeHTML)('copilotbrowser client-certificate error: ' + error.message)
                .replaceAll('\n', ' <br>');
            if (browserDecrypted.alpnProtocol === 'h2') {
                // This method is available only in Node.js 20+
                if ('performServerHandshake' in http2_1.default) {
                    const session = http2_1.default.performServerHandshake(browserDecrypted);
                    session.on('error', error => {
                        this._browserEncrypted.destroy(error);
                    });
                    session.once('stream', (stream) => {
                        const cleanup = (error) => {
                            session.close();
                            this._browserEncrypted.destroy(error);
                        };
                        stream.once('end', cleanup);
                        stream.once('error', cleanup);
                        stream.respond({
                            [http2_1.default.constants.HTTP2_HEADER_CONTENT_TYPE]: 'text/html',
                            [http2_1.default.constants.HTTP2_HEADER_STATUS]: 503,
                        });
                        stream.end(responseBody);
                    });
                }
                else {
                    this._browserEncrypted.destroy(error);
                }
            }
            else {
                browserDecrypted.end([
                    'HTTP/1.1 503 Internal Server Error',
                    'Content-Type: text/html; charset=utf-8',
                    'Content-Length: ' + Buffer.byteLength(responseBody),
                    '',
                    responseBody,
                ].join('\r\n'));
            }
        });
    }
    async _upgradeToTLSIfNeeded(socket, alpnProtocol) {
        // TLS errors can happen after secureConnect event from the server. In this case the socket is already upgraded to TLS.
        this._brorwserDecrypted ??= new Promise((resolve, reject) => {
            const dummyServer = tls_1.default.createServer({
                ...dummyServerTlsOptions,
                ALPNProtocols: [alpnProtocol || 'http/1.1'],
            });
            dummyServer.emit('connection', socket);
            dummyServer.once('secureConnection', tlsSocket => {
                dummyServer.close();
                resolve(tlsSocket);
            });
            dummyServer.once('error', error => {
                dummyServer.close();
                reject(error);
            });
        });
        return this._brorwserDecrypted;
    }
}
class ClientCertificatesProxy {
    _socksProxy;
    _connections = new Map();
    ignoreHTTPSErrors;
    secureContextMap = new Map();
    _proxy;
    constructor(contextOptions) {
        (0, browserContext_1.verifyClientCertificates)(contextOptions.clientCertificates);
        this.ignoreHTTPSErrors = contextOptions.ignoreHTTPSErrors;
        this._proxy = contextOptions.proxy;
        this._initSecureContexts(contextOptions.clientCertificates);
        this._socksProxy = new socksProxy_1.SocksProxy();
        this._socksProxy.setPattern('*');
        this._socksProxy.addListener(socksProxy_1.SocksProxy.Events.SocksRequested, async (payload) => {
            try {
                const connection = new SocksProxyConnection(this, payload.uid, payload.host, payload.port);
                await connection.connect();
                this._connections.set(payload.uid, connection);
            }
            catch (error) {
                debugLogger_1.debugLogger.log('client-certificates', `Failed to connect to ${payload.host}:${payload.port}: ${error.message}`);
                this._socksProxy.socketFailed({ uid: payload.uid, errorCode: error.code });
            }
        });
        this._socksProxy.addListener(socksProxy_1.SocksProxy.Events.SocksData, (payload) => {
            this._connections.get(payload.uid)?.onData(payload.data);
        });
        this._socksProxy.addListener(socksProxy_1.SocksProxy.Events.SocksClosed, (payload) => {
            this._connections.get(payload.uid)?.onClose();
            this._connections.delete(payload.uid);
        });
        loadDummyServerCertsIfNeeded();
    }
    getProxyAgent(host, port) {
        const proxyFromOptions = (0, network_1.createProxyAgent)(this._proxy);
        if (proxyFromOptions)
            return proxyFromOptions;
        const proxyFromEnv = (0, utilsBundle_1.getProxyForUrl)(`https://${host}:${port}`);
        if (proxyFromEnv)
            return (0, network_1.createProxyAgent)({ server: proxyFromEnv });
    }
    _initSecureContexts(clientCertificates) {
        // Step 1. Group certificates by origin.
        const origin2certs = new Map();
        for (const cert of clientCertificates || []) {
            const origin = normalizeOrigin(cert.origin);
            const certs = origin2certs.get(origin) || [];
            certs.push(cert);
            origin2certs.set(origin, certs);
        }
        // Step 2. Create secure contexts for each origin.
        for (const [origin, certs] of origin2certs) {
            try {
                this.secureContextMap.set(origin, tls_1.default.createSecureContext(convertClientCertificatesToTLSOptions(certs)));
            }
            catch (error) {
                error = rewriteOpenSSLErrorIfNeeded(error);
                throw (0, utils_1.rewriteErrorMessage)(error, `Failed to load client certificate: ${error.message}`);
            }
        }
    }
    static async create(progress, contextOptions) {
        const proxy = new ClientCertificatesProxy(contextOptions);
        try {
            await progress.race(proxy._socksProxy.listen(0, '127.0.0.1'));
            return proxy;
        }
        catch (error) {
            await proxy.close();
            throw error;
        }
    }
    proxySettings() {
        return { server: `socks5://127.0.0.1:${this._socksProxy.port()}` };
    }
    async close() {
        await this._socksProxy.close();
    }
}
exports.ClientCertificatesProxy = ClientCertificatesProxy;
function normalizeOrigin(origin) {
    try {
        return new URL(origin).origin;
    }
    catch (error) {
        return origin;
    }
}
function convertClientCertificatesToTLSOptions(clientCertificates) {
    if (!clientCertificates || !clientCertificates.length)
        return;
    const tlsOptions = {
        pfx: [],
        key: [],
        cert: [],
    };
    for (const cert of clientCertificates) {
        if (cert.cert)
            tlsOptions.cert.push(cert.cert);
        if (cert.key)
            tlsOptions.key.push({ pem: cert.key, passphrase: cert.passphrase });
        if (cert.pfx)
            tlsOptions.pfx.push({ buf: cert.pfx, passphrase: cert.passphrase });
    }
    return tlsOptions;
}
function getMatchingTLSOptionsForOrigin(clientCertificates, origin) {
    const matchingCerts = clientCertificates?.filter(c => normalizeOrigin(c.origin) === origin);
    return convertClientCertificatesToTLSOptions(matchingCerts);
}
function rewriteToLocalhostIfNeeded(host) {
    return host === 'local.copilotbrowser' ? 'localhost' : host;
}
function rewriteOpenSSLErrorIfNeeded(error) {
    if (error.message !== 'unsupported' && error.code !== 'ERR_CRYPTO_UNSUPPORTED_OPERATION')
        return error;
    return (0, utils_1.rewriteErrorMessage)(error, [
        'Unsupported TLS certificate.',
        'Most likely, the security algorithm of the given certificate was deprecated by OpenSSL.',
        'For more details, see https://github.com/openssl/openssl/blob/master/README-PROVIDERS.md#the-legacy-provider',
        'You could probably modernize the certificate by following the steps at https://github.com/nodejs/node/issues/40672#issuecomment-1243648223',
    ].join('\n'));
}
/**
 * Parses the ALPN (Application-Layer Protocol Negotiation) extension from a TLS ClientHello.
 * Based on RFC 8446 (TLS 1.3): https://datatracker.ietf.org/doc/html/rfc8446
 */
function parseALPNFromClientHello(buffer) {
    if (buffer.length < 6)
        return null;
    // --- TLS Record Header (RFC 8446 §5.1) ---
    // https://datatracker.ietf.org/doc/html/rfc8446#section-5.1
    // TLSPlaintext.type (1 byte): 0x16 = TLS handshake
    if (buffer[0] !== 0x16)
        return null;
    let offset = 5; // TLS record header is 5 bytes
    // --- Handshake Header (RFC 8446 §4.1) ---
    // HandshakeType (1 byte): 0x01 = ClientHello
    // https://datatracker.ietf.org/doc/html/rfc8446#section-4
    if (buffer[offset] !== 0x01)
        return null;
    offset += 4; // Handshake header: type (1) + length (3)
    // --- ClientHello (RFC 8446 §4.1.2) ---
    // https://datatracker.ietf.org/doc/html/rfc8446#section-4.1.2
    // legacy_version (2 bytes) — always 0x0303 (TLS 1.2 for compatibility)
    offset += 2;
    // random (32 bytes)
    offset += 32;
    // legacy_session_id<0..32> (preceded by 1-byte length)
    if (offset >= buffer.length)
        return null;
    const sessionIdLength = buffer[offset];
    offset += 1 + sessionIdLength;
    // cipher_suites<2..2^16-2> (preceded by 2-byte length)
    if (offset + 2 > buffer.length)
        return null;
    const cipherSuitesLength = buffer.readUInt16BE(offset);
    offset += 2 + cipherSuitesLength;
    // legacy_compression_methods<1..2^8-1> (preceded by 1-byte length)
    if (offset >= buffer.length)
        return null;
    const compressionMethodsLength = buffer[offset];
    offset += 1 + compressionMethodsLength;
    // extensions<8..2^16-1> (preceded by 2-byte length)
    if (offset + 2 > buffer.length)
        return null;
    const extensionsLength = buffer.readUInt16BE(offset);
    offset += 2;
    const extensionsEnd = offset + extensionsLength;
    if (extensionsEnd > buffer.length)
        return null;
    // --- Extensions (RFC 8446 §4.2) ---
    // https://datatracker.ietf.org/doc/html/rfc8446#section-4.2
    // Each extension is structured as:
    // - extension_type (2 bytes)
    // - extension_data length (2 bytes)
    // - extension_data (variable)
    while (offset + 4 <= extensionsEnd) {
        const extensionType = buffer.readUInt16BE(offset);
        offset += 2;
        const extensionLength = buffer.readUInt16BE(offset);
        offset += 2;
        if (offset + extensionLength > extensionsEnd)
            return null;
        // ALPN extension (RFC 8446 §4.2.11): extension_type = 16
        // https://datatracker.ietf.org/doc/html/rfc8446#section-4.2
        if (extensionType === 16)
            return parseALPNExtension(buffer.subarray(offset, offset + extensionLength));
        offset += extensionLength;
    }
    return null; // No ALPN extension found
}
/**
 * Parses the ALPN extension data from a ClientHello extension block.
 *
 * The ALPN structure is defined in:
 * - RFC 7301 §3.1: https://datatracker.ietf.org/doc/html/rfc7301#section-3.1
 */
function parseALPNExtension(buffer) {
    if (buffer.length < 2)
        return null;
    // protocol_name_list<2..2^16-1> (preceded by 2-byte length)
    const listLength = buffer.readUInt16BE(0);
    if (listLength !== buffer.length - 2)
        return null;
    const protocols = [];
    let offset = 2;
    while (offset < buffer.length) {
        // ProtocolName<1..2^8-1> (preceded by 1-byte length)
        const protocolLength = buffer[offset];
        offset += 1;
        if (offset + protocolLength > buffer.length)
            break;
        const protocol = buffer.subarray(offset, offset + protocolLength).toString('utf8');
        protocols.push(protocol);
        offset += protocolLength;
    }
    return protocols.length > 0 ? protocols : null;
}
