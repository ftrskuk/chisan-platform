# Coding Standards

Coding guidelines for consistent code quality and collaboration efficiency in the CHISAN Platform project. All contributors must adhere to these rules.

---

## 1. TypeScript Rules

### 1.1 Strict Mode Compliance

The `strict: true` option in `tsconfig.json` is mandatory. Do not bypass type checking.

### 1.2 No `any`

- The use of `any` type is forbidden in principle.
- If the type is unknown, use `unknown` and narrow down the type using Type Guards.

### 1.3 Type Definition Location

- Types used only in specific components or functions: Define inside the file
- Types shared in multiple places: Define in `packages/shared` or `types.ts` of the module
- API request/response schema: Define as Zod schema in `packages/shared`

---

## 2. Naming Conventions

### 2.1 Files and Directories

- **Filename**: `kebab-case.ts` (e.g., `user-profile.tsx`, `auth-service.ts`)
- **Directory**: `kebab-case`

### 2.2 Identifiers in Code

- **Component (React)**: `PascalCase` (e.g., `DashboardHeader`)
- **Function/Variable**: `camelCase` (e.g., `getUserData`, `isLoaded`)
- **Interface/Type**: `PascalCase` (e.g., `UserRecord`, `TableProps`)
- **Constant**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`)
- **DB Table/Column**: `snake_case` (e.g., `user_profiles`, `created_at`)

---

## 3. NestJS Backend Rules

### 3.1 Module Structure

Separate modules by function, and each module has the following folder structure.

```text
src/modules/user/
├── user.module.ts
├── user.controller.ts
├── user.service.ts
├── user.repository.ts
├── dto/             # Request/Response object definitions
└── entities/        # DB entity definitions (TypeORM or Prisma)
```

### 3.2 Controller, Service, Repository Pattern

- **Controller**: Handle HTTP requests and validate inputs (utilize Zod Pipe)
- **Service**: Perform business logic. Call other services or repositories
- **Repository**: Handle direct database access logic

### 3.3 DTO Validation (Zod)

Validate request data using Zod schemas defined in `packages/shared`.

```typescript
// backend code example
@Post()
@UsePipes(new ZodValidationPipe(createUserSchema))
async create(@Body() createUserDto: CreateUserDto) {
  return this.userService.create(createUserDto);
}
```

---

## 4. Next.js Frontend Rules

### 4.1 Server vs Client Components

- **Basic Strategy**: All components are written as **Server Components** first.
- **Criteria for using Client Component**:
  - When using hooks like `useState`, `useEffect`, `useContext`
  - When registering event listeners (onClick, onChange, etc.)
  - When using browser APIs (window, localStorage, etc.)
  - Explicitly state `'use client'` directive at the top of the file.

### 4.2 API Call Pattern

- Server Component: Use `fetch` directly to get data (utilize Next.js caching).
- Client Component: Use `React Query` (TanStack Query) to handle state management and caching.

---

## 5. Component Authoring Rules

### 5.1 Props Interface Definition

Explicitly define types for Props of all components.

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  isLoading,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn("btn", variant)} {...props}>
      {isLoading ? <Spinner /> : children}
    </button>
  );
}
```

### 5.2 Tailwind CSS Class Order

Place classes in the following order for readability. (Prettier plugin recommended)

1. Layout (position, z-index, display, flex, grid)
2. Box Model (width, height, margin, padding)
3. Typography (font, text-align, color)
4. Visual (background, border, shadow)
5. Misc (cursor, transition, hover/focus states)

---

## 6. Git Rules

### 6.1 Branch Strategy

- `main`: Always deployable stable branch
- `develop`: Development centered branch
- `feature/feature-name`: New feature development
- `bugfix/bug-name`: Bug fix
- `hotfix/urgent-fix`: Urgent fix for production environment

### 6.2 Commit Message Format (Conventional Commits)

Format: `<type>(<scope>): <subject>`

- `feat`: Add new feature
- `fix`: Fix bug
- `docs`: Update documentation
- `style`: Code formatting, missing semicolon, etc. (no code change)
- `refactor`: Code refactoring
- `test`: Add/Update tests
- `chore`: Modify build tasks, package manager settings, etc.

Example: `feat(api): Implement stock-in instruction creation API`

---

## 7. Testing Rules

### 7.1 Unit Test

- Test pure functions or small component units.
- File location: Create as `filename.spec.ts` or `filename.test.tsx` in the same location as the file to test.
- Tool: Vitest

### 7.2 Integration Test

- Test cooperation between modules. (e.g., Controller -> Service -> DB)
- Configure within `apps/api/test` or `apps/web/test` folders.

---

## 8. Code Review Checklist

Must verify the following items before PR approval.

- [ ] No `any` in TypeScript type definitions?
- [ ] Is business logic properly separated in the Service layer?
- [ ] Is error handling done properly? (Try-Catch, Error Boundary, etc.)
- [ ] Is test code written for new features?
- [ ] No sensitive info (API Key, etc.) included in the code?
- [ ] Are Accessibility (A11y) standards met? (aria-label, etc.)
- [ ] Are unnecessary console logs removed?
