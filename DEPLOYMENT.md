# Server Deployment Guide

This guide explains how to deploy this SvelteKit application to a server **without npm installed**.

## Prerequisites

### On Your Local Machine (or CI/CD)
- Node.js and npm installed
- All project dependencies

### On the Server
- **Node.js** (version 18 or higher recommended)
- **No npm required** - only Node.js runtime

## Deployment Steps

### 1. Build the Application Locally

On your local machine (or in CI/CD), build the production bundle:

```bash
# Install dependencies (if not already done)
npm install

# Build the application
npm run build
```

This creates a production-ready build in the `.output/` directory.

### 2. Prepare Files for Transfer

The build process creates a standalone server in `.output/server/`. You need to transfer:

- **`.output/`** directory (entire contents)
- **`data/`** directory (if it exists, for persistent storage)

**Optional but recommended:**
- Create a simple startup script (see below)

### 3. Transfer to Server

Transfer the `.output/` directory to your server. You can use:

```bash
# Using SCP
scp -r .output user@server:/path/to/deployment/

# Using rsync (recommended - only transfers changes)
rsync -avz .output/ user@server:/path/to/deployment/.output/

# Or use any file transfer method (FTP, SFTP, etc.)
```

### 4. On the Server: Start the Application

The `.output/server/` directory contains a standalone Node.js server. To run it:

```bash
# Navigate to the server directory
cd /path/to/deployment/.output/server

# Run the server
node index.js
```

The server will start and listen on the port specified in your environment (default is usually 3000).

### 5. Environment Variables (Optional)

If you need to configure the server, create a `.env` file in `.output/server/` or set environment variables:

```bash
# Example: Set port
PORT=3000 node index.js

# Or use environment variables
export PORT=3000
export HOST=0.0.0.0
node index.js
```

### 6. Production Setup with Process Manager

For production, use a process manager to keep the server running:

#### Using PM2 (if available)
```bash
# Install PM2 globally (if possible)
npm install -g pm2

# Or download PM2 binary directly
# Start the application
pm2 start .output/server/index.js --name mmo-trainer

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Using systemd (Linux)
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

#### Using nohup (minimal setup)
```bash
nohup node .output/server/index.js > app.log 2>&1 &
```

### 7. Reverse Proxy (Recommended)

Set up a reverse proxy (nginx, Apache, Caddy) to serve the application:

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

## Directory Structure on Server

After deployment, your server should have:

```
/path/to/deployment/
├── .output/
│   ├── server/          # Standalone Node.js server
│   │   ├── index.js     # Main server file (run this)
│   │   ├── package.json # Server dependencies (already bundled)
│   │   └── ...          # Other server files
│   └── client/          # Static assets
└── data/                # Application data (sessions, settings)
    ├── sessions/
    └── settings.json
```

## Data Persistence

The application stores data in the `data/` directory. Make sure:
- The `data/` directory exists and is writable
- The directory persists across deployments
- Consider backing up this directory regularly

## Updating the Application

To update the application:

1. **On local machine:** Build new version (`npm run build`)
2. **Transfer:** Upload new `.output/` directory to server
3. **On server:** Restart the Node.js process

```bash
# If using PM2
pm2 restart mmo-trainer

# If using systemd
sudo systemctl restart mmo-trainer

# If using nohup, kill old process and start new one
pkill -f "node.*index.js"
nohup node .output/server/index.js > app.log 2>&1 &
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Permission Denied
```bash
# Make sure Node.js has execute permissions
chmod +x .output/server/index.js

# Check directory permissions
chmod -R 755 .output/
```

### Cannot Write to Data Directory
```bash
# Create and set permissions for data directory
mkdir -p data/sessions
chmod -R 755 data/
```

## Minimal Server Requirements

- **Node.js**: Version 18+ (runtime only, no npm needed)
- **Disk Space**: ~50-100MB for application + data
- **Memory**: ~100-200MB RAM (depends on usage)
- **Network**: Port for HTTP server (default 3000)

## Quick Start Script

Create a `start.sh` script on the server:

```bash
#!/bin/bash
cd /path/to/deployment/.output/server
export NODE_ENV=production
export PORT=${PORT:-3000}
export HOST=${HOST:-0.0.0.0}
node index.js
```

Make it executable:
```bash
chmod +x start.sh
./start.sh
```
