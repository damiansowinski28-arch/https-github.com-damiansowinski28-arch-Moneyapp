import {
  Briefcase,
  Car,
  Clapperboard,
  CreditCard,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  MoreHorizontal,
  Plane,
  Repeat,
  Shield,
  ShoppingBag,
  Target,
  TrendingUp,
  Utensils,
  Wallet,
} from 'lucide-react';
import type { GoalIconKey } from '../types/finance';

export function CategoryIcon({
  category,
  className = 'w-4 h-4',
}: {
  category: string;
  className?: string;
}) {
  switch (category) {
    case 'Jedzenie':
      return <Utensils className={className} />;
    case 'Transport':
      return <Car className={className} />;
    case 'Mieszkanie':
      return <Home className={className} />;
    case 'Zakupy':
      return <ShoppingBag className={className} />;
    case 'Rozrywka':
      return <Clapperboard className={className} />;
    case 'Zdrowie':
      return <HeartPulse className={className} />;
    case 'Edukacja':
      return <GraduationCap className={className} />;
    case 'Subskrypcje':
      return <Repeat className={className} />;
    case 'Podróże':
      return <Plane className={className} />;
    case 'Wynagrodzenie':
      return <Wallet className={className} />;
    case 'Freelance':
      return <Laptop className={className} />;
    case 'Biznes':
      return <Briefcase className={className} />;
    case 'Inwestycje':
      return <TrendingUp className={className} />;
    case 'Prezenty':
      return <Gift className={className} />;
    case 'Inne':
      return <MoreHorizontal className={className} />;
    default:
      return <CreditCard className={className} />;
  }
}

export function GoalIcon({
  icon,
  className = 'w-5 h-5',
}: {
  icon: GoalIconKey;
  className?: string;
}) {
  switch (icon) {
    case 'car':
      return <Car className={className} />;
    case 'plane':
      return <Plane className={className} />;
    case 'laptop':
      return <Laptop className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'home':
      return <Home className={className} />;
    default:
      return <Target className={className} />;
  }
}
