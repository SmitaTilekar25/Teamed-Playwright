const express = require('express');
const app = express();

// Enable JSON parsing for request bodies
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Available tools
const tools = [
  {
    name: "calculator",
    description: "Basic calculator tool",
    functions: ["add", "subtract", "multiply", "divide"]
  },
  {
    name: "converter",
    description: "Unit conversion tool",
    functions: ["temperature", "length", "weight"]
  }
];

// MCP server routes
app.get('/health', (req, res) => {
  console.log('Health check endpoint called');
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Tools endpoint
app.get('/api/mcp/tools', (req, res) => {
  console.log('Tools endpoint called');
  res.json({ 
    success: true, 
    tools: tools,
    message: "Available tools retrieved successfully"
  });
});

// Tool execution endpoint
app.post('/api/mcp/tools/:toolName', (req, res) => {
  const { toolName } = req.params;
  const { function: functionName, params } = req.body;
  
  console.log(`Tool execution called for ${toolName}, function: ${functionName}`, params);
  
  const tool = tools.find(t => t.name === toolName);
  if (!tool) {
    return res.status(404).json({ 
      success: false, 
      error: `Tool '${toolName}' not found` 
    });
  }
  
  if (!tool.functions.includes(functionName)) {
    return res.status(400).json({ 
      success: false, 
      error: `Function '${functionName}' not available for tool '${toolName}'` 
    });
  }
  
  // Mock tool execution
  res.json({ 
    success: true, 
    result: `Executed ${functionName} for ${toolName} with params: ${JSON.stringify(params)}`,
    timestamp: new Date().toISOString()
  });
});

// Add your MCP-specific endpoints here
app.post('/api/mcp/data', (req, res) => {
  console.log('MCP data endpoint called with body:', req.body);
  res.json({ success: true, received: req.body });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Start the server
const PORT = process.env.MCP_SERVER_PORT || 3000;

// Wrap server startup in try-catch
try {
  const server = app.listen(PORT, () => {
    console.log(`MCP server is running on port ${PORT}`);
    console.log(`Health check endpoint: http://localhost:${PORT}/health`);
    console.log(`Tools endpoint: http://localhost:${PORT}/api/mcp/tools`);
    console.log(`Tool execution endpoint: http://localhost:${PORT}/api/mcp/tools/:toolName`);
  });

  // Handle server errors
  server.on('error', (error) => {
    console.error('Server error occurred:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    }
  });
} catch (error) {
  console.error('Failed to start server:', error);
} 