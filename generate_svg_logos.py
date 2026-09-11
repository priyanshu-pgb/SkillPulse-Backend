import os

svg_icon = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" class="skillpulse-logo-svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="spBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#001B30"/>
      <stop offset="50%" stop-color="#002B49"/>
      <stop offset="100%" stop-color="#021E36"/>
    </linearGradient>

    <!-- Emerald Teal Gradient for S/P Loops -->
    <linearGradient id="spTealLoop" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="40%" stop-color="#0D7E55"/>
      <stop offset="100%" stop-color="#0369A1"/>
    </linearGradient>

    <linearGradient id="spLoopSecondary" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#06B6D4"/>
      <stop offset="50%" stop-color="#0D7E55"/>
      <stop offset="100%" stop-color="#002B49"/>
    </linearGradient>

    <!-- Electric Pulse & Arrow Gradient -->
    <linearGradient id="spPulseArrow" x1="0%" y1="100%" x2="90%" y2="10%">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="35%" stop-color="#06B6D4"/>
      <stop offset="70%" stop-color="#38BDF8"/>
      <stop offset="90%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#F26A21"/>
    </linearGradient>

    <!-- Arrow Head Flare Gradient -->
    <linearGradient id="spArrowHead" x1="20%" y1="90%" x2="95%" y2="10%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#FBBF24"/>
      <stop offset="100%" stop-color="#F26A21"/>
    </linearGradient>

    <!-- Glow Filter -->
    <filter id="spGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>

    <!-- Soft Drop Shadow for Icon -->
    <filter id="spDropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#002B49" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Base Rounded Container with subtle border -->
  <rect x="3" y="3" width="114" height="114" rx="26" fill="url(#spBgGrad)"/>
  <rect x="3.5" y="3.5" width="113" height="113" rx="25.5" stroke="rgba(255, 255, 255, 0.14)" stroke-width="1.2"/>
  
  <!-- Subtle Inner Ambient Glow -->
  <circle cx="90" cy="30" r="38" fill="#06B6D4" opacity="0.12" filter="blur(16px)"/>
  <circle cx="35" cy="85" r="35" fill="#0D7E55" opacity="0.15" filter="blur(14px)"/>

  <!-- Lower 'P' & 'S' Continuous Flow Base Track -->
  <g filter="url(#spDropShadow)">
    <!-- Top 'S' Curve Loop -->
    <path d="M 68 34 C 68 25 59 19 46 19 C 31 19 22 28 22 41 C 22 53 32 60 48 64 C 64 68 74 74 74 86 C 74 98 63 103 48 103 C 32 103 24 94 24 85" 
          stroke="url(#spTealLoop)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.35"/>

    <!-- Bottom 'P' Geometric Loop Stem -->
    <path d="M 46 44 L 46 99" 
          stroke="url(#spLoopSecondary)" stroke-width="11" stroke-linecap="round" fill="none" opacity="0.4"/>

    <!-- Main 'S' Shape Core -->
    <path d="M 66 33 C 66 26.5 58.5 22 47 22 C 34 22 25.5 29.5 25.5 40.5 C 25.5 50.5 33.5 56.5 49 61 C 65 65.5 73.5 72.5 73.5 83.5 C 73.5 94.5 64 100 48.5 100 C 35 100 27.5 92.5 27.5 85" 
          stroke="url(#spTealLoop)" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          
    <!-- Main 'P' Stem & Loop -->
    <path d="M 44 48 L 44 96" 
          stroke="url(#spLoopSecondary)" stroke-width="9.5" stroke-linecap="round" fill="none"/>
    <path d="M 44 48 C 58 48 72 54 72 68 C 72 81 58 87 44 87" 
          stroke="url(#spLoopSecondary)" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>

  <!-- DYNAMIC PULSE & RISING ARROW (Central Feature) -->
  <g id="pulse-growth-arrow">
    <!-- Glow Underlay -->
    <path d="M 32 78 L 46 54 L 56 68 L 74 38 L 94 22" 
          stroke="#38BDF8" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.25" filter="url(#spGlow)"/>

    <!-- Sharp Electric Pulse Wave Path -->
    <path d="M 33 76 L 47 53 L 57 67 L 76 36 L 93 23" 
          stroke="url(#spPulseArrow)" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>

    <!-- Inner Core Highlight Line -->
    <path d="M 35 75 L 47 55 L 57 66 L 76 37 L 91 25" 
          stroke="#E0F2FE" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.85"/>

    <!-- Upward Rocket / Trajectory Arrowhead -->
    <polygon points="97,14 80,24 88,29" fill="url(#spArrowHead)"/>
    <polygon points="97,14 88,29 93,37" fill="url(#spArrowHead)"/>
    <polygon points="97,14 84,26 89,28" fill="#FFFBEB" opacity="0.9"/>
  </g>

  <!-- Golden Flare Sparkle at Arrow Tip -->
  <circle cx="97" cy="14" r="3.5" fill="#FDE047" filter="url(#spGlow)"/>
  <circle cx="97" cy="14" r="1.8" fill="#FFFFFF"/>
</svg>
'''

svg_icon_transparent = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" class="skillpulse-logo-svg">
  <defs>
    <!-- Emerald Teal Gradient for S/P Loops -->
    <linearGradient id="spTealLoopT" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="40%" stop-color="#0D7E55"/>
      <stop offset="100%" stop-color="#0369A1"/>
    </linearGradient>

    <linearGradient id="spLoopSecondaryT" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#06B6D4"/>
      <stop offset="50%" stop-color="#0D7E55"/>
      <stop offset="100%" stop-color="#002B49"/>
    </linearGradient>

    <!-- Electric Pulse & Arrow Gradient -->
    <linearGradient id="spPulseArrowT" x1="0%" y1="100%" x2="90%" y2="10%">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="35%" stop-color="#06B6D4"/>
      <stop offset="70%" stop-color="#38BDF8"/>
      <stop offset="90%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#F26A21"/>
    </linearGradient>

    <linearGradient id="spArrowHeadT" x1="20%" y1="90%" x2="95%" y2="10%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#FBBF24"/>
      <stop offset="100%" stop-color="#F26A21"/>
    </linearGradient>

    <filter id="spGlowT" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Loops -->
  <g>
    <!-- Top 'S' Curve Loop -->
    <path d="M 66 33 C 66 26.5 58.5 22 47 22 C 34 22 25.5 29.5 25.5 40.5 C 25.5 50.5 33.5 56.5 49 61 C 65 65.5 73.5 72.5 73.5 83.5 C 73.5 94.5 64 100 48.5 100 C 35 100 27.5 92.5 27.5 85" 
          stroke="url(#spTealLoopT)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          
    <!-- Main 'P' Stem & Loop -->
    <path d="M 44 48 L 44 96" 
          stroke="url(#spLoopSecondaryT)" stroke-width="10" stroke-linecap="round" fill="none"/>
    <path d="M 44 48 C 58 48 72 54 72 68 C 72 81 58 87 44 87" 
          stroke="url(#spLoopSecondaryT)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>

  <!-- DYNAMIC PULSE & RISING ARROW -->
  <g>
    <path d="M 33 76 L 47 53 L 57 67 L 76 36 L 93 23" 
          stroke="url(#spPulseArrowT)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>

    <path d="M 35 75 L 47 55 L 57 66 L 76 37 L 91 25" 
          stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9"/>

    <polygon points="97,14 80,24 88,29" fill="url(#spArrowHeadT)"/>
    <polygon points="97,14 88,29 93,37" fill="url(#spArrowHeadT)"/>
    <polygon points="97,14 84,26 89,28" fill="#FFFBEB" opacity="0.95"/>
  </g>

  <circle cx="97" cy="14" r="3.5" fill="#FDE047" filter="url(#spGlowT)"/>
  <circle cx="97" cy="14" r="1.8" fill="#FFFFFF"/>
</svg>
'''

# Full Horizontal Logo for Light backgrounds (Navbar / Header)
svg_logo_light_bg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 64" fill="none" class="skillpulse-full-logo">
  <defs>
    <linearGradient id="fullBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#001B30"/>
      <stop offset="50%" stop-color="#002B49"/>
      <stop offset="100%" stop-color="#021E36"/>
    </linearGradient>

    <linearGradient id="fullTealLoop" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="40%" stop-color="#0D7E55"/>
      <stop offset="100%" stop-color="#0369A1"/>
    </linearGradient>

    <linearGradient id="fullPulseArrow" x1="0%" y1="100%" x2="90%" y2="10%">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="35%" stop-color="#06B6D4"/>
      <stop offset="70%" stop-color="#38BDF8"/>
      <stop offset="90%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#F26A21"/>
    </linearGradient>

    <linearGradient id="fullArrowHead" x1="20%" y1="90%" x2="95%" y2="10%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#FBBF24"/>
      <stop offset="100%" stop-color="#F26A21"/>
    </linearGradient>
  </defs>

  <!-- Left Icon Tile (48x48) -->
  <g transform="translate(8, 8)">
    <rect width="48" height="48" rx="12" fill="url(#fullBgGrad)"/>
    <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" stroke="rgba(255, 255, 255, 0.16)" stroke-width="1"/>
    
    <!-- Scaled Icon Glyphs (scale 48/120 = 0.4) -->
    <g transform="scale(0.4)">
      <path d="M 66 33 C 66 26.5 58.5 22 47 22 C 34 22 25.5 29.5 25.5 40.5 C 25.5 50.5 33.5 56.5 49 61 C 65 65.5 73.5 72.5 73.5 83.5 C 73.5 94.5 64 100 48.5 100 C 35 100 27.5 92.5 27.5 85" 
            stroke="url(#fullTealLoop)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M 44 48 L 44 96" 
            stroke="url(#fullTealLoop)" stroke-width="10" stroke-linecap="round" fill="none"/>
      <path d="M 44 48 C 58 48 72 54 72 68 C 72 81 58 87 44 87" 
            stroke="url(#fullTealLoop)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>

      <!-- Pulse & Arrow -->
      <path d="M 33 76 L 47 53 L 57 67 L 76 36 L 93 23" 
            stroke="url(#fullPulseArrow)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M 35 75 L 47 55 L 57 66 L 76 37 L 91 25" 
            stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9"/>
      <polygon points="97,14 80,24 88,29" fill="url(#fullArrowHead)"/>
      <polygon points="97,14 88,29 93,37" fill="url(#fullArrowHead)"/>
      <circle cx="97" cy="14" r="3.5" fill="#FDE047"/>
      <circle cx="97" cy="14" r="1.8" fill="#FFFFFF"/>
    </g>
  </g>

  <!-- Typography Right (For Light Theme: Deep Navy + Emerald) -->
  <text x="68" y="34" font-family="'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" fill="#002B49" letter-spacing="-0.5">Skill<tspan fill="#0D7E55">Pulse</tspan></text>
  <text x="69" y="49" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="8.5" font-weight="700" fill="#F26A21" letter-spacing="1.2">SKILLING OUTCOMES INTELLIGENCE</text>
</svg>
'''

# Full Horizontal Logo for Dark backgrounds (Sidebar / Dark Mode)
svg_logo_dark_bg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 64" fill="none" class="skillpulse-full-logo">
  <defs>
    <linearGradient id="fullBgGradD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#001B30"/>
      <stop offset="50%" stop-color="#002B49"/>
      <stop offset="100%" stop-color="#021E36"/>
    </linearGradient>

    <linearGradient id="fullTealLoopD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="40%" stop-color="#0D7E55"/>
      <stop offset="100%" stop-color="#0369A1"/>
    </linearGradient>

    <linearGradient id="fullPulseArrowD" x1="0%" y1="100%" x2="90%" y2="10%">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="35%" stop-color="#06B6D4"/>
      <stop offset="70%" stop-color="#38BDF8"/>
      <stop offset="90%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#F26A21"/>
    </linearGradient>

    <linearGradient id="fullArrowHeadD" x1="20%" y1="90%" x2="95%" y2="10%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#FBBF24"/>
      <stop offset="100%" stop-color="#F26A21"/>
    </linearGradient>
  </defs>

  <!-- Left Icon Tile (48x48) -->
  <g transform="translate(8, 8)">
    <rect width="48" height="48" rx="12" fill="url(#fullBgGradD)"/>
    <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" stroke="rgba(255, 255, 255, 0.22)" stroke-width="1"/>
    
    <!-- Scaled Icon Glyphs (scale 48/120 = 0.4) -->
    <g transform="scale(0.4)">
      <path d="M 66 33 C 66 26.5 58.5 22 47 22 C 34 22 25.5 29.5 25.5 40.5 C 25.5 50.5 33.5 56.5 49 61 C 65 65.5 73.5 72.5 73.5 83.5 C 73.5 94.5 64 100 48.5 100 C 35 100 27.5 92.5 27.5 85" 
            stroke="url(#fullTealLoopD)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M 44 48 L 44 96" 
            stroke="url(#fullTealLoopD)" stroke-width="10" stroke-linecap="round" fill="none"/>
      <path d="M 44 48 C 58 48 72 54 72 68 C 72 81 58 87 44 87" 
            stroke="url(#fullTealLoopD)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>

      <!-- Pulse & Arrow -->
      <path d="M 33 76 L 47 53 L 57 67 L 76 36 L 93 23" 
            stroke="url(#fullPulseArrowD)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M 35 75 L 47 55 L 57 66 L 76 37 L 91 25" 
            stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9"/>
      <polygon points="97,14 80,24 88,29" fill="url(#fullArrowHeadD)"/>
      <polygon points="97,14 88,29 93,37" fill="url(#fullArrowHeadD)"/>
      <circle cx="97" cy="14" r="3.5" fill="#FDE047"/>
      <circle cx="97" cy="14" r="1.8" fill="#FFFFFF"/>
    </g>
  </g>

  <!-- Typography Right (For Dark Theme: Crisp White + Cyan Accent) -->
  <text x="68" y="34" font-family="'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" letter-spacing="-0.5">Skill<tspan fill="#38BDF8">Pulse</tspan></text>
  <text x="69" y="49" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="8.5" font-weight="700" fill="#F26A21" letter-spacing="1.2">SKILLING OUTCOMES INTELLIGENCE</text>
</svg>
'''

# Ultra-crisp 32x32 Favicon SVG
svg_favicon = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <defs>
    <linearGradient id="favBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#001B30"/>
      <stop offset="100%" stop-color="#002B49"/>
    </linearGradient>
    <linearGradient id="favPulse" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0D7E55"/>
      <stop offset="40%" stop-color="#06B6D4"/>
      <stop offset="85%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#F26A21"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="7.5" fill="url(#favBg)"/>
  <rect x="0.5" y="0.5" width="31" height="31" rx="7" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  
  <!-- S-curve loop hint -->
  <path d="M 18 9 C 14 9 9.5 11 9.5 15 C 9.5 19 13 20 18 21 C 23 22 23 24 23 25 C 23 27 20 28 16 28" 
        stroke="#10B981" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.6"/>

  <!-- Dynamic Pulse Arrow -->
  <path d="M 7 21 L 12 14 L 16 19 L 21 9 L 25 6" 
        stroke="url(#favPulse)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <polygon points="27,4 21,7 24,9" fill="#F26A21"/>
  <circle cx="27" cy="4" r="1.2" fill="#FDE047"/>
</svg>
'''

dest_dirs = [
    r'c:\Users\priya\OneDrive\Documents\EmployeeTracker\SkillPulse\SkillPulse-Frontend\images',
    r'c:\Users\priya\OneDrive\Documents\EmployeeTracker\SkillPulse\SkillPulse-Frontend\assets',
    r'c:\Users\priya\OneDrive\Documents\EmployeeTracker\SkillPulse\static\images',
    r'c:\Users\priya\OneDrive\Documents\EmployeeTracker\SkillPulse\staticfiles\images'
]

for d in dest_dirs:
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, 'skillpulse-icon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_icon)
    with open(os.path.join(d, 'skillpulse-icon-transparent.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_icon_transparent)
    with open(os.path.join(d, 'skillpulse-logo.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_logo_light_bg)
    with open(os.path.join(d, 'skillpulse-logo-dark.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_logo_dark_bg)
    with open(os.path.join(d, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_favicon)

# Root level favicons for SkillPulse-Frontend
with open(r'c:\Users\priya\OneDrive\Documents\EmployeeTracker\SkillPulse\SkillPulse-Frontend\favicon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_favicon)

print("All vector SVG logos generated and saved successfully!")
