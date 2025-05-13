import type { LucideProps } from "lucide-react";

export const Icons = {
  Logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100" // Adjusted viewBox for easier scaling of circle and text
      fill="none"
      stroke="currentColor" // Will be overridden by text-sidebar-primary in app-layout
      strokeWidth="2" // Default stroke width, can be adjusted or removed if not needed for the circle
      {...props}
    >
      {/* Outer circle */}
      <circle 
        cx="50" 
        cy="50" 
        r="45" 
        stroke="currentColor" // Uses the parent SVG's stroke color
        strokeWidth="3" // Adjust thickness of the circle as needed
        fill="none" // No fill for the circle itself
      />
      {/* SCHÜCO Text */}
      <text 
        x="50%" 
        y="50%" 
        dominantBaseline="middle" 
        textAnchor="middle" 
        fontSize="20" // Adjust font size as needed
        fontWeight="bold" // Schuco logo text is bold
        fill="currentColor" // Uses the parent SVG's stroke color, which is text-sidebar-primary
        stroke="none" // Text typically doesn't have an outline stroke
        fontFamily="Arial, sans-serif" // A common sans-serif font
      >
        SCHÜCO
      </text>
       {/* Small crown-like graphic above Ü - simplified */}
      <path d="M46 35 Q50 32 54 35 M48 35 L48 38 M50 35 L50 38 M52 35 L52 38" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  ),
};

export type Icon = keyof typeof Icons;
