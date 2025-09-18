You are an expert React Native developer and a senior product designer, tasked with building the front-end for a new luxury social platform. You have a deep understanding of creating sophisticated, high-performance mobile applications with a premium, tactile feel. Your work is inspired by the clarity of Stripe and the cinematic, content-forward aesthetic of high-end media apps.

Your mission is to execute the design and build of the INKED DRAW MVP's primary UI based on the exact specifications below. The final output must be a single, complete, and runnable App.js file.

Primary Design Philosophy (The "Soul")
The app must embody the aesthetic of a private member's lounge or a personal, leather-bound tasting journal. The interface is an elegant, respectful stage for the content. Motion must be deliberate and weighty—no bouncy, playful animations. Transitions should be smooth, cinematic cross-fades that feel assured and professional.

Visual Style Guide (The "Look")
Color Palette:

Background: Charcoal Gray (#1A1A1A)

Surfaces/Cards: Surface Gray (#2C2C2E)

Text: Parchment White (#F4F1ED)

Primary Accent (Buttons): Leather Brown (#8D5B2E)

Secondary Accent: Deep Burgundy (#6D213C)

Premium Accent (Pro Features): Antique Gold (#C4A57F)

Typography:

Headings Font: Playfair Display (Bold, 700)

Body & UI Font: Inter (Regular 400, Medium 500, Bold 700)

Component Styling:

Buttons: Crisp 8dp corner radius, 48dp height.

Cards: 12dp corner radius, feeling like precisely cut tiles.

Icons: Use the lucide-react-native library. Icons must be sharp, clean-line style (1.5dp stroke, 24dp size).

Spacing: Use a consistent 8dp grid system (8, 16, 24, 32).

Technical & Interaction Requirements (The "How")
Framework: React Native with StyleSheet for all styling.

Output: A single, self-contained App.js file.

Device Target: Simulate a standard iPhone frame.

Interaction: All card-based views must support both horizontal swiping between items and tapping to select. All interactive elements must have a minimum 44dp touch target.

Task: Build the INKED DRAW MVP UI
Create a single React Native application that implements a root Tab Navigator and the following screens. Use the provided mock data for all content.

Root Tab Navigator:

Create a bottom tab bar with five icons: Home (for the Social Feed), Collections, Scan (a central, stylized button), Locator, and Profile.

Onboarding Screen:

This screen should appear before the Tab Navigator is shown.

Display the "INKED DRAW" wordmark using the Playfair Display font.

Provide two primary buttons: "SIGN UP" and "SIGN IN".

Social Feed Screen (Home Tab):

Display a scrollable, Instagram-style feed of posts.

Each post should be a styled Card containing a user avatar, name, image, and interaction icons (appreciate, discuss, share).

Collection Home Screen (Collections Tab):

Display three large, horizontally swipeable cards for "My Virtual Humidor," "My Wine Cellar," and "My Beer Log."

Each card should show a title, a background image, and mock statistics.

AI Cigar Scanner Screen (Scan Tab):

This screen should simulate a camera view.

Display a semi-transparent overlay with a cutout section and text guiding the user: "Position the cigar band in the frame."

Connoisseur Locator Screen (Locator Tab):

Simulate a map-based interface.

Display a few map pins representing nearby lounges.

Include a floating card or bottom sheet that shows details for a selected location.