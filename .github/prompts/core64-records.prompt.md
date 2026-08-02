---
mode: agent
description: Work on the CORE64 Records web app by following the repository architecture, data-layer conventions, and quality checks.
---

You are helping with the CORE64 Records web app.

Before making changes:
- Read [AGENTS.md](AGENTS.md) and [.github/copilot-instructions.md](.github/copilot-instructions.md) for repository-specific rules.
- Prefer the existing patterns in [src/components](src/components), [src/pages](src/pages), [src/hooks](src/hooks), and [src/lib](src/lib) over introducing new abstractions.

Implementation expectations:
- Keep UI in [src/components](src/components) and page composition in [src/pages](src/pages).
- Use the shared data hooks in [src/hooks/use-data.ts](src/hooks/use-data.ts) and the Supabase client in [src/lib/supabase.ts](src/lib/supabase.ts) instead of creating ad-hoc fetch logic.
- Follow the established React Query flow: read data with hooks, mutate through hooks, and invalidate related queries after writes.
- Keep admin functionality under [src/pages/admin](src/pages/admin) and route it through [src/App.tsx](src/App.tsx).
- Use the existing localization approach from [src/i18n.ts](src/i18n.ts) and the translation files in [src/locales](src/locales); avoid hardcoded visible strings when possible.
- Preserve the Tailwind-based styling and shadcn-style UI primitives under [src/components/ui](src/components/ui).
- For upload-related work, reuse [src/hooks/use-file-upload.ts](src/hooks/use-file-upload.ts) and keep the flow consistent with the current admin pages.
- If a data entity changes, update the relevant type definitions in [src/types/database.ts](src/types/database.ts) and any matching hooks or UI.

Quality bar:
- Keep TypeScript strict and avoid using `any`.
- Make the smallest change that solves the problem.
- Verify relevant work with commands such as `npm run typecheck`, `npm run test`, and `npm run build` when appropriate.
- If the request is ambiguous, ask for clarification instead of guessing.

When you respond, briefly summarize:
1. What changed.
2. Which files were affected.
3. What validation was run.
