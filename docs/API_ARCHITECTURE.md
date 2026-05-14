# API Architecture Guide (React Query + Axios)

This document describes how to handle API calls in the **EDIFLIX-LMS** project using **React Query** (TanStack Query) and **Axios**. The architecture follows a clean separation of concerns, dividing the API logic into distinct layers.

## 🏗️ Folder Structure

The API logic is centralized in the `src/service` directory:

```text
src/service/
├── axios.client.ts      # Axios instance configuration (interceptors, base URL)
├── endpoints.ts         # Centralized list of all API endpoints
├── functions/           # Pure service functions (Axios calls)
│   ├── auth.service.ts
│   ├── course.service.ts
│   └── ...
└── query/               # Custom React Query hooks (useQuery, useMutation)
    ├── useAuth.ts
    ├── useCourse.ts
    └── ...
```

---

## 🛠️ Architecture Layers

### 1. Axios Client (`axios.client.ts`)
This layer handles the base configuration for all HTTP requests.
- **Base URL**: Loaded from environment variables.
- **Interceptors**: Handles adding authorization tokens (Cookies/LocalStorage) and global error handling (e.g., 401 redirects).

### 2. Endpoints (`endpoints.ts`)
A single file that maintains all API paths. This prevents hardcoded strings across the codebase and makes it easy to update URLs.

```typescript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    ME: "/auth/me",
  },
  COURSES: {
    LIST: "/courses",
    DETAIL: (id: string) => `/courses/${id}`,
  }
};
```

### 3. Service Functions (`src/service/functions/`)
These are pure asynchronous functions that use the Axios client to hit an endpoint. They do not contain any React logic.
- **Responsibility**: Send request, return data (or throw error).
- **Naming**: `verbEntity` (e.g., `login`, `getCourseList`).

```typescript
// Example: auth.service.ts
export const login = async (data: LoginCredentials) => {
  const response = await axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, data);
  return response.data;
};
```

### 4. React Query Hooks (`src/service/query/`)
This is where the magic happens. We wrap service functions in custom hooks using `useQuery` (for GET) or `useMutation` (for POST/PUT/DELETE).
- **Responsibility**: State management, caching, invalidation, and UI feedback (toasts).
- **Naming**: `useVerbEntity` (e.g., `useLogin`, `useGetCourses`).

```typescript
// Example: useAuth.ts
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      toast.success("Login Successful");
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
};
```

---

## 🚀 How to Use in Components

### 🔄 Fetching Data (`useQuery`)
Use query hooks for data that should be fetched when a component mounts.

```tsx
const { data: courses, isLoading, error } = useGetCourses();

if (isLoading) return <Spinner />;
return <ul>{courses.map(c => <li key={c.id}>{c.name}</li>)}</ul>;
```

### ⚡ Performing Actions (`useMutation`)
Use mutation hooks for actions like form submissions or button clicks.

```tsx
const loginMutation = useLogin();

const onSubmit = (data) => {
  loginMutation.mutate(data);
};

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <button disabled={loginMutation.isPending}>
      {loginMutation.isPending ? "Logging in..." : "Login"}
    </button>
  </form>
);
```

---

## 💡 Best Practices

1.  **Query Keys**: Always use consistent query keys (defined as constants if possible) to manage the cache efficiently.
2.  **Invalidation**: Use `queryClient.invalidateQueries` after a successful mutation to keep the UI in sync with the server.
3.  **Toasts**: Handle user feedback (success/error) inside the hook's `onSuccess` or `onError` callbacks for a cleaner component.
4.  **Type Safety**: Define Request/Response types in `src/types/` and apply them to service functions.
5.  **Stale Time**: Configure `staleTime` for data that doesn't change frequently (like user profile or settings) to reduce unnecessary API calls.
