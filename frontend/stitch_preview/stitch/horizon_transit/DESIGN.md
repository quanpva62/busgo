# Design System Document: The Editorial Voyager

## 1. Overview & Creative North Star
This design system moves away from the utilitarian "box-and-grid" nature of traditional travel booking. Our Creative North Star is **"The Digital Concierge"**—a philosophy that blends high-end editorial aesthetics with the precision of modern engineering. 

The goal is to evoke trust through sophisticated restraint. Instead of a cluttered marketplace, we treat the booking experience like a curated travel journal. We break the template look through **Intentional Asymmetry**: using large `display` typography offset against wide-margin white space, and **Overlapping Geometry**, where search modules subtly bleed over hero imagery to create a sense of physical layering.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a deep, authoritative blue, but its luxury feel comes from the surrounding "Air."

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through:
- **Background Tonal Shifts:** A `surface-container-low` section sitting on a `surface` background.
- **Negative Space:** Using the spacing scale to create mental groupings.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—stacked sheets of fine paper.
*   **Base Layer:** `surface` (#f8f9fa) for the main canvas.
*   **Section Layer:** `surface-container-low` (#f3f4f5) for large content areas (e.g., search results list).
*   **Interactive Layer:** `surface-container-lowest` (#ffffff) for cards and inputs. This creates a "lifted" effect without heavy shadows.

### The "Glass & Gradient" Rule
To elevate the experience beyond a standard template:
*   **Floating Navigation:** Use `surface` colors at 80% opacity with a `24px` backdrop blur (Glassmorphism) for top navigation bars.
*   **Signature Soul:** Use a subtle linear gradient (135°) from `primary-container` (#1a56db) to `primary` (#003fb1) for main Action Buttons to give them a "gem-like" depth.

---

## 3. Typography
We employ a dual-typeface system to balance character with readability.

*   **Display & Headlines (Manrope):** Chosen for its geometric modernism. Large scales (`display-lg` to `headline-sm`) should be set with tight letter-spacing (-0.02em) to feel like a premium travel magazine.
*   **Body & UI (Inter):** The workhorse. High legibility for ticket details and seat numbers. 
*   **The Power of Labels:** Use `label-md` in All Caps with +0.05em tracking for secondary metadata (e.g., "BUS OPERATOR" or "DEPARTURE TIME") to establish a professional, structured hierarchy.

---

## 4. Elevation & Depth
We replace structural lines with **Tonal Layering**.

*   **Ambient Shadows:** For floating elements like "Seat Selection Modals," use a shadow: `0px 20px 40px rgba(25, 28, 29, 0.06)`. Note the tint—we use a soft version of `on-surface` rather than pure black to mimic natural light.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., Input Fields), use `outline-variant` (#c3c5d7) at **20% opacity**. It should be felt, not seen.
*   **Depth through Blur:** Use backdrop filters on overlays to keep the user grounded in the trip-searching context while focusing on the specific task.

---

## 5. Components

### Trip Cards
*   **Style:** No borders. Use `surface-container-lowest` (#ffffff) background.
*   **Structure:** Use vertical whitespace (1.5rem) to separate the Bus Operator from the Price.
*   **The "Ghost" Indicator:** Use a subtle vertical dashed line in `outline-variant` to connect the departure and arrival dots—never a solid line.

### Search Forms
*   **Containers:** Large, `xl` (0.75rem) rounded corners. 
*   **Focus State:** Instead of a thick border, use a 2px outer glow of `primary-fixed` (#dbe1ff).

### Seat Selection Map
*   **Available:** `surface-container-highest` (#e1e3e4) with `md` (0.375rem) corners.
*   **Selected:** `primary` (#003fb1) with a soft inner-glow.
*   **Occupied:** `surface-variant` (#e1e3e4) with a 45-degree micro-stripe pattern to indicate "Unavailable" without using harsh "X" marks.

### Buttons
*   **Primary:** Gradient of `primary-container` to `primary`. `xl` roundedness. 
*   **Secondary:** Ghost style. No background, `primary` text, and a `Ghost Border` that appears only on hover.

### Progress Steppers (Booking Flow)
*   Avoid circles and lines. Use a high-contrast `label-md` for the active step and `on-surface-variant` (low opacity) for inactive steps, separated by wide gaps.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use `display-lg` for destination names to create an editorial feel.
*   **DO** use "White Space as a Divider." If two elements feel cluttered, add 8px of space instead of a line.
*   **DO** use `surface-bright` for the backgrounds of interactive tooltips.

### Don’t
*   **DON'T** use pure black (#000000) for text. Use `on-surface` (#191c1d) to maintain a soft, premium look.
*   **DON'T** use "Standard" blue. Always refer to the `primary` (#003fb1) and `primary-container` (#1a56db) tokens.
*   **DON'T** use 90-degree sharp corners unless it's for a very specific, intentional "Brutalist" accent. Stick to the `xl` (12px) and `lg` (8px) scales.