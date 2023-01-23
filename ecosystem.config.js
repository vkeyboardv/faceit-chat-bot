module.exports = {
  apps: [
    {
      name: 'faceit-chat-bot',
      script: './src/index.js',
      // instances: 1,
      // cron_restart: '0 * * * *',
      exp_backoff_restart_delay: 3000,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
