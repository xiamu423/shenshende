module.exports = { apps: [
  { name:'comino-world-api', script:'server/index.js', cwd:__dirname, instances:1, autorestart:true, restart_delay:2000, max_memory_restart:'350M', kill_timeout:5000, time:true, env_production:{ NODE_ENV:'production' }, error_file:'/var/log/comino-world/pm2-error.log', out_file:'/var/log/comino-world/pm2-out.log', merge_logs:true },
  { name:'comino-world-upload-cleanup', script:'server/cleanup-orphan-uploads.js', cwd:__dirname, autorestart:false, cron_restart:'17 3 * * *', args:'--apply', time:true, env_production:{ NODE_ENV:'production' }, error_file:'/var/log/comino-world/cleanup-error.log', out_file:'/var/log/comino-world/cleanup-out.log' }
] };
