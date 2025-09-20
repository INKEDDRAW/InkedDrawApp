/**
 * Health Check Script
 * Standalone health check for Docker container
 */

import { createConnection } from 'net';

const HEALTH_CHECK_PORT = process.env.PORT || 3000;
const HEALTH_CHECK_HOST = 'localhost';
const HEALTH_CHECK_TIMEOUT = 3000;

/**
 * Simple TCP health check
 */
function healthCheck(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({
      port: Number(HEALTH_CHECK_PORT),
      host: HEALTH_CHECK_HOST,
      timeout: HEALTH_CHECK_TIMEOUT,
    });

    socket.on('connect', () => {
      socket.end();
      resolve(true);
    });

    socket.on('error', () => {
      resolve(false);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * Run health check and exit with appropriate code
 */
async function main() {
  try {
    const isHealthy = await healthCheck();
    
    if (isHealthy) {
      console.log('Health check passed');
      process.exit(0);
    } else {
      console.error('Health check failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Health check error:', error);
    process.exit(1);
  }
}

// Run health check if this file is executed directly
if (require.main === module) {
  main();
}

export { healthCheck };
