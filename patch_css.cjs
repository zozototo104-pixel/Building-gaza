const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

const premiumDark = `
:root {
    /* Premium Dark Theme - Charcoal / Graphite with Emerald/Cyan accents */
    --background: oklch(0.15 0.01 240); /* Very Dark Slate */
    --foreground: oklch(0.98 0 0); /* Near white */
    
    --card: oklch(0.18 0.01 240); /* Slightly lighter card */
    --card-foreground: oklch(0.98 0 0);
    
    --popover: oklch(0.18 0.01 240);
    --popover-foreground: oklch(0.98 0 0);
    
    --primary: oklch(0.7 0.15 180); /* Bright Emerald/Teal accent */
    --primary-foreground: oklch(0.1 0 0);
    
    --secondary: oklch(0.23 0.01 240);
    --secondary-foreground: oklch(0.95 0 0);
    
    --muted: oklch(0.23 0.01 240);
    --muted-foreground: oklch(0.75 0.02 240); /* Soft light gray */
    
    --accent: oklch(0.7 0.15 180 / 15%);
    --accent-foreground: oklch(0.7 0.15 180);
    
    --destructive: oklch(0.6 0.15 20); /* Subdued red */
    
    --border: oklch(0.28 0.01 240); /* Subtle border */
    --input: oklch(0.28 0.01 240);
    
    --ring: oklch(0.7 0.15 180);
    
    --sidebar: oklch(0.13 0.01 240); /* Darkest sidebar */
    --sidebar-foreground: oklch(0.95 0 0);
    --sidebar-primary: oklch(0.7 0.15 180);
    --sidebar-primary-foreground: oklch(0.1 0 0);
    --sidebar-accent: oklch(0.2 0.01 240);
    --sidebar-accent-foreground: oklch(0.95 0 0);
    --sidebar-border: oklch(0.2 0.01 240);
    --sidebar-ring: oklch(0.7 0.15 180);
    
    --radius: 0.75rem;
}
`;

css = css.replace(/:root\s*\{[^]*?\.light\s*\{/, premiumDark + "\n.light {");
fs.writeFileSync('src/index.css', css);
