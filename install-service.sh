#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Installing systemd service...${NC}"

# Copy service file
cp /root/callcenter-app/callcenter.service /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

# Enable service
systemctl enable callcenter.service

# Start service
systemctl start callcenter.service

# Check status
systemctl status callcenter.service

echo -e "\n${GREEN}✓ Service installed and started${NC}"
echo -e "\n${YELLOW}Useful commands:${NC}"
echo -e "  Start:   systemctl start callcenter"
echo -e "  Stop:    systemctl stop callcenter"
echo -e "  Restart: systemctl restart callcenter"
echo -e "  Status:  systemctl status callcenter"
echo -e "  Logs:    journalctl -u callcenter -f"
