import React from 'react';
import {
  Headphones,
  Monitor,
  Watch,
  Utensils,
  ShoppingBag,
  Laptop,
  Mouse,
  Zap,
  Package,
  Layers,
} from 'lucide-react';

export function getCategoryIcon(category: string | null | undefined, className = 'w-8 h-8'): React.ReactElement {
  const cat = (category || '').toLowerCase();
  if (cat.includes('audio') || cat.includes('headphone') || cat.includes('earbud') || cat.includes('soundbar')) {
    return <Headphones className={className} />;
  }
  if (cat.includes('monitor') || cat.includes('display') || cat.includes('screen')) {
    return <Monitor className={className} />;
  }
  if (cat.includes('wearable') || cat.includes('watch') || cat.includes('band') || cat.includes('glasses')) {
    return <Watch className={className} />;
  }
  if (cat.includes('kitchen') || cat.includes('fryer') || cat.includes('appliance')) {
    return <Utensils className={className} />;
  }
  if (cat.includes('bag') || cat.includes('tote') || cat.includes('duffel') || cat.includes('case')) {
    return <ShoppingBag className={className} />;
  }
  if (cat.includes('laptop') || cat.includes('computer') || cat.includes('book')) {
    return <Laptop className={className} />;
  }
  if (cat.includes('peripheral') || cat.includes('mouse') || cat.includes('keyboard')) {
    return <Mouse className={className} />;
  }
  if (cat.includes('power') || cat.includes('adapter') || cat.includes('surge') || cat.includes('hub')) {
    return <Zap className={className} />;
  }
  if (cat.includes('footwear') || cat.includes('shoe')) {
    return <Layers className={className} />;
  }
  return <Package className={className} />;
}
