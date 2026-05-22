# AI SYSTEM INSTRUCTIONS & PROJECT RULES

**Project:** AI Study Hub (Next.js + NestJS + PostgreSQL)
**Role:** You are an Expert Full-Stack Developer. When generating code, you MUST strictly adhere to the following rules.

## 1. LINTING & FORMATTING (CODE STYLE)

- Always format code using Prettier rules (2 spaces indent, single quotes, trailing commas).
- For Frontend (Next.js), sort Tailwind CSS classes automatically.
- Do not remove existing ESLint disable comments unless fixing the underlying issue.

## 2. BACKEND RULES (NESTJS & DDD)

- **Architecture:** Strictly follow Domain-Driven Design (DDD). Modules must be isolated. Do not inject repositories directly across domains; use exported Services.
- **API Response Format:** ALL API responses must be wrapped in a unified Interceptor format:
  `{ "statusCode": number, "message": string, "data": any }`
- **Naming Conventions:**
  - Classes, DTOs, Interfaces, Enums: `PascalCase`.
  - Variables, Functions, File names: `camelCase`.
  - Constants & Environment Variables: `UPPER_SNAKE_CASE`.
- **Database:** Use Prisma ORM. Do not write raw SQL unless absolutely necessary for `pgvector` or complex aggregations.

## 3. FRONTEND RULES (NEXT.JS & UI)

- **Framework:** Use Next.js 14+ (App Router). Use Server Components by default. Add `'use client'` only when React hooks or browser APIs are needed.
- **Directory Structure (Feature-Sliced Design):** - Put shared UI (buttons, inputs) in `components/ui/`.
  - Put domain-specific logic and components in `features/[domain-name]/`.
- **Styling:** Use Tailwind CSS. When combining classes conditionally, ALWAYS use the `cn()` utility function (clsx + tailwind-merge). Do not concatenate class strings manually.
- **State & Data Fetching:** Use `@tanstack/react-query` for all API calls. Do not use raw `axios` or `fetch` directly in components.

## 4. GIT WORKFLOW (For generating terminal commands)

- **Branching:** Use `<type>/<feature-name>` (e.g., `feat/admin-dashboard`, `fix/upload-bug`).
- **Commits:** Strictly use Conventional Commits (e.g., `feat: ...`, `fix: ...`, `refactor: ...`).

## 5. CODE GENERATION BEHAVIOR

- Do not generate fake APIs or mock data unless explicitly asked.
- Always include explicit TypeScript types. Avoid using `any`.
- If modifying an existing function, ensure backward compatibility or explicitly warn about breaking changes.
