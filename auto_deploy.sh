#!/bin/bash
export PATH=$PATH:/usr/local/go/bin:/usr/local/bin:/usr/bin:/bin

# Since you pull independently, we just run the build and restart
echo "$(date): Starting scheduled midnight build..."

# --- BUILD FRONTEND ---
cd /home/sekilas/kilas/frontend
npm install && npm run build

# --- BUILD BACKEND ---
cd /home/sekilas/kilas/backend
go build -v

# --- RESTART SERVICE ---
sudo systemctl restart kilas_backend.service

echo "$(date): Build and deployment completed."