# **Inked Draw: Final Technical Specification**

## **1\. Executive Summary**

This document outlines the technical architecture and implementation plan for **Inked Draw**, a premium, offline-first mobile social community for connoisseurs of cigars, craft beer, and fine wine. The system is designed to provide a sophisticated user experience with a focus on detailed collection management, intelligent recommendations, and high-quality community interaction.

### **1.1 Key Technical Decisions**

* **Frontend:** **React Native with Expo** for cross-platform (iOS/Android) mobile development, enabling a consistent user experience on both major platforms from a single codebase.  
* **Backend:** **Node.js with the NestJS framework**, deployed as a containerized application. This provides a scalable, modular, and maintainable server-side architecture.  
* **Database:** **Supabase PostgreSQL** is chosen for its robust relational data capabilities, the `pgvector` extension for AI-powered recommendations, and integrated real-time features.  
* **Offline Strategy:** **WatermelonDB** will be implemented on the client-side to ensure a high-performance, offline-first experience, particularly for the user's personal collection management.  
* **Real-time:** **Supabase Realtime** will be used to power live social feed updates, comments, and notifications via WebSockets.  
* **Infrastructure:** **AWS App Runner** will provide scalable, managed container hosting for the backend, while Supabase will manage the entire data layer.  
* **Authentication:** **Supabase Auth** will handle secure user management, including email/password registration and OAuth social logins.

### **1.2 High-Level Architecture**

The system is designed as an offline-first, real-time mobile application with a containerized backend, ensuring a responsive user experience and a scalable infrastructure.

Code snippet  
graph TD  
    subgraph "Client Layer (Offline-First)"  
        ClientApp\[React Native Mobile App w/ Expo\];  
        LocalDB\[WatermelonDB / Local Storage\];  
        ClientApp \-- Syncs \--\> LocalDB;  
    end

    subgraph "API Layer (AWS App Runner)"  
        API\[NestJS Backend API\];  
    end

    subgraph "Data & Real-time Layer (Supabase)"  
        DB\[(PostgreSQL Database w/ pgvector)\];  
        Auth\[Supabase Auth\];  
        Store\[Supabase Storage\];  
        Realtime\[Supabase Realtime\];  
    end

    subgraph "Third-Party Services"  
        AgeVerify\[Age Verification API\];  
        ProductDBs\[3rd Party Product DBs\];  
        ModerationAI\[AI Moderation Service \<br/\> e.g., AWS Rekognition\];  
    end

    ClientApp \-- HTTP Requests \--\> API;  
    ClientApp \-- Real-time Subscriptions \--\> Realtime;  
    API \-- CRUD & Queries \--\> DB;  
    API \-- Auth Checks \--\> Auth;  
    API \-- File Ops \--\> Store;  
    API \-- Publishes Events \--\> Realtime;  
    API \-- External Calls \--\> AgeVerify & ProductDBs & ModerationAI;

---

## **2\. System Architecture**

### **2.1 Architecture Overview**

* **Client:** The React Native app is architected to be "offline-first." It interacts primarily with a local **WatermelonDB** database for all collection management (cigars, beer, wine), providing an instantaneous user experience regardless of network connectivity. A dedicated sync engine is responsible for communicating with the backend API to push and pull changes and intelligently handle data conflicts. For real-time social features like the feed and comments, the client subscribes directly to **Supabase Realtime** channels.  
* **Backend:** The **NestJS** application serves as the central API gateway and brain of the operation. It handles all business logic, data validation, authentication checks, and communication with the Supabase data layer and all external third-party services. It will be packaged as a **Docker** container and deployed on AWS App Runner for automated scaling and management.

### **2.2 Technology Stack**

* **Frontend:** React Native, Expo SDK, TypeScript, WatermelonDB, Zustand (for global UI state), TanStack Query (for server data).  
* **Backend:** Node.js, NestJS, TypeScript, Prisma (ORM), BullMQ (for background job processing), Docker.  
* **Database:** Supabase PostgreSQL, Supabase Storage, Supabase Realtime.  
* **Infrastructure:** AWS App Runner, GitHub Actions (for CI/CD).  
* **Third-Party Services:** A dedicated Age Verification Service (e.g., Veriff), various product data APIs for cigars/beer/wine, AWS Rekognition/Comprehend (for content moderation).

---

## **3\. Feature Specifications**

### **3.1 User Onboarding**

* **User Stories:** As a new user, I want to register via social providers, complete a robust age check, and set my taste preferences to personalize my experience.  
* **Implementation:** The client will use Supabase Auth UI components for a seamless sign-up flow. Upon successful registration, the client will be navigated to an age verification flow that uses a third-party SDK. The verified status and user preferences will be sent to the backend to create their profile.  
* **API Endpoint:** `POST /users/onboard` \- Accepts age verification proof and initial taste preferences.  
* **Data Models:** `User`, `Profile`.

### **3.2 Collection Management (Offline-First)**

* **User Stories:** As a user, I want to manage my collection offline and have it sync automatically, and be notified if there's a data conflict that needs my attention.  
* **Implementation:** All CRUD operations for collections will happen directly against the local WatermelonDB instance for maximum speed. A background sync service in the React Native app will be responsible for pushing local changes and pulling remote changes.  
* **Conflict Resolution:** A hybrid approach will be used. For non-destructive changes, the sync is automatic. If a direct conflict is detected (e.g., the *same* item's rating is changed on two offline devices), the `syncStatus` of the item will be set to `CONFLICT`. The UI will then prompt the user to resolve it via a dedicated screen where they can choose which version to keep, guaranteeing no data is ever silently lost.  
* **API Endpoints:**  
  * `POST /sync/push`  
  * `GET /sync/pull`  
* **Data Models:** `User`, `Cigar`, `Beer`, `Wine`, `UserCigar`, `UserBeer`, `UserWine`.

### **3.3 Social Salon (Real-Time)**

* **User Stories:** As a user, I want to create posts with tagged items and see comments appear in real-time without refreshing.  
* **Implementation:** The client will subscribe to a Supabase Realtime channel for a specific post. When a user submits a new comment via the NestJS API, the API saves it to PostgreSQL and then broadcasts a "new\_comment" event to the channel, which pushes the update to all connected clients.  
* **API Endpoints:** `GET /feed`, `POST /posts`, `POST /posts/:id/comment`.  
* **Data Models:** `Post`, `Comment`, `Like`.

### **3.4 Third-Party Data Ingestion**

* **User Stories:** As a user, when I search for a product to add to my collection, I want to find a single, accurate, and detailed entry.  
* **Implementation:** A **"Golden Record"** system will be implemented. A background job (using BullMQ) will periodically ingest data from external APIs into a staging area. A de-duplication algorithm will match items and assign a confidence score. High-confidence matches are auto-merged into the "golden" master product tables. Low-confidence matches are sent to a manual admin review queue.  
* **API Endpoints:** This is a backend process, but may include an internal API like `POST /admin/ingestion/resolve`.  
* **Data Models:** `Cigar`, `Beer`, `Wine`, `IngestionReviewItem`.

### **3.5 AI Recommendation Engine**

* **User Stories:** As a user, I want to receive sophisticated recommendations based on the actual attributes of the products I enjoy.  
* **Implementation:** The engine will use `pgvector` for content-based filtering. The algorithm will prioritize rich, structured data. It will **blend data sources**, giving more weight to detailed user-generated tasting notes and community data, especially if third-party API data for a given product is sparse.  
* **API Endpoints:** `GET /recommendations`  
* **Data Models:** `User`, `Profile`, `Cigar`, `Beer`, `Wine`, `UserCigar`, `UserBeer`, `UserWine`.

---

## **4\. Data Architecture**

### **4.1 Data Models (Prisma Schema)**

This schema represents the single source of truth for the database structure.

Code snippet  
// \--- Enums \---  
enum SyncStatus {  
  SYNCED  
  PENDING  
  CONFLICT  
}

enum ReviewStatus {  
  PENDING  
  RESOLVED  
  DISCARDED  
}

// \--- User & Profile \---  
model User {  
  id        String    @id @default(uuid())  
  authId    String    @unique // From Supabase Auth  
  email     String    @unique  
  createdAt DateTime  @default(now())  
  profile   Profile?  
    
  // Relations  
  userCigars UserCigar\[\]  
  userBeers  UserBeer\[\]  
  userWines  UserWine\[\]  
}

model Profile {  
  id        String   @id @default(uuid())  
  userId    String   @unique  
  user      User     @relation(fields: \[userId\], references: \[id\])  
  username  String   @unique  
  bio       String?  
  avatarUrl String?  
    
  // Relations  
  posts     Post\[\]  
  comments  Comment\[\]  
}

// \--- Master Product Data (from 3rd parties) \---  
model Cigar {  
  id          String   @id @default(uuid())  
  brand       String  
  line        String  
  vitola      String  
  origin      String?  
  // ... other rich details  
    
  // Relations  
  userCigars  UserCigar\[\]  
}

model Beer {  
  id        String   @id @default(uuid())  
  brewery   String  
  name      String  
  style     String?  
  abv       Float?  
  // ... other rich details  
    
  // Relations  
  userBeers UserBeer\[\]  
}

model Wine {  
  id        String   @id @default(uuid())  
  winery    String  
  name      String  
  varietal  String?  
  region    String?  
  vintage   Int?  
  // ... other rich details  
    
  // Relations  
  userWines UserWine\[\]  
}

// \--- User Collection Data (Join Tables) \---  
model UserCigar {  
  id           String     @id @default(uuid())  
  userId       String  
  cigarId      String  
  user         User       @relation(fields: \[userId\], references: \[id\])  
  cigar        Cigar      @relation(fields: \[cigarId\], references: \[id\])  
  rating       Int?       @db.SmallInt  
  notes        String?  
  purchaseDate DateTime?  
  syncStatus   SyncStatus @default(SYNCED)  
  updatedAt    DateTime   @updatedAt  
    
  @@unique(\[userId, cigarId\])  
}  
// ... similar models for UserBeer and UserWine

// \--- Social Data \---  
model Post {  
  id        String    @id @default(uuid())  
  authorId  String  
  author    Profile   @relation(fields: \[authorId\], references: \[id\])  
  content   String  
  createdAt DateTime  @default(now())  
    
  // Relations  
  comments  Comment\[\]  
}

model Comment {  
  id        String   @id @default(uuid())  
  authorId  String  
  postId    String  
  author    Profile  @relation(fields: \[authorId\], references: \[id\])  
  post      Post     @relation(fields: \[postId\], references: \[id\])  
  content   String  
  createdAt DateTime @default(now())  
}

// \--- Data Ingestion Admin Review \---  
model IngestionReviewItem {  
  id              String       @id @default(uuid())  
  sourceA\_data    Json  
  sourceB\_data    Json  
  confidenceScore Float  
  status          ReviewStatus @default(PENDING)  
  createdAt       DateTime     @default(now())  
}

### **4.2 Data Storage**

* **Primary Database:** Supabase PostgreSQL is the source of truth.  
* **Local Database:** WatermelonDB on the client for user collection tables.  
* **File Storage:** Supabase Storage for user avatars and post images.  
* **Backup:** Supabase provides automated daily backups and Point-in-Time Recovery.

---

## **5\. API & External Integrations**

### **5.1 Internal API (NestJS)**

The API is a RESTful service. All endpoints require a valid JWT from Supabase Auth, validated by a NestJS Guard.

* **Endpoint:** `POST /sync/push`  
  * **Auth:** Required.  
  * **Body DTO:** `{ "changes": { "created": [UserCigarDTO], "updated": [UserCigarDTO], "deleted": [{ id: string }] }, "lastSyncedAt": "timestamp" }`  
  * **Success Response:** `200 OK` `{ "success": true }`  
* **Endpoint:** `GET /sync/pull?lastSyncedAt=timestamp`  
  * **Auth:** Required.  
  * **Success Response:** `200 OK` `{ "changes": { "created": [...], "updated": [...] }, "timestamp": "newTimestamp" }`  
* **Endpoint:** `POST /posts`  
  * **Auth:** Required.  
  * **Body DTO:** `{ "content": string, "taggedItemType": "cigar" | "beer" | "wine", "taggedItemId": string }`  
  * **Success Response:** `201 Created` `{ Post }`

### **5.2 External Integrations**

* **Age Verification:** The client will integrate the chosen service's SDK. On success, a one-time token will be sent to our backend to be validated and stored.  
* **Product Databases:** A background job service (BullMQ) will run periodically to pull data from various APIs, process it through the "Golden Record" pipeline, and store it.  
* **AI Content Moderation:** When a user uploads an image, the backend will send it to AWS Rekognition. If flagged, its status is marked "under\_review" and hidden from public view.

---

## **6\. Security & Privacy**

* **Authentication:** All API requests will be protected by a NestJS Guard that validates the Supabase JWT sent in the `Authorization` header. This guard will run on all protected routes.  
* **Authorization:** Logic within our NestJS services will check if the authenticated user has permission to perform the requested action (e.g., ensuring `userId` from the JWT matches the owner of a collection item being edited).  
* **Data Security:** Data is encrypted at rest and in transit by default with Supabase and AWS. Sensitive third-party API keys will be stored securely using AWS Secrets Manager and accessed by the NestJS application at runtime.

---

## **7\. User Interface Specifications**

This section defines the complete visual and interactive language for the application.

### **7.1 Style Guide**

* **Color Palette:** The palette is dark, warm, and sophisticated.  
  * **Primary:** `Onyx` (\#121212) for backgrounds, `Charcoal` (\#1E1E1E) for surfaces, `Alabaster` (\#EAEAEA) for text.  
  * **Accent:** `Gold Leaf` (\#C4A464) for buttons and highlights.  
  * **Functional:** `Success Green` (\#3A8E5A), `Error Red` (\#C75450), `Warning Amber` (\#D9A05B).  
* **Typography:** Headings use the `Lora` font; all other UI text uses `Inter`. A full type scale (H1, H2, Body, etc.) provides a clear visual hierarchy.  
* **Components:** Buttons, cards, and inputs have defined styles, spacing, and corner radii to ensure consistency.  
* **Spacing & Animation:** A strict 8px grid system is used for spacing. Animations are subtle, physics-based, and use a 300ms ease-in-out curve.

### **7.2 State Brief**

* **Authentication & Onboarding:** The flow is designed to be minimal and secure, with custom branded animations for loading states and a highly interactive, visual preference selector.  
* **Collection Management:** The UI features elegant empty states with benefit-oriented copy. Loading states use shimmering skeleton loaders. A clear iconography system (cloud icon) communicates offline and sync status (synced, syncing, conflict).  
* **Social Feed:** The feed has an editorial layout with generous whitespace. New content animates in gracefully. User-submitted posts appear instantly in an "optimistic" pending state to provide immediate feedback.  
* **Search & General States:** The search screen shows recent and trending topics in its pristine state and provides helpful suggestions for "no results." App-wide states for permissions (priming and denied) and global errors are designed to be user-friendly and helpful.

---

## **8\. Infrastructure & Deployment**

* **Hosting:** The NestJS backend will be containerized with **Docker** and deployed to **AWS App Runner**. App Runner will be configured to auto-scale based on concurrent requests, ensuring performance under load.  
* **CI/CD:** A **GitHub Actions** workflow will be created for continuous integration and deployment. On every push to the `main` branch, the workflow will automatically run all tests, build the Docker image, push it to Amazon ECR, and trigger a new deployment on AWS App Runner.  
* **Client Deployment:** The React Native app will be built and submitted to the Apple App Store and Google Play Store via **Expo Application Services (EAS)**.

---

## **9\. Project Structure**

### **9.1 Backend (NestJS)**

/src  
  /auth          \# Auth guards, strategies  
  /users         \# User, Profile modules  
  /collections   \# Collection sync module  
  /products      \# Master product data module  
  /social        \# Feed, Post, Comment modules  
  /ingestion     \# Background jobs for 3rd party data  
  /shared        \# Shared utilities, DTOs  
  main.ts  
  app.module.ts

### **9.2 Frontend (React Native / Expo)**

/app             \# Expo router file-based routes  
  (tabs)         \# Main tab layout  
    \_layout.tsx  
    feed.tsx  
    discover.tsx  
    add.tsx  
    collection.tsx  
    profile.tsx  
  (modal)        \# Modal screens  
  auth.tsx       \# Auth flow screens  
/components      \# Reusable components  
/db              \# WatermelonDB schema and models  
/services        \# API clients, sync engine  
/store           \# Zustand stores  
