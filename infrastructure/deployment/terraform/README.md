# Terraform Infrastructure (Optional)

This directory can be used for Infrastructure as Code (IaC) using Terraform to automate DigitalOcean droplet provisioning.

## Why Terraform?

- **Reproducible infrastructure**: Deploy identical environments
- **Version control**: Track infrastructure changes
- **Automation**: Programmatically create/destroy resources
- **Multi-environment**: Easily manage dev/staging/prod

## Quick Start (Future Implementation)

Example Terraform files for automating DigitalOcean droplet creation:

### main.tf
```hcl
terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_droplet" "looper_hq" {
  image  = "ubuntu-22-04-x64"
  name   = "looper-hq-production"
  region = "sgp1"
  size   = "s-2vcpu-4gb"
  ssh_keys = [var.ssh_key_fingerprint]
  
  tags = ["production", "looper-hq"]
}

resource "digitalocean_firewall" "looper_hq" {
  name = "looper-hq-firewall"
  
  droplet_ids = [digitalocean_droplet.looper_hq.id]
  
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }
  
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }
  
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }
}
```

### variables.tf
```hcl
variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "ssh_key_fingerprint" {
  description = "SSH key fingerprint"
  type        = string
}
```

### outputs.tf
```hcl
output "droplet_ip" {
  value = digitalocean_droplet.looper_hq.ipv4_address
}

output "droplet_id" {
  value = digitalocean_droplet.looper_hq.id
}
```

## Usage

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply changes
terraform apply

# Destroy infrastructure
terraform destroy
```

## Note

For now, the manual setup script (`setup-droplet.sh`) is recommended for simplicity.
Terraform can be implemented later for multi-environment deployments or scaling needs.
