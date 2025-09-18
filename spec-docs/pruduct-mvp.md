Elevator Pitch
INKED DRAW is an exclusive social platform and digital ecosystem for connoisseurs of fine cigars, premium wine, and craft beer. It combines AI-powered collection management, a private club-style social network, and essential utilities like a cigar scanner and store locator into a single, sophisticated application that feels like a personal, leather-bound tasting journal.

Problem Statement
Today's connoisseurs are passionate, knowledgeable, and invest significantly in their collections, yet their digital tools are fragmented and unsophisticated. They struggle to quickly identify new cigars, find local premium retailers, and engage with peers on mass-market social media that lacks focus. There is no single, trusted digital "home" that matches the elegance and intelligence of their passion.

Target Audience
Our target is the modern, affluent enthusiast (aged 30-65+). They are collectors, not just consumers. They value quality, heritage, and the story behind a product. They own premium smartphones and expect a seamless, high-end user experience that reflects their taste and saves them time.

USP (Unique Selling Proposition)
INKED DRAW is the world's first platform to unify the worlds of fine cigars, wine, and craft beer into a single, AI-powered ecosystem. Our unique value comes from:

Instant Identification & Location: We are the only connoisseur app that combines a powerful, AI-driven cigar scanner with a built-in locator for premium lounges and shops.

Hyper-Personalized AI: Our "Digital Sommelier" provides advice based on the user's own collection, not generic recommendations.

An Exclusive Community: The entire experience is designed to feel like a private member's club, not a public forum.

Target Platforms
Primary: iOS and Android. The application will be built using React Native to provide a high-quality, native experience on both platforms from a single codebase.

Features List
Core Experience & Utilities
[ ] Onboarding & Authentication: As a new user, I want a simple, elegant sign-up and login process so I can quickly access the platform.

[ ] AI Cigar Scanner: As a cigar enthusiast, I want to scan a cigar's band or box with my camera so I can quickly identify it and see its details.

[ ] The scanner will be powered by the Google Vision AI API for high-accuracy image recognition.

[ ] After a successful scan, I should be able to add the identified cigar directly to my collection.

[ ] Connoisseur Locator: As a user, I want to find nearby cigar lounges, wineries, or craft beer shops so I can make a purchase or visit a location.

[ ] This data will be sourced from an in-house database, initially focused on domestic locations.

[ ] Collection Management: As a collector, I want to easily add, view, and manage items in my "Virtual Humidor," "Wine Cellar," and "Beer Log."

[ ] Social Feed: As a member, I want to view a curated feed of posts from fellow connoisseurs.

Premium & AI Features (Subscription Tiers)
[ ] Native In-App Subscriptions: As a user, I want to securely subscribe to a premium tier (Plus/Pro) using my phone's native payment system.

[ ] The system must use Apple's In-App Purchase on iOS and Google Play Billing on Android.

[ ] AI Digital Sommelier/Tobacconist: As a member, I want to ask a conversational AI natural language questions about my collection so I can get instant, personalized advice.

[ ] The AI must be knowledgeable across cigars, wine, and beer from its initial launch.

[ ] Item Detail & Sharing: As a member, I want to view rich details for any item in my collection and share it with my network via the native OS share sheet.

UX/UI Considerations
[ ] Design Philosophy: The interface will embody the aesthetic of a private member's lounge or a personal, leather-bound tasting journal. The inspiration from the CREME app is clear in its dark, content-forward approach. We will adopt its use of full-bleed cinematic imagery and a minimalist layout. However, we will evolve this foundation to be more timeless and sophisticated.

[ ] Color Palette: The UI will be built on a dark, rich foundation of Charcoal Gray (#1A1A1A) and Surface Gray (#2C2C2E). All text will use a warm Parchment White (#F4F1ED). Key actions will use Leather Brown (#8D5B2E), with Deep Burgundy (#6D213C) for secondary highlights. Premium "Pro" features will be accented with a tasteful Antique Gold (#C4A57F).

[ ] Typography: A sophisticated, editorial-style pairing is critical.

Headings: A classic, elegant serif (Playfair Display) will be used for major titles.

Body & UI: A clean, highly legible sans-serif (Inter) will be used for all other text.

[ ] Component Styling: The soft, pill-shaped buttons and cards of the CREME inspiration will be replaced with components that feel more tactile and precise.

Buttons: Will have a crisp corner radius (8dp).

Cards: Will have a larger corner radius (12dp) and feel like precisely cut tiles of slate or wood.

Icons: We will use a sharp, clean-line icon set like Lucide React to match our premium aesthetic.

[ ] Motion & Animation: Motion will be deliberate and weighty. Transitions will be smooth, cinematic cross-fades (400ms).

Non-Functional Requirements
[ ] Performance: The app must feel instantly responsive. The AI cigar scanner must provide a near-instantaneous identification result.

[ ] Scalability: The backend must be prepared for a high volume of users and data, especially image data for the Google Vision AI. The in-house database for locations will need a clear process for updates and expansion.

[ ] Security: All user data, especially location data, must be handled securely and with user consent.

[ ] Accessibility: The app must adhere to platform accessibility guidelines.

Monetization
The primary model is Freemium with tiered subscriptions, processed through native in-app purchases.

Free Tier: Core features, including a limited number of scans/searches per month.

Plus Tier: Unlimited scans and searches, unlocks the AI Digital Sommelier, advanced collection analytics.

Pro Tier: Unlocks the most exclusive features ("Salon Privé," etc.).