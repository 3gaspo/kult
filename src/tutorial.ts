import { Activity, BarChart2, Calendar, CheckCircle2, ChevronDown, Download, Edit3, Flame, Home, Play, Plus, RefreshCcw, Search, Settings } from 'lucide-react';
import type { TutorialPages } from '@3gaspo/app-ui/Tutorial';

export const tutorialPages = [
  {
    logo: '/kult.svg',
    title: 'Plan what to read or watch',
    description: 'Keep a ranked list of books, films and series, and a record of what you finish.',
  },
  {
    icon: Home,
    title: 'Home',
    actions: [
      { icon: Plus, text: 'Add a book, film or series', primary: true },
      { icon: Play, text: 'Start an item from your ranked list' },
      { icon: CheckCircle2, text: 'Mark an item as finished' },
    ],
  },
  {
    icon: Calendar,
    title: 'History',
    actions: [
      { icon: Search, text: 'Find finished items' },
      { icon: Edit3, text: 'Edit an item’s details' },
      { icon: RefreshCcw, text: 'Move an item to Backlog or Ongoing' },
    ],
  },
  {
    icon: BarChart2,
    title: 'Statistics',
    actions: [
      { icon: Activity, text: 'See what you finish each month' },
      { icon: ChevronDown, text: 'Filter by type or year' },
    ],
  },
  {
    icon: Settings,
    title: 'Settings',
    actions: [
      { icon: Plus, text: 'Add and manage content types' },
      { icon: Flame, text: 'Adjust how priority is calculated' },
      { icon: Download, text: 'Export your list as CSV' },
    ],
  },
] as const satisfies TutorialPages;
