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
      { icon: Play, text: 'Start an item from your list' },
      { icon: CheckCircle2, text: 'Mark an item finished' },
    ],
  },
  {
    icon: Calendar,
    title: 'History',
    actions: [
      { icon: Search, text: 'Find finished items' },
      { icon: Edit3, text: 'Edit an item’s details' },
      { icon: RefreshCcw, text: 'Reopen to Backlog or Ongoing' },
    ],
  },
  {
    icon: BarChart2,
    title: 'Statistics',
    actions: [
      { icon: Activity, text: 'See monthly completions' },
      { icon: ChevronDown, text: 'Filter by type or year' },
    ],
  },
  {
    icon: Settings,
    title: 'Settings',
    actions: [
      { icon: Plus, text: 'Manage content types' },
      { icon: Flame, text: 'Change priority weights' },
      { icon: Download, text: 'Export your list as CSV' },
    ],
  },
] as const satisfies TutorialPages;
