<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## SecureDesk workflow

Use docs/spec-v1-approved/ for business decisions and docs/LOCAL_SETUP.md for implementation status. Keep approved source documents unchanged. Explain small steps in Serbian and check understanding before the next major part. Product text is English.

Build the database, authentication and RLS with positive and negative access tests before dashboard or business functionality. Do not expand the MVP. Keep actual environment files, privileged keys and .tools/ out of Git. Local Windows Node 24 and npm are in .tools/node24/. Other machines should install Node 24 LTS and use npm ci.
