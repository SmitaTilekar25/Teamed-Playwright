module.exports = {
  name: 'Teamed Global MCP Server',
  description: 'MCP Server for Teamed Global Testing',
  version: '1.0.0',
  serverUrl: 'https://tgclient-stage.teamed.global',
  serverType: 'playwright-mcp',
  serverSettings: {
    protocol: 'https',
    host: 'tgclient-stage.teamed.global',
    port: 443,
    path: '/api/mcp'
  },
  endpoints: {
    health: '/health',
    tools: '/api/mcp/tools',
    data: '/api/mcp/data',
    auth: '/api/auth',
    login: '/api/auth/login'
  },
  tools: {
    enabled: true,
    timeout: 30000,
    retries: 2,
    availableTools: [
      {
        name: 'Browser',
        id: 'browser',
        endpoint: '/api/mcp/tools/browser',
        description: 'Browser automation tools'
      },
      {
        name: 'Network',
        id: 'network',
        endpoint: '/api/mcp/tools/network',
        description: 'Network inspection and manipulation'
      },
      {
        name: 'Storage',
        id: 'storage',
        endpoint: '/api/mcp/tools/storage',
        description: 'Local storage and cookie management'
      },
      {
        name: 'Screenshot',
        id: 'screenshot',
        endpoint: '/api/mcp/tools/screenshot',
        description: 'Screenshot capture tools'
      },
      {
        name: 'Console',
        id: 'console',
        endpoint: '/api/mcp/tools/console',
        description: 'Console logging and debugging'
      },
      {
        name: 'Performance',
        id: 'performance',
        endpoint: '/api/mcp/tools/performance',
        description: 'Performance monitoring tools'
      }
    ]
  }
}; 