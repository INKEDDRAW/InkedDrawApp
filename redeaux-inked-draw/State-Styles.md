## **State & Style**

### **Part 1: Inked Draw Style Guide**

This guide establishes the foundational visual and interactive language for the Inked Draw application, inspired by your provided reference.

#### **Color Palette**

The palette is dark, warm, and sophisticated, designed to feel like a private lounge or cellar.

* **Primary Colors**  
  * `Onyx` \- `#121212` (The primary background. A deep, near-black for immersive focus.)  
  * `Charcoal` \- `#1E1E1E` (The primary surface color for cards, modals, and elevated panels.)  
  * `Alabaster` \- `#EAEAEA` (The primary text color for high contrast and readability.)  
* **Accent Colors**  
  * `Gold Leaf` \- `#C4A464` (The primary brand accent for key actions, buttons, and highlights. Warm, muted, and elegant.)  
  * `Gold Leaf (Light)` \- `#D4B880` (Used for hover states on gold elements.)  
* **Functional Colors**  
  * `Success Green` \- `#3A8E5A` (For confirmations, successful saves, and positive feedback.)  
  * `Error Red` \- `#C75450` (For errors, destructive actions, and validation failures.)  
  * `Warning Amber` \- `#D9A05B` (For non-critical warnings and alerts, such as sync conflicts.)  
* **Neutral Colors (Grayscale)**  
  * `Neutral-700` \- `#333333` (For borders, dividers, and disabled states.)  
  * `Neutral-500` \- `#888888` (For secondary text, placeholders, and metadata.)

---

#### **Typography**

The typography pairs a classic, readable serif for headings with a clean, modern sans-serif for UI text.

* **Font Family**  
  * **Heading Font:** `Lora` (A well-balanced serif with a classic feel for major titles and headings.)  
  * **Body Font:** `Inter` (A highly legible sans-serif for all UI text, from body copy to labels.)  
* **Text Styles**  
  * **H1 (Screen Title):** 28px/36px, `Lora` Regular, `Alabaster`  
  * **H2 (Section Header):** 22px/28px, `Lora` Regular, `Alabaster`  
  * **H3 (Card Title):** 18px/24px, `Inter` Semibold, `Alabaster`  
  * **Body:** 16px/24px, `Inter` Regular, `Alabaster`  
  * **Body (Secondary):** 14px/20px, `Inter` Regular, `Neutral-500`  
  * **Button Text:** 16px/20px, `Inter` Medium, `Onyx` (on gold buttons)  
  * **Label/Caption:** 12px/16px, `Inter` Regular, `Neutral-500`, All-Caps, Letter spacing 0.5px

---

#### **Component Styling & Spacing**

* **Buttons**  
  * **Primary Button:** Background `Gold Leaf`, Text `Onyx`, Height 50px, Corner Radius 8px. Hover: Background `Gold Leaf (Light)`, subtle scale transform (1.02). Active: Scale transform (0.98).  
  * **Secondary Button:** Transparent background, 1px Border `Neutral-700`, Text `Alabaster`. Hover: Background `Neutral-700`.  
* **Cards**  
  * Background `Charcoal`, No Border, Corner Radius 12px, Padding 16px.  
* **Input Fields**  
  * Transparent background, 1px bottom border in `Neutral-700`. Label styled as `Label/Caption` positioned above the input. Focus State: Bottom border animates to 2px and changes color to `Gold Leaf`.  
* **Spacing System:** An 8px grid system (`8px`, `16px`, `24px`, `32px`, `40px`).  
* **Motion & Animation:**  
  * **Standard Transition:** 300ms, ease-in-out curve for state changes.  
  * **Screen Transitions:** A subtle, cross-fade animation (250ms).  
  * **Modal Transitions:** Modals will animate up from the bottom of the screen with a gentle spring physics curve.

---

### **Part 2: Inked Draw State Brief**

This brief details the state-by-state user journey for key features, incorporating the Style Guide.

#### **Authentication & User Onboarding**

* **Registration Screen:** A minimal, full-screen view on the `Onyx` background with the app logo and primary `Gold Leaf` buttons for OAuth. A loading state will disable the button and show a circular spinner inside.  
* **Age Verification Modal:** A modal with a `Charcoal` background slides up. The processing state features a custom, branded animation. The success state transitions the animation into a `Success Green` checkmark before automatically dismissing.  
* **Preference Selector Screen:** A full-screen, interactive experience with a `Lora` heading. Users tap on beautifully designed cards to make selections, which confirm with a haptic buzz and a `Gold Leaf` border animation.

---

#### **Collection Management**

* **My Collection Screen**  
  * **Empty State:** Displays an elegant empty state with a `Lora` heading ("Your Compendium Awaits") and a primary `Gold Leaf` "Add Your First Item" button.  
  * **Loading State:** A skeleton loader mimics the card layout with shimmering `Neutral-700` shapes.  
  * **Ideal State:** A list of items on `Charcoal` `Card` components is displayed.  
  * **Detailed Sync States:** A cloud icon in the header communicates the connection status:  
    * **Offline:** The icon is static with a "Offline" badge. A banner states, "You are offline. Changes will be synced when you reconnect."  
    * **Syncing:** The icon has a subtle, slow-pulsing animation.  
    * **Synced:** The icon flashes `Success Green` for a moment after a sync completes.  
    * **Sync Conflict:** The icon turns `Warning Amber` with a notification dot, prompting the user to resolve a data conflict.  
* **Add Item Screen**  
  * **Initial & Expanded State:** The form uses progressive disclosure, with an "Add More Details" button that smoothly animates the opening of more granular fields.  
  * **Saving State:** On submit, the `Gold Leaf` button shows an internal spinner. On success, a `Success Green` toast notification slides in from the top, and the user is navigated back to their collection where the new item animates into place.

---

#### **Social Feed (The Salon)**

* **Ideal State:** The feed uses an editorial layout with generous whitespace, prioritizing high-resolution imagery and elegant `Lora` and `Inter` typography.  
* **Optimistic Post State:** A user's new post appears instantly in the feed in a slightly faded state with a "Posting..." indicator. If it fails, this element changes to a "Failed to post" state with a prominent "Retry" button.  
* **New Content Indicator:** A small, non-intrusive `Gold Leaf` pill button fades in at the top of the feed, reading "Show New Posts." Tapping it smoothly scrolls to the top and animates new items into the list.  
* **End of Feed State:** When the user scrolls to the bottom, a clean, centered message appears: "You're All Caught Up."

---

#### **Search & Discovery**

* **Pristine State:** Before any text is entered, the search screen displays "Recent Searches" and "Trending Topics" to encourage exploration.  
* **No Results State:** If a search returns no results, the screen displays a helpful message, suggests a corrected spelling (e.g., "Did you mean 'Cigar'?"), and offers quick taps for related categories.  
* **Partial Offline State:** If offline, the UI clearly states, "Showing offline results. Reconnect to search our full database," and only searches against locally cached data.

---

#### **General App States**

* **Permission Priming & Denied States:** Before a native OS permission request (e.g., Notifications), a beautifully styled screen will explain the value of the permission. If denied, the relevant feature will show a graceful state explaining the limitation and offering a button to go to the phone's settings.  
* **Global Error State:** A critical, full-screen error (e.g., no server connection) will be a user-friendly screen, not a technical error code. It will feature a branded illustration, a clear explanation ("Could not connect to Inked Draw"), and a `Gold Leaf` "Retry" button.

## **FAANG-Level UX Principles (Addendum)**

### **1\. Strict Performance Budgets**

We will enforce a strict performance budget. Key interactions, like tapping a button or opening a new screen, must provide feedback in **under 100ms**. App launch time from a cold start will be targeted for **under 1.5 seconds**. We will actively monitor these metrics throughout development.

---

### **2\. Adherence to Native Platform Conventions**

While Inked Draw will have its own strong brand identity, we will respect the native Human Interface Guidelines (Apple) and Material Design (Google) for core components like navigation gestures, alert dialogs, and share sheets. This ensures the app feels intuitive and familiar to users on their respective devices.

---

### **3\. Comprehensive Accessibility Support**

Beyond general compliance, we will explicitly design for:

* **Dynamic Type:** All text in the app must scale correctly according to the user's OS-level font size settings.  
* **High-Contrast Mode:** The UI will be tested to ensure all content is legible and all components are distinct when the OS high-contrast mode is enabled.

### **Interaction & Feedback Loop**

Our current plan covers visual feedback well (spinners, toasts), but a premium mobile experience is also **tactile**.

* **Haptic Feedback:** We should specify that key interactions will provide subtle haptic feedback. A gentle "tap" vibration when a user "Appreciates" a post, successfully adds an item, or switches main tabs makes the digital interface feel more physical and responsive. This is a small detail that has a massive impact on perceived quality.

---

### **Information Architecture & Navigation**

The plan implies a structure, but we haven't formally defined the app's primary navigation. This is fundamental to the user's orientation.

* **Primary Tab Bar Navigation:** We must define the 4-5 persistent icons at the bottom of the screen. I recommend the following core tabs to provide the most logical and efficient user journey:  
  1. **Feed:** The main social and discovery hub.  
  2. **Discover:** A dedicated space for search and AI-driven recommendations.  
  3. **Add Item (+):** A central, prominent button for the app's most critical action: adding to a collection.  
  4. **My Collection:** The user's personal humidor, cellar, and log.  
  5. **Profile:** Access to the user's profile, settings, and stats.

---

### **Accessibility & Inclusivity**

While we've noted WCAG compliance, we need to explicitly design for accessibility states to ensure the app is usable by everyone.

* **Focus States:** Every single interactive element—buttons, tabs, form fields, links—must have a clearly defined **focus state** (e.g., a `Gold Leaf` outer ring or glow). This is distinct from a hover state and is crucial for users who navigate with a keyboard or accessibility switches.  
* **Screen Reader Labels:** All icons and visual elements that convey meaning or action must have descriptive `accessibilityLabel` attributes. A screen reader should announce a heart icon as "Appreciate post," not just "icon."

---

### **First-Time User Experience (FTUE)**

We need to guide the user's first few minutes in the app to ensure they understand its value and how to use it.

* **Contextual Onboarding (Coach Marks):** For the user's first session, we'll implement "coach marks." These are temporary, dismissible tooltips that highlight a key UI element (e.g., the "+" button) with a brief explanation like, "Tap here to add your first item and start building your collection." This teaches the user by having them *do*, rather than showing them a generic video.  
* **Benefit-Oriented Empty States:** Our "empty state" messages should do more than state the obvious. Instead of just "You have no items," it should read, "Your collection is empty. **Add your first item to unlock personalized recommendations.**" This connects the required action to a direct user benefit.

