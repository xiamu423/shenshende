#!/bin/bash
set -e

echo "=== 1. 更新系统库 ==="
apt-get update

echo "=== 2. 安装 Node.js 20 和 Nginx ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx

echo "=== 3. 安装 PM2 进程守护程序 ==="
npm install -g pm2

echo "=== 4. 编译前端代码 ==="
npm install
npm run build

echo "=== 5. 启动后端服务 ==="
cd server
npm install
pm2 stop shenshende-api || true
pm2 start index.js --name shenshende-api
pm2 save
cd ..

echo "=== 6. 配置 Nginx 代理规则 ==="
cat << 'EOT' > /etc/nginx/sites-available/default
server {
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
}
EOT

echo "=== 7. 赋予访问权限并重启服务 ==="
chmod 755 /root
chmod -R 755 /root/shenshende
systemctl restart nginx

echo "======================================"
echo "🎉 部署大功告成！！！"
echo "👉 现在可以直接在浏览器输入这台服务器的公网 IP 访问社区了！"
echo "======================================"
