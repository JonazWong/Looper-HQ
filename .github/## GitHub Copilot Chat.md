## GitHub Copilot Chat

- Extension: 0.37.8 (prod)
- VS Code: 1.109.5 (072586267e68ece9a47aa43f8c108e0dcbf44622)
- OS: win32 10.0.26100 x64
- GitHub Account: JonazWong

## Network

User Settings:
```json
  "http.systemCertificatesNode": true,
  "github.copilot.advanced.debug.useElectronFetcher": true,
  "github.copilot.advanced.debug.useNodeFetcher": false,
  "github.copilot.advanced.debug.useNodeFetchFetcher": true
```

Connecting to https://api.github.com:
- DNS ipv4 Lookup: 20.205.243.168 (10 ms)
- DNS ipv6 Lookup: Error (100 ms): getaddrinfo ENOTFOUND api.github.com
- Proxy URL: http://127.0.0.1:49726 (1 ms)
- Proxy Connection: 200 OK (56 ms)
- Electron fetch (configured): HTTP 200 (54 ms)
- Node.js https: HTTP 200 (178 ms)
- Node.js fetch: HTTP 200 (312 ms)

Connecting to https://api.githubcopilot.com/_ping:
- DNS ipv4 Lookup: 140.82.113.22 (35 ms)
- DNS ipv6 Lookup: Error (17 ms): getaddrinfo ENOTFOUND api.githubcopilot.com
- Proxy URL: http://127.0.0.1:49726 (6 ms)
- Proxy Connection: 200 OK (253 ms)
- Electron fetch (configured): HTTP 200 (253 ms)
- Node.js https: HTTP 200 (756 ms)
- Node.js fetch: HTTP 200 (1098 ms)

Connecting to https://copilot-proxy.githubusercontent.com/_ping:
- DNS ipv4 Lookup: 4.237.22.41 (22 ms)
- DNS ipv6 Lookup: Error (32 ms): getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
- Proxy URL: http://127.0.0.1:49726 (3 ms)
- Proxy Connection: 200 OK (150 ms)
- Electron fetch (configured): HTTP 200 (623 ms)
- Node.js https: HTTP 200 (517 ms)
- Node.js fetch: HTTP 200 (648 ms)

Connecting to https://mobile.events.data.microsoft.com: HTTP 404 (311 ms)
Connecting to https://dc.services.visualstudio.com: HTTP 404 (909 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (800 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (779 ms)
Connecting to https://default.exp-tas.com: HTTP 400 (284 ms)

Number of system certificates: 87

## Documentation

In corporate networks: [Troubleshooting firewall settings for GitHub Copilot](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot).