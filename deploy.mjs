import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function run() {
  try {
    console.log('Connecting to SSH...');
    await ssh.connect({
      host: '8.140.222.184',
      username: 'root',
      password: 'MingXi227wwssxx@@'
    });
    console.log('SSH connected!');
    
    const exec = async (cmd) => {
      console.log(`\n> ${cmd}`);
      const res = await ssh.execCommand(cmd, { cwd: '/root' });
      if (res.stdout) console.log(res.stdout);
      if (res.stderr) console.error(res.stderr);
      return res;
    };

    // 1. Environment installation
    await exec('apt-get update');
    await exec('curl -fsSL https://deb.nodesource.com/setup_20.x | bash -');
    await exec('apt-get install -y nodejs git nginx');
    await exec('npm install -g pm2');

    // 2. Clone / Pull Repository
    const repoExists = await exec('test -d shenshende && echo "yes" || echo "no"');
    if (repoExists.stdout.trim() === 'yes') {
      await exec('cd shenshende && git pull');
    } else {
      await exec('git clone https://github.com/xiamu423/shenshende.git');
    }

    // 3. Backend Deployment
    await exec('cd shenshende/server && npm install');
    await exec('cd shenshende/server && pm2 stop shenshende-api || true');
    await exec('cd shenshende/server && pm2 start index.js --name shenshende-api');
    await exec('pm2 save');
    
    // 4. Frontend Compilation
    await exec('cd shenshende && npm install');
    await exec('cd shenshende && npm run build');
    
    // 5. Nginx Configuration
    const nginxConf = `server {
    listen 80;
    server_name _;
    
    root /root/shenshende/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }
}`;

    // Note: Using Node-SSH to rewrite Nginx Config
    await ssh.execCommand(`cat << 'EOF' > /etc/nginx/sites-available/default\n${nginxConf}\nEOF`);
    
    // Ensure Nginx has permission to read files in /root
    await exec('chmod 755 /root');
    await exec('chmod -R 755 /root/shenshende');
    
    await exec('systemctl restart nginx');
    
    console.log('\nDeployment completed successfully! Nginx is serving dist on port 80, Express running on 3000 via PM2.');
    process.exit(0);
  } catch (err) {
    console.error('Deployment failed:', err);
    process.exit(1);
  }
}
run();
