const MCP_CONFIG = {
    serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:3000',
    endpoints: {
        health: '/health',
        data: '/api/mcp/data',
        tools: '/api/mcp/tools'
    },
    timeout: 30000, // 30 seconds
    retryAttempts: 3
};

module.exports = MCP_CONFIG; 