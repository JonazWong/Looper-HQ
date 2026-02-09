# Looper HQ Documentation

## 📚 Documentation Index

### Getting Started
- [README](../README.md) - Project overview and quick start
- [Architecture](./ARCHITECTURE.md) - System architecture

### Deployment
- [Deployment Guide](./deployment/README.md) - Complete deployment guide
- [Digital Ocean Setup](./deployment/digitalocean.md) - DO-specific instructions
- [Quick Start](./deployment/quickstart.md) - 5-minute deployment

### Guides
- [Demo Guide](./guides/demo-guide.md) - Presentation walkthrough
- [Bilingual System](./guides/bilingual-system.md) - i18n implementation
- [Testing Guide](./guides/testing.md) - Testing infrastructure
- [Git Workflows](./guides/git-workflows.md) - Git best practices

### Archive
- [Implementation History](./archive/) - Historical implementation notes

---

## 📖 Quick Links

### For Developers
- [Quick Start Guide](./QUICKSTART.md)
- [Testing Guide](./guides/testing.md)
- [Migration Guide](./migration/README.md)

### For Deployment
- [5-Minute Quick Deploy](./deployment/quickstart.md)
- [Digital Ocean Setup](./deployment/digitalocean.md)
- [Full Deployment Guide](./deployment/README.md)

### For Product Demos
- [Demo Presentation Guide](./guides/demo-guide.md)
- [Feature Overview](../README.md#platform-architecture)

---

## 🌏 Language Support

This project supports bilingual interface (繁體中文/English):
- [Bilingual System Implementation](./guides/bilingual-system.md)

---

## 📦 Project Structure

```
looper-hq/
├── apps/
│   ├── web/                    # Main Next.js web application (port 3000)
│   └── legal-case-search/      # Legal case management app (port 3001)
├── services/                   # Microservices
├── packages/
│   ├── database/               # Shared Prisma database
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Shared utilities
│   └── config/                 # Shared configurations
├── infrastructure/
│   ├── docker/                 # Docker Compose configs
│   └── keycloak/              # Keycloak realm configurations
└── docs/                       # Documentation (you are here)
```

---

## 🤝 Contributing

For contribution guidelines and development workflow:
- See [Git Workflows](./guides/git-workflows.md)
- See [Testing Guide](./guides/testing.md)

---

## 🆘 Support

- **Issues**: https://github.com/JonazWong/Looper-HQ/issues
- **Documentation**: This directory
- **Archive**: [Historical documentation](./archive/) for reference
