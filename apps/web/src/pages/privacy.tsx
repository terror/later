import { Logo } from '@/components/logo';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const REPOSITORY_URL = 'https://github.com/terror/later';

const SECTIONS: { title: string; body: ReactNode }[] = [
  {
    title: 'Signing in',
    body: (
      <>
        <p>
          You sign in to later with GitHub. later asks GitHub for permission to
          read your email addresses, then saves your name from your GitHub
          profile and your primary email address, or another verified one if
          your primary isn&rsquo;t verified. The access token GitHub returns is
          used only during sign-in and isn&rsquo;t stored.
        </p>
        <p>
          Signing in sets a session cookie in your browser. The session it
          points to is stored in Redis and deleted when you sign out.
        </p>
      </>
    ),
  },
  {
    title: 'Saving pages',
    body: (
      <>
        <p>
          The browser extension only acts when you click its button. It then
          reads the address and the full HTML of the tab you&rsquo;re looking at
          and sends both to the later API. It has no content scripts, and it
          doesn&rsquo;t read other tabs or your browsing history.
        </p>
        <p>For each page you save, later stores:</p>
        <ul>
          <li>
            The address, and a copy with the fragment and tracking parameters
            like <code>utm_source</code> removed, used to spot duplicates.
          </li>
          <li>The page HTML the extension sent.</li>
          <li>
            The article pulled out of that HTML: its title, author, excerpt,
            site name, language, publication date, text, word count, and reading
            time.
          </li>
          <li>
            When you saved it, and whether you&rsquo;ve favorited or archived
            it.
          </li>
        </ul>
        <p>
          Images in an article load from the site they came from, so that site
          sees the request when you read it.
        </p>
      </>
    ),
  },
  {
    title: 'Connecting the extension',
    body: (
      <p>
        When you connect the extension, later creates an API token for it. The
        extension keeps the token in its local storage and sends it with each
        request. The server stores only a SHA-256 hash of the token.
        Disconnecting deletes the token from the extension and revokes it on the
        server.
      </p>
    ),
  },
  {
    title: 'Where your data lives',
    body: (
      <>
        <p>
          The later API runs on Railway, with your account, saved pages, and
          token hashes in a Postgres database and sign-in sessions in Redis,
          both also on Railway. The web app is hosted on Vercel, which passes
          its requests through to the API.
        </p>
        <p>
          The API logs each request&rsquo;s method, path, browser user agent,
          status, and timing. Railway and Vercel may keep their own logs of
          requests they handle.
        </p>
      </>
    ),
  },
  {
    title: 'What later doesn’t do',
    body: (
      <p>
        later has no analytics, ads, or tracking. It doesn&rsquo;t sell your
        data or share it with anyone beyond the hosting providers above.
      </p>
    ),
  },
  {
    title: 'Deleting your data',
    body: (
      <p>
        Deleting an article from your library removes it from the database,
        along with its HTML and extracted content. There isn&rsquo;t a way to
        delete your whole account from the app yet. To have it deleted, or to
        ask a question about this policy, open an issue on{' '}
        <a href={REPOSITORY_URL}>GitHub</a>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className='bg-background text-foreground min-h-screen antialiased'>
      <header className='mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6 sm:px-10'>
        <Link to='/' aria-label='later home'>
          <Logo />
        </Link>
        <Link
          to='/'
          className='text-muted-foreground hover:text-foreground flex h-11 items-center gap-1.5 text-[15px] font-medium'
        >
          <ArrowLeft className='size-4' aria-hidden />
          Back
        </Link>
      </header>
      <main className='mx-auto max-w-6xl px-6 pt-16 pb-24 sm:px-10 sm:pt-24'>
        <h1 className='text-4xl leading-[1.06] font-semibold tracking-[-0.04em] sm:text-6xl'>
          Privacy
        </h1>
        <p className='text-muted-foreground mt-4 text-[15px]'>
          Last updated November 23, 2026
        </p>
        <div className='mt-14 flex max-w-[660px] flex-col gap-12'>
          {SECTIONS.map(({ title, body }) => (
            <section key={title} className='flex flex-col gap-4'>
              <h2 className='text-xl font-semibold tracking-[-0.02em]'>
                {title}
              </h2>
              <div className='text-muted-foreground [&_a]:text-foreground [&_code]:bg-muted [&_code]:text-foreground flex flex-col gap-4 text-[15px] leading-relaxed [&_a]:underline [&_code]:rounded [&_code]:px-1 [&_code]:font-mono [&_code]:text-[13px] [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5'>
                {body}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
