# Matrix discovery on Amplify

After deploying these JSON assets, add the following rules in Amplify Hosting → Rewrites and redirects, **above any catch-all rules**. Preserve existing rules.

| Source | Target | Type |
| --- | --- | --- |
| `/.well-known/matrix/server` | `/.well-known/matrix/server.json` | `200 (Rewrite)` |
| `/.well-known/matrix/client` | `/.well-known/matrix/client.json` | `200 (Rewrite)` |

Use rewrites, not redirects. Confirm both extensionless URLs return `200 application/json` and that the client endpoint includes `Access-Control-Allow-Origin: *`. The server endpoint should advertise `matrix.nocohackers.com:8448`. These rules are configured in Amplify, not installed by merging this change.
