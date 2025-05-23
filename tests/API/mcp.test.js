const { test, expect } = require('@playwright/test');
const axios = require('axios');
const MCP_CONFIG = require('./config/mcp.config');

test.describe('MCP Client Tests', () => {
    test.beforeAll(async () => {
        // Verify MCP server is running before tests
        try {
            console.log('Checking if MCP server is running...');
            const response = await axios.get(`${MCP_CONFIG.serverUrl}/health`);
            console.log('MCP server health check response:', response.data);
        } catch (error) {
            console.error('MCP server is not running or not accessible:', error.message);
            throw new Error('Please ensure MCP server is running before running tests');
        }
    });

    test('should connect to MCP server and check health', async () => {
        try {
            console.log('Importing MCP client...');
            const mcpClient = require('./helpers/mcp.helper');
            console.log('MCP client imported successfully');

            console.log('Running health check...');
            const healthStatus = await mcpClient.healthCheck();
            console.log('Health check result:', healthStatus);
            
            expect(healthStatus.status).toBe('healthy');
        } catch (error) {
            console.error('Test failed:', error);
            throw error;
        }
    });

    test('should fetch available tools', async () => {
        try {
            console.log('Importing MCP client...');
            const mcpClient = require('./helpers/mcp.helper');
            console.log('MCP client imported successfully');

            console.log('Fetching tools...');
            const tools = await mcpClient.getTools();
            console.log('Available tools:', tools);
            
            expect(Array.isArray(tools)).toBe(true);
            expect(tools.length).toBeGreaterThan(0);
            expect(tools[0]).toHaveProperty('name');
            expect(tools[0]).toHaveProperty('description');
            expect(tools[0]).toHaveProperty('functions');
        } catch (error) {
            console.error('Test failed:', error);
            throw error;
        }
    });

    test('should send data to MCP server', async () => {
        try {
            console.log('Importing MCP client...');
            const mcpClient = require('./helpers/mcp.helper');
            console.log('MCP client imported successfully');

            const testData = {
                message: 'Test message',
                timestamp: new Date().toISOString()
            };

            console.log('Sending test data:', testData);
            const response = await mcpClient.sendData(testData);
            console.log('Server response:', response);
            
            expect(response.success).toBe(true);
            expect(response.received).toEqual(testData);
        } catch (error) {
            console.error('Test failed:', error);
            throw error;
        }
    });
}); 