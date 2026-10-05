/**
 * OpenCode Server Manager
 * Starts and manages the OpenCode web server
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

class OpenCodeServer {
  constructor(options = {}) {
    this.options = {
      port: options.port || 4096,
      hostname: options.hostname || '127.0.0.1',
      password: options.password || process.env.OPENCODE_SERVER_PASSWORD,
      username: options.username || process.env.OPENCODE_SERVER_USERNAME || 'opencode',
      cors: options.cors || [],
      ...options
    };
    
    this.process = null;
    this.isRunning = false;
  }

  /**
   * Check if OpenCode is installed
   */
  checkOpenCodeInstalled() {
    return new Promise((resolve) => {
      const openCodePath = this.getOpenCodePath();
      const child = spawn(openCodePath, ['--version'], {
        stdio: 'ignore',
        shell: process.platform === 'win32' && openCodePath.endsWith('.cmd')
      });
      child.once('error', () => resolve(false));
      child.once('exit', (code) => resolve(code === 0));
    });
  }

  /**
   * Get OpenCode path
   */
  getOpenCodePath() {
    const isWindows = process.platform === 'win32';
    const candidates = [
      // Standard install locations
      path.join(os.homedir(), '.opencode', 'bin', isWindows ? 'opencode.exe' : 'opencode'),
      path.join(os.homedir(), '.local', 'bin', isWindows ? 'opencode.exe' : 'opencode'),
      path.join(os.homedir(), '.opencode', 'bin', 'opencode'),
      path.join(os.homedir(), '.local', 'bin', 'opencode'),
      // npm global installs (Windows)
      path.join(os.homedir(), 'AppData', 'Roaming', 'npm', isWindows ? 'opencode.cmd' : 'opencode'),
      // npm global installs (Linux/Mac)
      path.join(os.homedir(), 'npm-global', 'bin', 'opencode'),
      '/usr/local/bin/opencode',
      '/usr/bin/opencode',
      'opencode'
    ];

    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      } catch (e) {
        // Ignore path errors
      }
    }
    return isWindows ? 'opencode.cmd' : 'opencode';
  }

  /**
   * Start the OpenCode web server
   */
  async start() {
    if (!this.options.password) {
      throw new Error(
        'No server password set. Provide options.password or set OPENCODE_SERVER_PASSWORD ' +
        'to a strong value before starting the server.'
      );
    }

    const installed = await this.checkOpenCodeInstalled();
    if (!installed) {
      throw new Error(
        'OpenCode is not installed. Install it explicitly from the official OpenCode instructions before starting this server.'
      );
    }

    console.log('🚀 Starting OpenCode web server...');

    const openCodePath = this.getOpenCodePath();
    
    const args = [
      'web',
      '--port', String(this.options.port),
      '--hostname', this.options.hostname
    ];

    // Add CORS origins
    this.options.cors.forEach(origin => {
      args.push('--cors', origin);
    });

    // Set environment variables for auth
    const env = {
      ...process.env,
      OPENCODE_SERVER_PASSWORD: this.options.password,
      OPENCODE_SERVER_USERNAME: this.options.username
    };

    this.process = spawn(openCodePath, args, {
      env,
      stdio: 'inherit',
      shell: process.platform === 'win32' && openCodePath.endsWith('.cmd')
    });

    this.process.on('error', (error) => {
      console.error('Failed to start OpenCode:', error);
    });

    this.process.on('exit', (code) => {
      this.isRunning = false;
      console.log(`OpenCode server stopped with code ${code}`);
    });

    this.isRunning = true;

    // Wait for server to be ready
    await this.waitForServer();

    return {
      port: this.options.port,
      hostname: this.options.hostname,
      username: this.options.username
    };
  }

  /**
   * Wait for server to be ready
   */
  async waitForServer() {
    const timeout = 10000;
    const start = Date.now();
    const url = `http://${this.options.hostname}:${this.options.port}/doc`;

    while (Date.now() - start <= timeout) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
        if (response.ok) {
          console.log(`✅ OpenCode server ready at http://${this.options.hostname}:${this.options.port}`);
          return;
        }
      } catch {
        // Server is still starting.
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('⚠️  Server not ready within timeout, but may still be starting...');
  }

  /**
   * Stop the server
   */
  stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.isRunning = false;
      console.log('🛑 OpenCode server stopped');
    }
  }

  /**
   * Get server status
   */
  getStatus() {
    return {
      running: this.isRunning,
      port: this.options.port,
      hostname: this.options.hostname
    };
  }
}

export { OpenCodeServer }; 