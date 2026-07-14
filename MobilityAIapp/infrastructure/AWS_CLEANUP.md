# AWS S3 Bucket Audit — OpusAIMobility

> Last updated: 2026-07-12

---

## Complete S3 Bucket Inventory

| Bucket | Status | CloudFront | Contents | Action |
|--------|--------|-----------|----------|--------|
| `opusaimobility-assets-prod` | ✅ **PRIMARY** | E18GJ5VKHBIJAI → `opusaimobility.yna.co.ke` + E1TIJJKJ2UEIO7 → `omniride.yna.co.ke` | 16 files, 771 KB (frontend build) | **Keep — active origin** |
| `opusaimobility-apk-distribution` | ✅ **ACTIVE** | None | Android APK releases | **Keep** |
| `opusaimobility-codebuild-artifacts-683541453923` | ✅ **ACTIVE** | None | CI/CD build cache | **Keep** |
| `opusaimobility-frontend` | ⚠️ **STANDBY** | EJ6WOJNLU8XBO (no alias) | 16 files, 771 KB (older build) | **Keep — see note below** |
| `omniride-assets-prod` | ⚠️ **RETAIN** | E1TIJJKJ2UEIO7 → `omniride.yna.co.ke` | 16 files, 771 KB | **Keep until DNS migrated** |
| `aimobility-uploads-683541453923` | ✅ **ACTIVE** | None | User file uploads (Amplify) | **Keep** |
| `terraai-assets-683541453923` | 🗑️ **DELETED** | None | Was: 1 stale docs file | ✅ Deleted 2026-07-12 |
| `terraaimobility-assets-683541453923` | 🗑️ **DELETED** | None | Was: empty | ✅ Deleted 2026-07-12 |
| `terraaimobility-admin-panel-683541453923` | ❓ **Review** | None | Unverified | Check before deleting |

---

## `opusaimobility-frontend` — Standby Bucket

This bucket has a **live CloudFront distribution** (`EJ6WOJNLU8XBO` → `d2n7unmdlkmzo0.cloudfront.net`)
but **no custom DNS alias** attached to it — reachable only via the bare CloudFront domain.

| Property | Value |
|----------|-------|
| Objects | 16 files, 771 KB (full frontend build, older hash) |
| CloudFront ID | `EJ6WOJNLU8XBO` |
| CloudFront domain | `d2n7unmdlkmzo0.cloudfront.net` |
| Custom alias | None |
| Bucket policy | None (no OAC attached) |
| Website hosting | Enabled |

**It is a predecessor deployment slot** — created before `opusaimobility-assets-prod`
became the primary. It is not publicly traffic-facing via DNS.

### To consolidate (optional)
1. Disable CloudFront distribution `EJ6WOJNLU8XBO`
2. `aws s3 rm s3://opusaimobility-frontend --recursive`
3. `aws s3api delete-bucket --bucket opusaimobility-frontend --region us-east-1`

---

## `omniride-assets-prod` — Retain Until DNS Migration

| Property | Value |
|----------|-------|
| CloudFront | E1TIJJKJ2UEIO7 → `omniride.yna.co.ke`, `app.opusaimobility.yna.co.ke` |
| Objects | 16 files, 771 KB |
| Bucket policy | OAC from E1TIJJKJ2UEIO7 only |

**Safe to delete only after:**
1. Update E1TIJJKJ2UEIO7 origin → `opusaimobility-assets-prod`  
2. Migrate `omniride.yna.co.ke` DNS CNAME → `d22up4o3zhu9gf.cloudfront.net` (E18GJ5VKHBIJAI)  
3. Empty + delete this bucket

---

## Deletions Completed

| Bucket | Deleted | Reason |
|--------|---------|--------|
| `terraai-assets-683541453923` | 2026-07-12 | Old `terraai-` brand. 1 stale docs file. No CloudFront. No references. |
| `terraaimobility-assets-683541453923` | 2026-07-12 | Old `terraaimobility-` brand. Completely empty. No CloudFront. No references. |

---

## IAM Policy Cleanup (also completed)

`opusaimobility-github-deploy-policy` updated to **v3**:

| Statement | Removed | Retained |
|-----------|---------|----------|
| `LambdaDeploy` | `terraaimobility-*`, `omniride-*`, `terraai-*` | `opusaimobility-*` only |
| `S3FrontendDeploy` | `omniride-assets-prod` | `opusaimobility-assets-prod` only |
| `CloudFrontInvalidate` | `E1TIJJKJ2UEIO7` | `E18GJ5VKHBIJAI` only |
