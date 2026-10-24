# TrimmOS V3 Chromatic Flow — security remediation

## Scope and evidence limits

This document records evidence available in the V3 integration worktree and its
preserved V2 base, `5aa75d4c6db836ae67b19de48a3a0b8079b0042a`. It does not
replace a security assessment of the deployed service.

The original dependency-audit report and its detailed findings were not
available in the reviewed files or session evidence. Therefore, the initially
identified vulnerabilities, their severities, affected dependency ranges, and
GHSA/CVE identifiers cannot be verified here. No vulnerability IDs, dates, or
severity ratings are inferred or supplied.

The lockfile does provide a verifiable dependency-state comparison between the
parent of the V2 preservation commit and that commit:

| Dependency | Parent lockfile | V2 preservation lockfile | Evidence limitation |
|---|---:|---:|---|
| `astro` | 6.0.8 | 7.4.2 | The initial finding and its relationship to this update are unavailable. |
| `sharp` | 0.34.5 | 0.35.5 | The initial finding and its relationship to this update are unavailable. |
| `vite` | 7.3.1 | 8.3.5 | The initial finding and its relationship to this update are unavailable. |
| `@vercel/analytics` | 2.0.1 | 2.0.1 | No version change is shown by these lockfiles. |

These are observed lockfile versions, not a claim that any listed earlier
version was vulnerable or that a specific advisory was remediated. The V3
Chromatic Flow integration itself does not change the dependency manifests or
lockfile.

## Security-related changes and controls

- The V2 preservation commit updated the dependency lockfile and separates
  private asset processing from normal public builds. The available evidence
  does not establish which advisory, if any, motivated each dependency update.
- Astro is configured to publish `public-safe/`. Original screenshots are kept
  outside that public directory.
- `npm run assets:private` is an explicit, opt-in task. It uses private source
  screenshots and `scripts/privacy-regions.json`; it checks each source hash
  and dimensions before applying opaque redactions, flattening, and removing
  image metadata. It writes derived assets to `public-safe/` and does not
  modify the source screenshots.
- Normal `check`, `build`, and `verify` commands do not invoke the private
  pipeline. They use the public assets and `src/data/assets.generated.json`.
- `npm run verify` checks the built output for original screenshot paths,
  `auditoria-trimmos.json`, and `.env` files; checks that all eleven public
  images and thumbnails exist; validates redaction coverage in masters and
  thumbnails; checks for embedded image metadata; and checks the built hashes
  against the public assets.
- `.gitignore` excludes the original screenshot directory, the private mask
  manifest, local audit output, environment files, build output, and installed
  dependencies.
- The clean-copy validation used only version-candidate files and public
  assets. Targeted checks found no original screenshots, private mask manifest,
  local audit file, or `.env` file in that copy or its build output.

The V3-specific accessibility change adds Escape-key handling to the gallery
lightbox and restores focus through its existing close handler. It is not
presented as a dependency vulnerability fix.

## Validation evidence

The isolated clean-copy run completed successfully:

| Check | Result |
|---|---|
| `npm ci` | Passed; 265 packages installed. |
| `npm run check` | Passed with 0 errors and 0 warnings; one TypeScript deprecation hint for `ts.ModuleKind.None` remains. |
| `npm run build` | Passed; one static page built. |
| `npm run verify` | Passed; 11 reviewed screens, 34 local references, 10 WhatsApp links, and 30 output files. |
| `npm audit --audit-level=low` | Passed; 0 vulnerabilities reported by the audit run. |

The public gallery contains 22 image resources: eleven masters and eleven
thumbnails. Three additional public brand images are also present. Browser
checks confirmed reduced-motion mode, mobile layout without horizontal
overflow, gallery category selection, lightbox opening and Escape dismissal,
focus restoration, and mobile-menu Escape behavior.

These results describe the tested local candidate and its clean copy only.
They do not establish the security state of a Vercel deployment.

## Residual risks and pending Vercel review

- The missing initial audit report prevents a finding-by-finding closure
  assessment. Recover it from an authorized record before claiming that every
  originally reported issue is resolved.
- A zero-finding `npm audit` result is scoped to the lockfile and registry data
  available during that run; it is not a guarantee that the application has no
  vulnerabilities.
- Automated redaction checks validate only the masks and metadata represented
  by the public manifest. Each newly generated or changed screenshot still
  requires authorized visual review for information outside those masks.
- Vercel configuration and the Analytics dashboard were not accessed or
  changed. The code includes `@vercel/analytics/astro` behind the existing
  `VERCEL === "1"` condition, but Analytics activation and collection on a
  deployment have not been verified. No V3 traffic is claimed.

## Production closure criteria

Do not mark remediation closed in production until all of the following are
recorded:

1. The original audit evidence has been recovered, or the evidence gap has been
   explicitly accepted; every recoverable finding is mapped to its dependency,
   affected version range, severity, and verified advisory identifier.
2. The exact release commit passes clean CI for `npm ci`, `npm run check`,
   `npm run build`, `npm run verify`, and `npm audit --audit-level=low`, with
   results retained for review.
3. The release artifact and proposed Git contents are checked for private
   screenshots, private manifests, audit files, environment files, and
   credentials; all public screenshot derivatives receive the required
   privacy review.
4. An authorized reviewer verifies the Vercel deployment corresponds to that
   commit and checks the production build behavior, including the Analytics
   condition. Analytics dashboard review remains pending until authorized
   access is available.
5. The outstanding findings and residual risks are either resolved with
   evidence or explicitly accepted by the responsible owner.
