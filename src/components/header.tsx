import { Leaf } from 'lucide-react';
import React from 'react';

const Header = () => {
  return (
    <header className="border-b sticky top-0 z-40 w-full bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0 max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex gap-2 items-center">
          <Leaf className="h-7 w-7 text-primary" />
          <h1 className="font-headline text-2xl font-bold text-foreground">
            NutriSnap
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
