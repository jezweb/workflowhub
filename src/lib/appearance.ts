export type ColorTheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'berry' | 'rose' | 'slate' | 'emerald' | 'amber' | 'indigo';
export type ButtonStyle = 'solid' | 'gradient';

export const COLOR_THEMES: Record<ColorTheme, { background: string; text: string; gradient?: string }> = {
  default: { 
    background: 'bg-primary', 
    text: 'text-primary-foreground', 
    gradient: 'bg-gradient-to-r from-primary to-primary/80' 
  },
  ocean: { 
    background: 'bg-blue-500', 
    text: 'text-white', 
    gradient: 'bg-gradient-to-r from-cyan-500 to-blue-500' 
  },
  forest: { 
    background: 'bg-green-500', 
    text: 'text-white', 
    gradient: 'bg-gradient-to-r from-green-500 to-emerald-500' 
  },
  sunset: { 
    background: 'bg-orange-500', 
    text: 'text-white', 
    gradient: 'bg-gradient-to-r from-orange-500 to-red-500' 
  },
  berry: { 
    background: 'bg-purple-500', 
    text: 'text-white', 
    gradient: 'bg-gradient-to-r from-purple-500 to-pink-500' 
  },
  rose: { 
    background: 'bg-pink-500', 
    text: 'text-white', 
    gradient: 'bg-gradient-to-r from-pink-500 to-rose-500' 
  },
  slate: { 
    background: 'bg-gray-600', 
    text: 'text-white', 
    gradient: 'bg-gradient-to-r from-gray-600 to-gray-700' 
  },
  emerald: { 
    background: 'bg-teal-500', 
    text: 'text-white', 
    gradient: 'bg-gradient-to-r from-teal-500 to-cyan-500' 
  },
  amber: { 
    background: 'bg-amber-500', 
    text: 'text-black', 
    gradient: 'bg-gradient-to-r from-amber-400 to-orange-500' 
  },
  indigo: { 
    background: 'bg-indigo-600', 
    text: 'text-white', 
    gradient: 'bg-gradient-to-r from-indigo-600 to-purple-600' 
  }
};