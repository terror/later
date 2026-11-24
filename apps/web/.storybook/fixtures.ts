import type { Article, ArticleWithContent, User } from '@later/types';

export const now = new Date('2026-03-12T15:00:00Z');

export const user: User = {
  user_id: '00000000-0000-0000-0000-000000000001',
  email: 'sam@example.com',
  name: 'Sam Rivera',
  created_at: '2026-01-02T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
};

function article(
  index: number,
  fields: Partial<Article> &
    Pick<
      Article,
      'title' | 'site_name' | 'author' | 'excerpt' | 'date_saved' | 'url'
    > & { word_count: number }
): Article {
  return {
    article_id: `00000000-0000-0000-0000-00000000010${index}`,
    lang: 'en',
    dir: null,
    publication_date: null,
    reading_time_minutes: Math.ceil(fields.word_count / 238),
    is_archived: false,
    is_favorited: false,
    date_read: null,
    progress: { scroll_position: 0, time_spent_seconds: 0 },
    ...fields,
  };
}

export const articles: Article[] = [
  article(1, {
    title: 'The case for reading slowly',
    site_name: 'Field Notes',
    author: 'Mara Ellison',
    url: 'https://fieldnotes.example.com/reading-slowly',
    excerpt:
      'Speed is the wrong measure for most of what we read. A slower pace leaves room for the second thought, the one that usually matters.',
    word_count: 2840,
    publication_date: '2026-03-04T09:00:00Z',
    date_saved: '2026-03-12T13:00:00Z',
  }),
  article(2, {
    title: 'How small teams ship large systems',
    site_name: 'Tidewater Engineering',
    author: 'Jonah Reyes',
    url: 'https://tidewater.example.com/small-teams',
    excerpt:
      'Fewer people means fewer handoffs. The trick is choosing boundaries that a single person can hold in their head.',
    word_count: 4310,
    is_favorited: true,
    publication_date: '2026-02-27T09:00:00Z',
    date_saved: '2026-03-12T10:00:00Z',
  }),
  article(3, {
    title: 'A field guide to plain text',
    site_name: null,
    author: 'Ines Okafor',
    url: 'https://plaintext.example.com/field-guide',
    excerpt:
      'Files that outlive the apps that made them, and the small habits that keep them useful for decades.',
    word_count: 1620,
    progress: { scroll_position: 0.42, time_spent_seconds: 190 },
    date_saved: '2026-03-11T18:00:00Z',
  }),
  article(4, {
    title: 'What the archive remembers',
    site_name: 'The Long Room',
    author: 'Theo Marchetti',
    url: 'https://longroom.example.com/archive',
    excerpt:
      'Libraries keep more than books. They keep the order things were found in, and that order is a story too.',
    word_count: 5280,
    is_favorited: true,
    date_saved: '2026-03-09T12:00:00Z',
  }),
  article(5, {
    title: 'Notes on attention',
    site_name: 'Margins Weekly',
    author: 'Ruth Calder',
    url: 'https://margins.example.com/attention',
    excerpt:
      'Attention is less a muscle than a garden. It grows toward whatever you return to.',
    word_count: 2050,
    date_read: '2026-03-10T20:00:00Z',
    progress: { scroll_position: 1, time_spent_seconds: 540 },
    date_saved: '2026-03-08T12:00:00Z',
  }),
  article(6, {
    title: 'Designing for the second read',
    site_name: 'Studio Quarterly',
    author: 'Ama Boateng',
    url: 'https://studio.example.com/second-read',
    excerpt:
      'The first read is for the idea. The second is for the craft, and that is where good writing hides its work.',
    word_count: 3360,
    date_saved: '2026-02-20T12:00:00Z',
  }),
  article(7, {
    title: 'Why we stopped estimating',
    site_name: 'Tidewater Engineering',
    author: 'Jonah Reyes',
    url: 'https://tidewater.example.com/estimating',
    excerpt:
      'Estimates were a conversation we kept having with the calendar instead of each other.',
    word_count: 1890,
    is_archived: true,
    date_saved: '2026-02-11T12:00:00Z',
  }),
];

export const reading: ArticleWithContent = {
  ...articles[0],
  content:
    '<p>Most of what reaches us is written to be finished quickly. Headlines promise a takeaway, summaries promise the takeaway without the reading, and the reading itself becomes something to get through.</p><p>But the useful part of an essay is rarely the conclusion. It is the path the writer took to get there: the objection they considered, the example that did not quite fit, the paragraph where they changed their mind.</p><p>Reading slowly is not about reading less. It is about letting a piece of writing finish its work on you before you move on to the next one. That usually means saving it for a moment when you can give it your full attention.</p><p>The habit is simple. When something looks worth reading, put it somewhere safe. Come back when the day is quieter. Read it once for the idea and, if it earns it, once more for the craft.</p>',
};

export const resumed: ArticleWithContent = {
  ...reading,
  content: reading.content?.repeat(4) ?? null,
  progress: { scroll_position: 0.5, time_spent_seconds: 240 },
};
