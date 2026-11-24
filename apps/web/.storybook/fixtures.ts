import type {
  Article,
  ArticleWithContent,
  Highlight,
  User,
} from '@later/types';

import { pendingArticle } from '../src/lib/library';

export const now = new Date('2026-03-12T15:00:00Z');

export const user: User = {
  userId: '00000000-0000-0000-0000-000000000001',
  email: 'sam@example.com',
  name: 'Sam Rivera',
  createdAt: '2026-01-02T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
};

function article(
  index: number,
  fields: Partial<Article> &
    Pick<
      Article,
      'title' | 'siteName' | 'author' | 'excerpt' | 'dateSaved' | 'url'
    > & { wordCount: number }
): Article {
  return {
    articleId: `00000000-0000-0000-0000-00000000010${index}`,
    status: 'extracted',
    lang: 'en',
    dir: null,
    publicationDate: null,
    readingTimeMinutes: Math.ceil(fields.wordCount / 238),
    isArchived: false,
    isFavorited: false,
    dateRead: null,
    progress: { scrollPosition: 0, timeSpentSeconds: 0 },
    ...fields,
  };
}

export const articles: Article[] = [
  article(1, {
    title: 'The case for reading slowly',
    siteName: 'Field Notes',
    author: 'Mara Ellison',
    url: 'https://fieldnotes.example.com/reading-slowly',
    excerpt:
      'Speed is the wrong measure for most of what we read. A slower pace leaves room for the second thought, the one that usually matters.',
    wordCount: 2840,
    publicationDate: '2026-03-04T09:00:00Z',
    dateSaved: '2026-03-12T13:00:00Z',
  }),
  article(2, {
    title: 'How small teams ship large systems',
    siteName: 'Tidewater Engineering',
    author: 'Jonah Reyes',
    url: 'https://tidewater.example.com/small-teams',
    excerpt:
      'Fewer people means fewer handoffs. The trick is choosing boundaries that a single person can hold in their head.',
    wordCount: 4310,
    isFavorited: true,
    publicationDate: '2026-02-27T09:00:00Z',
    dateSaved: '2026-03-12T10:00:00Z',
  }),
  article(3, {
    title: 'A field guide to plain text',
    siteName: null,
    author: 'Ines Okafor',
    url: 'https://plaintext.example.com/field-guide',
    excerpt:
      'Files that outlive the apps that made them, and the small habits that keep them useful for decades.',
    wordCount: 1620,
    progress: { scrollPosition: 0.42, timeSpentSeconds: 190 },
    dateSaved: '2026-03-11T18:00:00Z',
  }),
  article(4, {
    title: 'What the archive remembers',
    siteName: 'The Long Room',
    author: 'Theo Marchetti',
    url: 'https://longroom.example.com/archive',
    excerpt:
      'Libraries keep more than books. They keep the order things were found in, and that order is a story too.',
    wordCount: 5280,
    isFavorited: true,
    dateSaved: '2026-03-09T12:00:00Z',
  }),
  article(5, {
    title: 'Notes on attention',
    siteName: 'Margins Weekly',
    author: 'Ruth Calder',
    url: 'https://margins.example.com/attention',
    excerpt:
      'Attention is less a muscle than a garden. It grows toward whatever you return to.',
    wordCount: 2050,
    dateRead: '2026-03-10T20:00:00Z',
    progress: { scrollPosition: 1, timeSpentSeconds: 540 },
    dateSaved: '2026-03-08T12:00:00Z',
  }),
  article(6, {
    title: 'Designing for the second read',
    siteName: 'Studio Quarterly',
    author: 'Ama Boateng',
    url: 'https://studio.example.com/second-read',
    excerpt:
      'The first read is for the idea. The second is for the craft, and that is where good writing hides its work.',
    wordCount: 3360,
    dateSaved: '2026-02-20T12:00:00Z',
  }),
  article(7, {
    title: 'Why we stopped estimating',
    siteName: 'Tidewater Engineering',
    author: 'Jonah Reyes',
    url: 'https://tidewater.example.com/estimating',
    excerpt:
      'Estimates were a conversation we kept having with the calendar instead of each other.',
    wordCount: 1890,
    isArchived: true,
    dateSaved: '2026-02-11T12:00:00Z',
  }),
];

export const library: Article[] = Array.from({ length: 36 }, (_, index) => ({
  ...articles[index % articles.length],
  articleId: `00000000-0000-0000-0000-${String(index + 200).padStart(12, '0')}`,
  isArchived: false,
  dateSaved: new Date(
    Date.parse('2026-03-12T13:00:00Z') - index * 9 * 60 * 60 * 1000
  ).toISOString(),
}));

export const pending: Article = pendingArticle(
  '00000000-0000-0000-0000-000000000201',
  'https://quietpages.example.com/essays/on-margins',
  '2026-03-12T14:58:00Z'
);

export const failed: Article = {
  ...pendingArticle(
    '00000000-0000-0000-0000-000000000202',
    'https://paywall.example.com/story/1234',
    '2026-03-12T14:30:00Z'
  ),
  status: 'failed',
};

export const extracted: Partial<Article> = {
  status: 'extracted',
  title: 'On margins',
  siteName: 'Quiet Pages',
  author: 'Lena Varga',
  excerpt:
    'The white space around a page is not empty. It is where the reader keeps their own notes.',
  wordCount: 1420,
  readingTimeMinutes: 6,
};

export const reading: ArticleWithContent = {
  ...articles[0],
  content:
    '<p>Most of what reaches us is written to be finished quickly. Headlines promise a takeaway, summaries promise the takeaway without the reading, and the reading itself becomes something to get through.</p><p>But the useful part of an essay is rarely the conclusion. It is the path the writer took to get there: the objection they considered, the example that did not quite fit, the paragraph where they changed their mind.</p><p>Reading slowly is not about reading less. It is about letting a piece of writing finish its work on you before you move on to the next one. That usually means saving it for a moment when you can give it your full attention.</p><p>The habit is simple. When something looks worth reading, put it somewhere safe. Come back when the day is quieter. Read it once for the idea and, if it earns it, once more for the craft.</p>',
};

export const resumed: ArticleWithContent = {
  ...reading,
  content: reading.content?.repeat(4) ?? null,
  progress: { scrollPosition: 0.5, timeSpentSeconds: 240 },
};

const readingText = (reading.content ?? '').replace(/<[^>]+>/g, '');

function highlight(
  index: number,
  selectedText: string,
  note: string | null = null
): Highlight {
  const startOffset = readingText.indexOf(selectedText);

  const endOffset = startOffset + selectedText.length;

  return {
    highlightId: `00000000-0000-0000-0000-00000000020${index}`,
    articleId: reading.articleId,
    selectedText,
    contextBefore: readingText.slice(
      Math.max(startOffset - 32, 0),
      startOffset
    ),
    contextAfter: readingText.slice(endOffset, endOffset + 32),
    startOffset,
    endOffset,
    color: '#FFEB3B',
    note,
    createdAt: '2026-03-12T14:00:00Z',
    updatedAt: '2026-03-12T14:00:00Z',
  };
}

export const highlights: Highlight[] = [
  highlight(
    1,
    'the useful part of an essay is rarely the conclusion',
    'Worth remembering when skimming.'
  ),
  highlight(2, 'Reading slowly is not about reading less.'),
];
