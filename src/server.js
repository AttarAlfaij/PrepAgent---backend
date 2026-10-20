const dotenv = require('dotenv');
// Load environment variables
dotenv.config();

// Warn early if the JWT secret is missing; otherwise tokens are signed with a
// publicly known built-in default and can be forged.
if (!process.env.JWT_SECRET) {
  console.warn(
    '[Server] Warning: JWT_SECRET is not set; falling back to a built-in default. Set JWT_SECRET in your environment (e.g. Render -> Environment) so tokens cannot be forged.'
  );
}

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
const startServer = async () => {
  try {
    await connectDB();

    // Bind explicitly to 0.0.0.0 so the service is reachable from Render's
    // proxy (and any container/host), not just localhost.
    const HOST = '0.0.0.0';
    const server = app.listen(PORT, HOST, () => {
      console.log(`[Server] PrepAgent AI backend is running on ${HOST}:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle graceful shutdown
    const handleShutdown = () => {
      console.log('\n[Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);
  } catch (err) {
    console.error(`[Server Error] Startup failed: ${err.message}`);
    process.exit(1);
  }
};

startServer();
