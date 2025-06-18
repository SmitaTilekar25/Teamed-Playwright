const axios = require('axios');
const MCP_CONFIG = require('../config/mcp.config');

class MCPClient {
    constructor() {
        console.log('Initializing MCP Client with config:', {
            baseURL: MCP_CONFIG.serverUrl,
            timeout: MCP_CONFIG.timeout
        });
        
        try {
            this.client = axios.create({
                baseURL: MCP_CONFIG.serverUrl,
                timeout: MCP_CONFIG.timeout,
                validateStatus: status => status < 500 // Accept all status codes less than 500
            });
            console.log('MCP Client created successfully');
        } catch (error) {
            console.error('Failed to create MCP client:', error);
            throw new Error(`Failed to create MCP client: ${error.message}`);
        }
    }

    async healthCheck() {
        try {
            console.log('Attempting health check...');
            const response = await this.client.get(MCP_CONFIG.endpoints.health);
            console.log('Health check response:', response.data);
            return response.data;
        } catch (error) {
            console.error('MCP Health Check Failed:', {
                message: error.message,
                code: error.code,
                response: error.response?.data,
                config: error.config
            });
            throw new Error(`Failed to check MCP health: ${error.message}`);
        }
    }

    async getTools() {
        try {
            console.log('Fetching available tools...');
            const response = await this.client.get(MCP_CONFIG.endpoints.tools);
            console.log('Tools response:', response.data);
            return response.data.tools || [];
        } catch (error) {
            console.error('Failed to fetch tools:', {
                message: error.message,
                code: error.code,
                response: error.response?.data,
                config: error.config
            });
            return [];
        }
    }

    async sendData(data) {
        try {
            console.log('Sending data to MCP:', data);
            const response = await this.client.post(MCP_CONFIG.endpoints.data, data);
            console.log('MCP response:', response.data);
            return response.data;
        } catch (error) {
            console.error('MCP Data Send Failed:', {
                message: error.message,
                code: error.code,
                response: error.response?.data,
                config: error.config
            });
            throw new Error(`Failed to send data to MCP: ${error.message}`);
        }
    }
}

// Create a singleton instance
let mcpClient;
try {
    mcpClient = new MCPClient();
    console.log('MCP Client singleton created successfully');
} catch (error) {
    console.error('Failed to create MCP Client singleton:', error);
    throw error;
}

module.exports = mcpClient; 