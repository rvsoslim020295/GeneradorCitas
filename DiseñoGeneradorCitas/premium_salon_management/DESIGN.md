---
name: Premium Salon Management
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#464554'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#777585'
  outline-variant: '#c7c4d6'
  surface-tint: '#4e4cce'
  primary: '#4441c4'
  on-primary: '#ffffff'
  primary-container: '#5d5cde'
  on-primary-container: '#f1eeff'
  inverse-primary: '#c2c1ff'
  secondary: '#006591'
  on-secondary: '#ffffff'
  secondary-container: '#39b8fd'
  on-secondary-container: '#004666'
  tertiary: '#854300'
  on-tertiary: '#ffffff'
  tertiary-container: '#a95700'
  on-tertiary-container: '#ffede2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c2c1ff'
  on-primary-fixed: '#0b006b'
  on-primary-fixed-variant: '#3530b6'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb782'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703800'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter-desktop: 24px
  gutter-tablet: 16px
  margin-page: 32px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style
The brand personality is professional, efficient, and sophisticated, designed to instill confidence in business owners while remaining invisible enough to let their salon's work shine. This design system adopts a **Modern Corporate** style influenced by **Minimalism** and **Glassmorphism**. 

The goal is to provide a "high-end tool" feel—akin to a luxury timepiece or a precision instrument. The UI relies on generous whitespace, high-quality typography, and subtle depth to organize complex scheduling and financial data. The emotional response should be one of calm control and technical reliability, ensuring that even the busiest Saturday at a barbershop feels manageable through the interface.

## Colors
The palette is rooted in a deep, vibrant Indigo (`#5D5CDE`) which serves as the primary brand anchor, symbolizing the intersection of technology and premium service. 

- **Primary:** Used for main actions, active states, and brand recognition.
- **Surface & Background:** A clean palette of whites and very light grays (`#F8FAFC`) prevents eye fatigue during long shifts.
- **Status Colors:** These are functionally critical for the agenda. 
    - **Green (Success):** Completed appointments.
    - **Yellow (Warning):** Pending or "No-show" risks.
    - **Red (Error):** Cancelled or urgent alerts.
    - **Blue (Info):** Confirmed upcoming slots.
- **Contrast:** High contrast ratios (minimum 4.5:1) are maintained for all functional text to ensure readability in bright salon environments.

## Typography
This design system utilizes **Inter** for all layers. Inter's tall x-height and exceptional legibility make it ideal for high-density information like booking calendars and inventory lists.

The hierarchy is structured to support "scanning." Large display styles are reserved for dashboard metrics (e.g., Daily Revenue), while tight, semi-bold labels are used for the calendar grid. On mobile and tablet devices, headline sizes scale down slightly to preserve screen real estate, while body text remains at 16px to ensure comfortable touch targets and readability.

## Layout & Spacing
The system follows a **12-column fluid grid** for desktop and a **6-column grid** for tablets. A strict 8px spatial system governs all margins and padding, ensuring mathematical harmony across the UI.

- **Agenda Layout:** Uses a fixed-height row system (e.g., 64px per hour) to create a rhythmic "time-block" feel. 
- **Dashboard:** Employs a bento-box style layout where cards occupy specific column spans (e.g., 3 columns for small metrics, 6 for charts).
- **Tablet Optimization:** To accommodate iPad users, touch targets are a minimum of 44x44px. Sidebars are collapsible to maximize the horizontal space for the calendar view.

## Elevation & Depth
This design system uses **Tonal Layers** and **Ambient Shadows** to create a sense of organized hierarchy. 

The background is a flat neutral-50. Objects that sit on it, like cards and the sidebar, use a subtle 1px border (`#E2E8F0`) and a soft, diffused shadow (Y: 4, Blur: 6, Opacity: 0.05). 

When an element is interacted with—such as dragging an appointment block—the shadow deepens and the element scales slightly (1.02x) to mimic physical lifting. We avoid heavy gradients, preferring semi-transparent "glass" overlays for modal backdrops to maintain environmental awareness for the user.

## Shapes
The shape language is defined by **Rounded** corners that mirror the soft, approachable nature of the beauty industry while maintaining professional discipline.

The standard radius is **12px** for cards and primary containers. Smaller elements like buttons and input fields use **8px** (rounded-md) to appear more precise, while status badges and user avatars use **Full Pill** shapes to distinguish them from actionable containers.

## Components

### Cards & Metrics
Dashboard cards must use the 12px roundedness. Metrics are displayed with a `headline-md` value and a `label-md` subtitle. Trends (up/down percentages) are placed in the top right corner using status colors.

### The Agenda Block
Appointment blocks in the calendar are the core component. They use a left-border accent (4px width) colored by their status (Confirmed, Pending, etc.). Inside the block, `label-md` text identifies the service and `body-md` identifies the client.

### Buttons & Inputs
- **Primary Button:** Solid Indigo fill, white text, 8px radius.
- **Secondary Button:** White fill, 1px border (`#CBD5E1`), Indigo text.
- **Inputs:** Clean, white background with a 1px border. On focus, the border changes to the primary color with a 3px soft outer glow. Labels are always visible and positioned above the input.

### Status Badges
Badges are used for appointment states. They utilize a light background tint of the status color with high-contrast text of the same hue (e.g., Light Green background with Dark Green text). They are always pill-shaped.