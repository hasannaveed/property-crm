---
name: Property CRM Project
description: Full-stack Property Dealer CRM built with Next.js 16, MongoDB/Mongoose 9, NextAuth v4
type: project
---

Property CRM assignment built for University Semester 6 Web course.

**Why:** University assignment requiring a production-grade real estate CRM for Pakistan agents.

**Stack:** Next.js 16.2.4 (App Router), React 19, MongoDB + Mongoose 9, NextAuth v4, Tailwind v4, Recharts, lucide-react, bcryptjs, nodemailer.

**How to apply:** When making changes, note that params in dynamic routes are Promises (must `await params`), Tailwind v4 uses `@import "tailwindcss"` and `@layer components`, Mongoose 9 pre-save hooks use async functions without `next` parameter.

All source files live in `src/` (not root `app/`). tsconfig `@/*` maps to `./src/*`.

Demo credentials expected:
- Admin: admin@propertycrm.pk / admin123456
- Agent: agent@propertycrm.pk / agent123456
