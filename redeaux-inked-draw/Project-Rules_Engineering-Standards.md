## **Project Rules & Engineering Standards**

### **1\. Code Quality & Consistency**

* **TypeScript Strict Mode:** The entire codebase, both frontend and backend, will be developed with TypeScript's `strict` mode enabled to catch potential errors at compile time.  
* **Code Formatting:** We will use **ESLint** for code quality rules and **Prettier** for automated code formatting. A pre-commit hook will be set up to ensure all code is formatted and linted before it is committed.  
* **Absolute Imports:** We will configure path aliases (e.g., `@/components`, `@/services`) in both the frontend and backend projects to avoid messy relative imports (`../../...`).

### **2\. Frontend (React Native / Expo)**

* **Component Structure:** Components will be organized by feature. Reusable, generic UI components (like Button, Card) will live in a `components/ui` directory, while feature-specific components (like `FeedPost`) will live in `components/features/feed`.  
* **Component Documentation:** We will use **Storybook** to create a living design system. Every reusable component in the `components/ui` directory must be documented in Storybook with examples of its different states (default, hover, disabled, etc.).  
* **Styling:** A centralized theme file will contain all design tokens (colors, spacing, fonts from our Style Guide). Components will import from this theme rather than using hardcoded values.  
* **State Management:** Global UI state (e.g., sidebar status, current theme) will be managed with **Zustand**. Server state, caching, and mutations will be handled exclusively by **TanStack Query**.

### **3\. Backend (NestJS)**

* **Modular Architecture:** The backend will strictly follow the modular pattern defined in the technical specification. Each feature domain (e.g., `users`, `posts`, `collections`) will be its own self-contained module.  
* **API Versioning:** All API endpoints will be versioned from day one. Our routes will be prefixed with `/api/v1/...` to ensure we can introduce future breaking changes without disrupting existing users.  
* **Standardized Error Handling:** We will implement a global exception filter to catch all errors and format them into a consistent JSON response. Every error logged will be assigned a unique, traceable ID that can be shown to the user for efficient support.  
* **Data Transfer Objects (DTOs):** All API route handlers will use class-based DTOs with `class-validator` decorators for incoming request body validation.  
* **Repository Pattern:** Data access will be abstracted using the repository pattern. Services will not interact with the Prisma client directly but will instead call methods on a repository (e.g., `UserRepository`).

### **4\. Quality Assurance & Testing**

* **Mandatory Testing:** Every new feature must be accompanied by unit tests for its business logic (backend services, frontend utility functions).  
* **Code Coverage:** We will enforce a project-wide **minimum of 80% test coverage** for all critical modules. This will be automatically checked in our CI/CD pipeline, and pull requests that lower the coverage below this threshold will be blocked.

