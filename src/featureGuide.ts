import type { FeatureSection } from '@3gaspo/app-ui/Tutorial';
import { DEFAULT_FORMULA_WEIGHTS } from './types';

const defaults = DEFAULT_FORMULA_WEIGHTS;

export const featureGuide = [
  {
    title: 'Add and manage content',
    entries: [
      { title: 'Build your list', text: 'Add a book, film, series or another content type. Record the title, creator, release date, date added, keywords and notes. Rate priority, motivation and length from 1 to 5.' },
      { title: 'Choose what to start', text: 'Filter Home by type. It shows Backlog and Ongoing items in descending effective priority (EP). Start an item to move it to Ongoing, pause it to return it to Backlog, or mark it completed when you finish.' },
      { title: 'Edit or remove items', text: 'Open an item’s edit action to correct its fields, change its status or delete it.' },
    ],
  },
  {
    title: 'History',
    entries: [
      { title: 'Find something you finished', text: 'Search completed items by title, creator or keyword. Filter by content type or completion year and change the sort order.' },
      { title: 'Reopen a completed item', text: 'Choose Backlog to save it for later or Ongoing to pick up where you left off. Edit its details or completion date from History.' },
    ],
  },
  {
    title: 'Effective priority formula',
    entries: [
      { title: 'Combine five weighted inputs', text: 'Multiply each input by its weight in Settings, add the results, multiply by 100 and round to one decimal place. The saved weights are used directly.', formula: 'EP = round₁(100 × W)\nW = wP × P + wM × M\n  + wS × S + wF × F + wB × B' },
      { title: 'Ratings and length', text: 'Higher priority and motivation raise the score. Lower length ratings favour shorter items.', formula: 'P = priority ÷ 5\nM = motivation ÷ 5\nS = (6 − length) ÷ 5' },
      { title: 'Freshness and backlog age', text: 'Age is the number of days since the item was added, with a minimum of zero. The freshness boost fades over 30 days. The backlog boost grows until 180 days.', formula: 'F = max(0, 1 − ageDays ÷ 30)\nB = min(1, ageDays ÷ 180)' },
      { title: 'Default weights', text: 'You can adjust the five weights in Settings. Saving a total weight of zero restores these defaults.', formula: `wP = ${defaults.priorityWeight}, wM = ${defaults.pleasureWeight}, wS = ${defaults.shortnessWeight}\nwF = ${defaults.freshnessWeight}, wB = ${defaults.backlogWeight}` },
    ],
  },
  {
    title: 'Statistics',
    entries: [
      { title: 'Review your activity', text: 'Filter by content type and year. See total completions, monthly average, which items are waiting or ongoing, and charts of monthly completions and content distribution.' },
      { title: 'Score display', text: 'Show or hide the average score for the category on Home and the overall average backlog score in Statistics using Settings.' },
    ],
  },
  {
    title: 'Settings, export and resets',
    entries: [
      { title: 'Manage content types', text: 'Create, rename or reorder types, and choose the default type. If a type still has items, choose a replacement before deleting it.' },
      { title: 'Appearance, account and CSV', text: 'Switch themes, manage your sign-in or export your content list as CSV. Local data stays in this browser. Firebase data follows the signed-in account.' },
      { title: 'Reset data', text: 'Clear History removes completed items. Reset All clears your content and restores the app’s starting types and settings.' },
    ],
  },
] as const satisfies readonly FeatureSection[];
