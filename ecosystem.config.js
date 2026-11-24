/**
 * RISKOS 24/7 Production Process Manager Configuration (PM2)
 * ==============================================================================
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 startup && pm2 save
 *   pm2 status
 *   pm2 logs riskos-daemon
 * ==============================================================================
 */

module.exports = {
  apps: [
    {
      name: 'riskos-daemon',
      script: './server/riskosDaemon.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M',
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        HOST: '0.0.0.0'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8080,
        HOST: '127.0.0.1'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/riskos-error.log',
      out_file: './logs/riskos-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
