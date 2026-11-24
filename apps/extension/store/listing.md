# later

## Name

later

## Summary

Save the page you’re on to later, and read it when you’re ready.

## Description

later is a read-it-later app. Click the later button in your toolbar and the
page you’re on is saved to your library, exactly as you see it, even when it’s
behind a sign-in.

- Save in one click: the extension sends the page you’re looking at to your
  library as soon as you open it.
- A calm place to read: articles are pulled out of the page into clean text,
  without the clutter that surrounds them.
- Inbox, favorites, archive: keep what’s next in your inbox, star the pieces
  worth keeping, and archive the rest.
- Find it again: search your library by title, site, or author.
- On every screen: read in the web app on your laptop or your phone, in light or
  dark mode.
- Open source: built in the open with Rust and React at
  https://github.com/terror/later.

To get started, sign in at https://www.later.sh with GitHub, then click Connect
in the extension and approve it once.

## Category

Productivity

## Links

- Homepage: https://www.later.sh
- Support: https://github.com/terror/later/issues
- Privacy policy: https://www.later.sh/privacy

## Single purpose

Save the page in the current tab to the user’s later library.

## Permissions

- `activeTab`: read the address of the current tab when the user clicks the
  later button.
- `scripting`: read the HTML of the current tab, after the user clicks the later
  button, so the article can be extracted.
- `storage`: keep the API token that connects the extension to the user’s later
  account.
- `identity`: open the later connect page and receive the API token when the
  user approves it.
- `https://api.later.sh/*`: send saved pages to the later API.

The extension doesn’t use remote code.

## Data usage

- Website content: the HTML of pages the user saves.
- Web history: the addresses of pages the user saves.

Data is used only to provide the user’s library, isn’t sold, and isn’t shared
with third parties beyond the hosting providers named in the privacy policy.

## Assets

- `icon-128.png`: store icon, 96×96 mark with 16 px of transparent padding.
- `promo-small.png`: 440×280 small promo tile.
- `screenshots/*.png`: 1280×800 screenshots, in listing order.

## Notes to Firefox reviewers

The add-on is built with WXT from the sources archive produced by
`bun run zip:firefox`:

1. Install Bun 1.4.5.
2. Run `bun install --frozen-lockfile` in the archive root.
3. Run `bun run build:firefox` in `apps/extension`.

The built add-on is written to `apps/extension/.output/firefox-mv2`.
