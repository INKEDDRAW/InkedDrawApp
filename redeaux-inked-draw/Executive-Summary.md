## **Elevator Pitch**

Inked Draw is a premium, unified social community for connoisseurs of cigars, craft beer, and fine wine. Think of it as a sophisticated digital salon that blends the deep discovery of Vivino and the dedicated tracking of Untappd into a single, elegant platform, enabling enthusiasts to manage their collections, share experiences, and discover intelligent pairings.

## **Problem Statement**

Serious enthusiasts of cigars, craft beer, and fine wine currently lack a single, sophisticated platform to meticulously manage their diverse collections. They are forced to use fragmented, category-specific apps that often cater to a mass-market audience, failing to provide the depth, premium feel, and intelligent cross-category pairing insights that true connoisseurs demand. This results in a disjointed and subpar experience for tracking and expanding their passions.

## **Target Audience**

* **Primary:** Discerning adult enthusiasts, collectors, and aficionados who appreciate quality, seek deeper knowledge, and require nuanced tracking for their collections across cigars, craft beer, and fine wine.  
* **Secondary:** Knowledgeable users who wish to connect and engage in informed discussions with a mature, like-minded peer group, moving beyond casual, crowd-sourced reviews.  
* **Tertiary:** Industry professionals (sommeliers, blenders, cicerones) looking to engage with a dedicated and educated consumer base.

## **USP (Unique Selling Proposition)**

Unlike single-focus apps, Inked Draw provides a unified, connoisseur-centric platform with a meticulously crafted, premium UI. Its core differentiators are advanced, multi-category collection management (virtual humidor, cellar, and log), an emphasis on high-quality, expert-informed content, and a foundational AI engine designed for intelligent, cross-category pairing recommendations that guide enthusiasts in their discovery journey.

## **Target Platforms**

* Mobile Application (iOS & Android via React Native)

## **Features List**

### **Authentication & User Onboarding**

* \[ \] As a new user, I want to register using my email and password or a social provider (Google/Apple) so I can create an account seamlessly.  
* \[ \] As a new user, I must complete a robust, multi-step age verification process to ensure legal compliance and access the platform.  
* \[ \] As a new user, I want to provide my initial taste preferences for cigars, beer, and wine, so the app can provide tailored recommendations from the start.  
* \[ \] As a registered user, I want to create and edit a detailed profile with my username, bio, and avatar, so I can represent my persona to the community.

### **Collection Management (Compendium)**

* \[ \] As a collector, I want to add a cigar to my virtual humidor with detailed fields including brand, vitola, wrapper/binder/filler, origin, purchase details, quantity, and a 1-100 rating.  
* \[ \] As a collector, I want to add a beer to my log with detailed fields including brewery, style, ABV, IBU, packaging, purchase details, quantity, and a personal rating.  
* \[ \] As a collector, I want to add a wine to my virtual cellar with detailed fields including winery, varietal, region, vintage, purchase details, quantity, and a personal rating.  
* \[ \] As a user, I want to add detailed, structured tasting notes and upload high-resolution images for every item in my collection.  
* \[ \] As a user, I want to view my entire collection in organized lists for each category, with the ability to edit or delete any item.

### **Social & Community (Salon)**

* \[ \] As a user, I want to scroll through a dynamic home feed that displays rich posts (text, images) from other connoisseurs I follow.  
* \[ \] As a user, I want to create my own posts, including formatted text, images, and the ability to tag specific items from my collection.  
* \[ \] As a user, I want to interact with posts by "Appreciating" (liking) them, "Discussing" (commenting) with threaded replies, and sharing them.

### **Discovery & Recommendations**

* \[ \] As a user, I want to perform a basic search to find specific cigars, beers, or wines in the app's database.  
* \[ \] As a user, I want to view a detailed product page for any item, aggregating community ratings and manufacturer information.  
* \[ \] As a user, I want to receive simple "you might also like" recommendations within a single category, based on items I have rated highly in my collection.

## **UX/UI Considerations**

* **Onboarding Flow:**  
  * A multi-screen process that feels premium and secure, not tedious.  
  * Age verification should be presented as a necessary step for an exclusive community.  
  * Preference selection should be visual and engaging, using iconography and clear terminology.  
* **Collection Management Screens:**  
  * The "add item" forms must be intelligently structured to handle a large number of fields without overwhelming the user, possibly using collapsible sections or a stepped flow.  
  * The list view for each collection should be clean, high-contrast, and elegant, prioritizing the user's uploaded image and key details (Name, Brand, Rating).  
  * Visual cues should clearly distinguish between the Humidor, Cellar, and Log.  
* **Social Feed:**  
  * The feed must prioritize high-quality imagery. The layout should feel more like a premium magazine than a cluttered social app.  
  * Typography will be critical to ensure readability and a sophisticated tone.  
  * Interaction icons ("Appreciate," "Discuss") should be custom and subtle, reinforcing the platform's unique identity.  
* **Item Detail Page:**  
  * A clear visual hierarchy should present the most important information first: Item Name, Brand/Winery/Brewery, Average Rating, and the user's own rating/notes.  
  * Community tasting notes and reviews should be presented cleanly, perhaps with data visualizations for common flavor profiles.

## **Non-Functional Requirements**

* **Performance:** The application must feel high-performance. Feed scrolling must be smooth, and data entry/retrieval must be near-instantaneous to align with the premium user experience.  
* **Scalability:** The backend architecture (NestJS on AWS App Runner) and database (Supabase) must be designed to handle significant growth in users, collection items, and social interactions without degradation in performance.  
* **Security:** Age verification must be robust and legally compliant. All user data, especially personal information and collection details, must be securely stored and transmitted.  
* **Data Integrity:** The database schema must be meticulously designed to ensure the accuracy and consistency of valuable user collection data.

## **Critical Questions & Clarifications**

This is a strong starting point. Before we move to architecture, let's clarify these key points you brought up, as they will directly impact the technical design:

1. **User Scale:** What are the anticipated user numbers for the first 6-12 months? This will determine the initial provisioning for AWS App Runner and Supabase and our strategy for scaling.  
2. **MVP AI Specificity:** For the MVP recommendations, is a simple "users who liked X also liked Y" sufficient, or do we need to filter based on item attributes (e.g., cigar wrapper, beer style)? The latter is more complex but provides better results.  
3. **Custom Fields:** Will users be allowed to define their own custom fields for collection items, or will a rich, predefined set of fields be sufficient for the MVP?  
4. **Real-Time Needs:** Are real-time feed updates or notifications a requirement for the MVP? This will dictate whether we need to architect for WebSockets from day one.  
5. **Product Database:** Will all product data be user-entered for the MVP, or do we need to budget time for integrating a third-party product database to pre-populate item details?  
6. **Content Moderation:** What is the day-one strategy for content moderation? Is user-reporting sufficient, or is a more proactive system needed?  
7. **Offline Access:** Is offline access to personal collections a requirement for the MVP? This would require implementing local data storage and a sync strategy in React Native.

**User Scale:** I recommend we architect to comfortably handle **50,000 active users** within the first year. This provides a robust foundation for growth without incurring excessive initial costs. The chosen stack (AWS App Runner and Supabase) scales efficiently beyond this.  
**Real-time & Offline-First:** Your requirements for real-time updates and offline collection access are key architectural pillars. We will build an "offline-first" mobile app using a local database that syncs with the backend. Real-time feed interactions will be powered by Supabase's Realtime subscriptions.  
**Increased MVP Complexity:** Your choices for content-based AI recommendations, proactive moderation, and third-party data integration add significant value but also complexity. We will architect for these from day one, likely involving dedicated microservices or serverless functions to handle these specialized tasks.  
