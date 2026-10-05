/**
 * OpenCode Server Manager CLI
 * Run: node src/server-manager.js [start|stop|status]
 */

const { OpenCodeServer } = require('./server.js');
require('dotenv').config();

const command = process.argv[2] || 'start';
const port = parseInt(process.env.OPENCODE_PORT || process.argv[3] || '4096', 10);
const password = process.env.OPENCODE_SERVER_PASSWORD;
const username = process.env.OPENCODE_SERVER_USERNAME || 'opencode';

if (!password) {
  console.error('❌ OPENCODE_SERVER_PASSWORD environment variable is required');
  console.error('Set it with: export OPENCODE_SERVER_PASSWORD="your-password"');
  process.exit(1);
}

const server = new OpenCodeServer({
  port,
  password,
  username,
  cors: (process.env.OPENCODE_CORS || '').split(',').filter(Boolean)
});

async function main() {
  switch (command) {
    case 'start':
      await server.start();
      console.log('\n📱 Access OpenCode mobile UI at:');
      console.log(`   http://localhost:${port}`);
      console.log(`\n🔐 Credentials:`);
      console.log(`   Username: ${username}`);
      console.log('   Password: configured via OPENCODE_SERVER_PASSWORD');
      console.log('\nPress Ctrl+C to stop\n');
      
      // Keep process alive
      process.on('SIGINT', () => {
        server.stop();
        process.exit(0);
      });
      break;

    case 'stop':
      server.stop();
      break;

    case 'status':
      const status = server.getStatus();
      console.log(status);
      break;

    default:
      console.log('Usage: node src/server-manager.js [start|stop|status]');
      break;
  }
}

main().catch((error) => {
  console.error('Server manager failed:', error);
  process.exit(1);
});