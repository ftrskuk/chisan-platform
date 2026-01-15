# Frontend Architecture

The frontend of CHISAN Platform is built using Next.js 15+ framework and utilizing the latest features of React 19.

## 1. App Router Structure

Based on Next.js App Router, aiming for functional unit layouts and data-centric page design.

```text
apps/web/app/
├── (auth)/             # Auth related groups (login, signup)
├── (dashboard)/        # Dashboard main layout group
│   ├── inventory/      # Inventory management module
│   ├── import/         # Import management module
│   ├── production/     # Production management module
│   └── layout.tsx      # Common layout including sidebar, header
├── api/                # Route Handlers (if needed)
└── layout.tsx          # Root layout (Provider, Global CSS)
```

## 2. Server vs Client Components Strategy

- **Server Components (Default)**: Priority use for data fetching, Search Engine Optimization (SEO), and initial rendering. Performs direct communication with Backend API.
- **Client Components**: Used only when user interaction (click, input), state management, or browser API usage is required. Explicitly state `'use client'` directive at the top of the file.

| Category   | Use Case                                                                                 |
| :--------- | :--------------------------------------------------------------------------------------- |
| **Server** | List query, detail page data load, static text rendering                                 |
| **Client** | Form submission, modal/popup control, dashboard chart interaction, state-based filtering |

## 3. State Management Approach

- **Server State**: Use `React Query` (or SWR) to manage server data caching, synchronization, and refresh.
- **Global UI State**: Global UI state (theme, sidebar toggle, etc.) is managed lightly using `Zustand`.
- **Local State**: Simple state inside components uses `useState`, `useReducer`.

## 4. API Integration Patterns

Use custom utility or SDK wrapping `fetch` API.

```typescript
// apps/web/lib/api-client.ts
export const apiClient = async <T>(
  path: string,
  options?: RequestInit,
): Promise<T> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error("API Error");
  return res.json();
};
```

## 5. UI Component Library

- **Core**: Use **Tailwind CSS v4** for utility-first styling.
- **Components**: Based on **shadcn/ui**, construct custom components with guaranteed Accessibility.
- **Icons**: Use `lucide-react` as standard icon library.

## 6. Form Handling

Combine `react-hook-form` and `Zod` to provide strong type safety and validation.

```typescript
// apps/web/components/inventory/stock-in-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateStockInSchema } from '@chisan/shared'; // Use Shared package

export function StockInForm() {
  const form = useForm({
    resolver: zodResolver(CreateStockInSchema),
  });

  const onSubmit = (data) => {
    // API Call
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* shadcn/ui components */}
    </form>
  );
}
```

## 7. Authentication Flow

1.  **Login**: User submits login form -> Call Supabase Auth SDK.
2.  **Session**: Maintain auth state through Session (Cookie) managed by Supabase.
3.  **Middleware**: Check session in `middleware.ts` to control access to protected routes (Dashboard, etc.).
4.  **Header**: Include session token in Authorization header when calling Backend API.

## 8. File Structure Conventions

- `components/`: Reusable UI components.
- `hooks/`: Custom React hooks.
- `lib/`: External library settings and utilities.
- `services/`: Domain-specific API call logic.
- `types/`: Frontend-specific type definitions.

## 9. Responsive Design & Theme

- **Mobile First**: All UI is designed with mobile environment as priority (Field worker response).
- **Dark Mode**: Support dark mode based on system settings or manual selection using `next-themes`.
- **CSS Variables**: Manage theme colors and design tokens utilizing new features of Tailwind v4.
