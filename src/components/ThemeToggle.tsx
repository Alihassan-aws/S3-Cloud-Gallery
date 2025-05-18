
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleTheme} 
            aria-label="Toggle theme"
            className="transition-all duration-300 hover:bg-accent hover:scale-105"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-yellow-400 rotate-0 scale-100 transition-all duration-300" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700 rotate-0 scale-100 transition-all duration-300" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Switch to {theme === 'dark' ? 'light' : 'dark'} mode</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ThemeToggle;
