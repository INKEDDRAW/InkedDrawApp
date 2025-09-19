### **Phase 1: Foundation & Configuration (Steps 1-5)**

*This phase remains the same as it establishes the project's bedrock.*

* \[ \] **Step 1:** Initialize Frontend & Backend Projects  
* \[ \] **Step 2:** Install Core Dependencies  
* \[ \] **Step 3:** Configure TailwindCSS with Design System  
* \[ \] **Step 4:** Define Full Prisma Schema  
* \[ \] **Step 5:** Run Initial Migration & Setup Prisma Client

---

### **Phase 2: Core Services & Automation (Steps 6-9)**

*This phase focuses on getting the essential backend services and automation pipelines running early.*

* \[ \] **Step 6: Implement Authentication & User Profiles**  
  * **Task:** Build the complete authentication flow, including the NestJS Auth module, Supabase integration, and the User/Profile CRUD services.  
  * **Files:** `backend/src/auth/**`, `backend/src/users/**`, `frontend/app/auth.tsx`  
  * **Step Dependencies:** Step 5  
* \[ \] **Step 7: Setup CI/CD Pipeline**  
  * **Task:** Create the initial GitHub Actions workflow for CI/CD. The workflow should install dependencies, run linting, execute tests, and (for now) have a placeholder for deployment.  
  * **Files:** `.github/workflows/ci.yml`  
  * **Step Dependencies:** Step 1  
  * **User Instructions:** This ensures every new piece of code is automatically validated, which is a core FAANG-level practice.  
* \[ \] **Step 8: Implement Age Verification Flow**  
  * **Task:** Integrate the chosen third-party age verification SDK on the frontend. Build the NestJS endpoint to receive and validate the verification token from the service provider.  
  * **Files:** `frontend/components/features/onboarding/AgeVerification.tsx`, `backend/src/users/users.controller.ts`  
  * **Step Dependencies:** Step 6  
* \[ \] **Step 9: Implement Analytics & Event Tracking**  
  * **Task:** Initialize the PostHog SDK on the frontend and backend. Implement tracking for key initial events like `user_signed_up`, `age_verification_success`, and `age_verification_failed`.  
  * **Files:** `frontend/services/analytics.ts`, `backend/src/shared/analytics.service.ts`  
  * **Step Dependencies:** Step 6

---

### **Phase 3: Core Frontend & Offline-First Setup (Steps 10-13)**

*This phase builds the app's visual shell and the complex offline database foundation.*

* \[ \] **Step 10: Build Main App Layout & Reusable UI Kit**  
  * **Task:** Create the primary tab bar navigation and the core, reusable UI components (Button, Card, Input) in Storybook.  
  * **Files:** `frontend/app/(tabs)/_layout.tsx`, `frontend/components/ui/**`, `.storybook/**`  
  * **Step Dependencies:** Step 3  
* \[ \] **Step 11: Set Up WatermelonDB & Offline Models**  
  * **Task:** Define the client-side database schema, models, and migrations for WatermelonDB. This will mirror our collection tables in Prisma.  
  * **Files:** `frontend/db/schema.ts`, `frontend/db/models/**`  
  * **Step Dependencies:** Step 4  
* \[ \] **Step 12: Implement Offline Collection Viewing & Creation**  
  * **Task:** Build the UI for the "My Collection" screen and the "Add Item" form. All interactions (reading, creating, updating) must work directly with the local WatermelonDB.  
  * **Files:** `frontend/app/(tabs)/collection.tsx`, `frontend/app/(modal)/add-item.tsx`  
  * **Step Dependencies:** Step 11  
* \[ \] **Step 13: Build Backend Sync Engine & Frontend Sync Service**  
  * **Task:** Build the `/sync/push` and `/sync/pull` endpoints in NestJS. Then, build the frontend `sync.ts` service that calls these endpoints and handles data merging and conflict resolution.  
  * **Files:** `backend/src/collections/sync.controller.ts`, `frontend/services/sync.ts`  
  * **Step Dependencies:** Step 12

---

### **Phase 4: Feature Slices & Production Readiness (Steps 14-18)**

*With the foundation laid, we can now rapidly build and integrate our remaining features.*

* \[ \] **Step 14: Build Backend for Social Feed**  
  * **Task:** Create the NestJS module for creating and fetching posts and comments. This includes the controllers, services, and integration with Supabase Realtime for broadcasting events.  
  * **Files:** `backend/src/social/social.module.ts`, `backend/src/social/posts.controller.ts`, `backend/src/social/comments.controller.ts`  
  * **Step Dependencies:** Step 6  
* \[ \] **Step 15: Build Frontend for Social Feed**  
  * **Task:** Build the UI for the social feed, including rendering posts and comments. The component will fetch initial data via API and listen to the Supabase Realtime channel for live updates.  
  * **Files:** `frontend/app/(tabs)/feed.tsx`, `frontend/components/features/feed/PostCard.tsx`  
  * **Step Dependencies:** Step 14  
* \[ \] **Step 16: Build Backend Background Jobs**  
  * **Task:** Set up and implement the BullMQ background job queues for the two key backend processes: **Third-Party Data Ingestion** and **AI Content Moderation** (image analysis).  
  * **Files:** `backend/src/ingestion/ingestion.module.ts`, `backend/src/moderation/moderation.module.ts`  
  * **Step Dependencies:** Step 5  
* \[ \] **Step 17: Implement AI Recommendation Engine**  
  * **Task:** Create the NestJS service that uses `pgvector` to find similar items based on content attributes. Build the `GET /recommendations` endpoint.  
  * **Files:** `backend/src/recommendations/recommendations.module.ts`, `backend/src/recommendations/recommendations.service.ts`  
  * **Step Dependencies:** Step 5, Step 16 (relies on ingested data)  
* \[ \] **Step 18: Finalize Deployment & Security**  
  * **Task:** Create the production Dockerfile for the backend. Configure AWS App Runner and connect it to the GitHub Actions workflow for automated deployments. Implement API rate limiting.  
  * **Files:** `backend/Dockerfile`, `.github/workflows/ci.yml` (update), `backend/src/shared/rate-limiter.guard.ts`  
  * **Step Dependencies:** Step 7

