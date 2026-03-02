/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
declare const zodToJsonSchema: (schema: any, options?: any) => any;
declare const Client: typeof import('@modelcontextprotocol/sdk/client/index.js').Client;
declare const Server: typeof import('@modelcontextprotocol/sdk/server/index.js').Server;
declare const SSEClientTransport: typeof import('@modelcontextprotocol/sdk/client/sse.js').SSEClientTransport;
declare const SSEServerTransport: typeof import('@modelcontextprotocol/sdk/server/sse.js').SSEServerTransport;
declare const StdioClientTransport: typeof import('@modelcontextprotocol/sdk/client/stdio.js').StdioClientTransport;
declare const StdioServerTransport: typeof import('@modelcontextprotocol/sdk/server/stdio.js').StdioServerTransport;
declare const StreamableHTTPServerTransport: typeof import('@modelcontextprotocol/sdk/server/streamableHttp.js').StreamableHTTPServerTransport;
declare const StreamableHTTPClientTransport: typeof import('@modelcontextprotocol/sdk/client/streamableHttp.js').StreamableHTTPClientTransport;
declare const CallToolRequestSchema: typeof import('@modelcontextprotocol/sdk/types.js').CallToolRequestSchema;
declare const ListRootsRequestSchema: typeof import('@modelcontextprotocol/sdk/types.js').ListRootsRequestSchema;
declare const ProgressNotificationSchema: typeof import('@modelcontextprotocol/sdk/types.js').ProgressNotificationSchema;
declare const ListToolsRequestSchema: typeof import('@modelcontextprotocol/sdk/types.js').ListToolsRequestSchema;
declare const PingRequestSchema: typeof import('@modelcontextprotocol/sdk/types.js').PingRequestSchema;
declare const Loop: typeof import('@lowire/loop').Loop;
declare const z: typeof import('zod');
export { zodToJsonSchema, Client, Server, SSEClientTransport, SSEServerTransport, StdioClientTransport, StdioServerTransport, StreamableHTTPClientTransport, StreamableHTTPServerTransport, CallToolRequestSchema, ListRootsRequestSchema, ListToolsRequestSchema, PingRequestSchema, ProgressNotificationSchema, Loop, z, };
