module.exports = {
  apps: [
    {
      name: 'sankalphub-v2',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/Master_Sankalphub/V2.0_Frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
