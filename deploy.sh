#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Call Center App Deployment Script       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root (use sudo)${NC}"
  exit 1
fi

# Update system
echo -e "\n${YELLOW}[1/8] Updating system...${NC}"
apt update && apt upgrade -y

# Install Node.js 20.x
echo -e "\n${YELLOW}[2/8] Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL
echo -e "\n${YELLOW}[3/8] Installing PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib

# Install Nginx
echo -e "\n${YELLOW}[4/8] Installing Nginx...${NC}"
apt install -y nginx

# Install Certbot for SSL
echo -e "\n${YELLOW}[5/8] Installing Certbot...${NC}"
apt install -y certbot python3-certbot-nginx

# Setup PostgreSQL database
echo -e "\n${YELLOW}[6/8] Setting up PostgreSQL database...${NC}"
sudo -u postgres psql << EOF
CREATE DATABASE callcenter_db;
CREATE USER callcenter_user WITH ENCRYPTED PASSWORD 'CallCenter2024!SecurePass';
GRANT ALL PRIVILEGES ON DATABASE callcenter_db TO callcenter_user;
\c callcenter_db
GRANT ALL ON SCHEMA public TO callcenter_user;
EOF

# Run database schema
echo -e "\n${YELLOW}[7/8] Creating database schema...${NC}"
sudo -u postgres psql -d callcenter_db -f /root/callcenter-app/server/database/schema.sql

# Install dependencies
echo -e "\n${YELLOW}[8/8] Installing application dependencies...${NC}"
cd /root/callcenter-app
npm install
cd client
npm install
cd ..

echo -e "\n${GREEN}✓ Deployment preparation completed!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Configure .env file"
echo -e "2. Initialize database: node server/scripts/init-db.js"
echo -e "3. Build frontend: cd client && npm run build"
echo -e "4. Setup Nginx configuration"
echo -e "5. Setup SSL certificate"
echo -e "6. Start the application"
