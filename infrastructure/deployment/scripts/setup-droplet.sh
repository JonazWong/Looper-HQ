#!/bin/bash
set -e

################################################################################
# Looper HQ - DigitalOcean Droplet Initial Setup Script
# This script prepares a fresh Ubuntu 22.04 droplet for production deployment
################################################################################

echo "🚀 Starting Looper HQ Droplet Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Update system packages
echo -e "${GREEN}[1/10] Updating system packages...${NC}"
apt-get update -y
apt-get upgrade -y

# Install essential packages
echo -e "${GREEN}[2/10] Installing essential packages...${NC}"
apt-get install -y \
    curl \
    wget \
    git \
    ufw \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    unattended-upgrades

# Install Docker
echo -e "${GREEN}[3/10] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Add Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    echo -e "${GREEN}Docker installed successfully!${NC}"
else
    echo -e "${YELLOW}Docker already installed, skipping...${NC}"
fi

# Install Node.js 20 and pnpm
echo -e "${GREEN}[4/10] Installing Node.js 20 and pnpm...${NC}"
if ! command -v node &> /dev/null || ! node -v | grep -q "^v20"; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # Install pnpm
    npm install -g pnpm@8.15.0
    
    echo -e "${GREEN}Node.js $(node -v) and pnpm $(pnpm -v) installed!${NC}"
else
    echo -e "${YELLOW}Node.js 20 already installed, skipping...${NC}"
fi

# Install Nginx
echo -e "${GREEN}[5/10] Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl enable nginx
    echo -e "${GREEN}Nginx installed successfully!${NC}"
else
    echo -e "${YELLOW}Nginx already installed, skipping...${NC}"
fi

# Install Certbot for SSL
echo -e "${GREEN}[6/10] Installing Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
    echo -e "${GREEN}Certbot installed successfully!${NC}"
else
    echo -e "${YELLOW}Certbot already installed, skipping...${NC}"
fi

# Configure UFW Firewall
echo -e "${GREEN}[7/10] Configuring UFW firewall...${NC}"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
echo -e "${GREEN}Firewall configured successfully!${NC}"

# Create application directory
echo -e "${GREEN}[8/10] Creating application directories...${NC}"
mkdir -p /opt/looper-hq
mkdir -p /var/log/looper-hq
mkdir -p /opt/backups/looper-hq

# Set proper permissions
chown -R $SUDO_USER:$SUDO_USER /opt/looper-hq
chown -R $SUDO_USER:$SUDO_USER /var/log/looper-hq
chown -R $SUDO_USER:$SUDO_USER /opt/backups/looper-hq

echo -e "${GREEN}Directories created successfully!${NC}"

# Configure automatic security updates
echo -e "${GREEN}[9/10] Configuring automatic security updates...${NC}"
cat > /etc/apt/apt.conf.d/50unattended-upgrades << EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

systemctl enable unattended-upgrades
systemctl start unattended-upgrades

echo -e "${GREEN}Automatic security updates configured!${NC}"

# Display system information
echo -e "${GREEN}[10/10] Setup complete!${NC}"
echo ""
echo -e "${GREEN}=== System Information ===${NC}"
echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker compose version)"
echo "Node.js version: $(node -v)"
echo "pnpm version: $(pnpm -v)"
echo "Nginx version: $(nginx -v 2>&1)"
echo "Certbot version: $(certbot --version)"
echo ""
echo -e "${GREEN}=== Next Steps ===${NC}"
echo "1. Clone your repository to /opt/looper-hq"
echo "2. Configure environment variables in .env.production"
echo "3. Run the deploy.sh script to start the application"
echo "4. Set up SSL with: sudo certbot --nginx -d your-domain.com"
echo ""
echo -e "${GREEN}✅ Droplet setup completed successfully!${NC}"
