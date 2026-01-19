# MMO Trainer

A SvelteKit application for training and tracking MMO gameplay sessions.

## Developing

Install dependencies and start the development server:

```sh
npm install
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

## Deployment

This application uses `@sveltejs/adapter-node`, which creates a standalone Node.js server. **No npm is required on the server** - only Node.js runtime.

### Quick Deployment Steps

1. **Build locally** (where npm is available):
   ```bash
   npm install
   npm run build
   ```

2. **Transfer `.output/` directory** to your server (via SCP, rsync, FTP, etc.)

3. **On the server** (only needs Node.js, no npm):
   ```bash
   cd .output/server
   node index.js
   ```

### Server Requirements

- **Node.js**: Version 18+ (runtime only, no npm needed)
- **Disk Space**: ~50-100MB for application + data
- **Memory**: ~100-200MB RAM
- **Network**: Port for HTTP server (default 3000)

### Environment Variables

```bash
PORT=3000          # Server port (default: 3000)
HOST=0.0.0.0      # Server host (default: 0.0.0.0)
NODE_ENV=production
```

### Production Setup

#### Using PM2
```bash
pm2 start .output/server/index.js --name mmo-trainer
pm2 save
pm2 startup
```

#### Using systemd
Create `/etc/systemd/system/mmo-trainer.service`:
```ini
[Unit]
Description=MMO Trainer Application
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/deployment/.output/server
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable mmo-trainer
sudo systemctl start mmo-trainer
```

#### Using nohup (minimal)
```bash
nohup node .output/server/index.js > app.log 2>&1 &
```

### Data Persistence

The application stores data in the `data/` directory:
- `data/sessions/` - Training session data
- `data/settings.json` - Application settings

Ensure this directory exists and is writable:
```bash
mkdir -p data/sessions
chmod -R 755 data/
```

### Reverse Proxy (Recommended)

#### Nginx Example
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Updating the Application

1. Build new version locally: `npm run build`
2. Transfer new `.output/` directory to server
3. Restart the Node.js process:
   ```bash
   # PM2
   pm2 restart mmo-trainer
   
   # systemd
   sudo systemctl restart mmo-trainer
   
   # nohup
   pkill -f "node.*index.js"
   nohup node .output/server/index.js > app.log 2>&1 &
   ```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).
