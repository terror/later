set dotenv-load

export EDITOR := 'nvim'

alias d := dev
alias f := fmt
alias t := test

default:
  just --list

[group: 'lint']
clippy:
  ./bin/clippy

[group: 'desktop']
[working-directory: 'apps/desktop']
desktop:
  bun run tauri dev

[group: 'desktop']
[working-directory: 'apps/desktop']
desktop-build origin='https://www.later.sh':
  bun run tauri build --config '{"build":{"frontendDist":"{{origin}}"}}'

[group: 'dev']
dev: services
  concurrently \
    --kill-others \
    --names 'SERVER,CLIENT' \
    --prefix-colors 'green.bold,magenta.bold' \
    --prefix '[{name}] ' \
    --prefix-length 2 \
    --success first \
    --handle-input \
    --timestamp-format 'HH:mm:ss' \
    --color \
    -- \
    'cd packages/api && cargo watch --clear --exec run' \
    'cd apps/web && bun run dev'

[group: 'format']
fmt: fmt-api fmt-web

[group: 'format']
fmt-api:
  cargo fmt --all

[group: 'format']
fmt-web:
  bun run fmt

[group: 'dev']
restart-services:
  docker compose down --volumes && just services

[group: 'dev']
services:
  docker compose up -d

[group: 'test']
coverage: coverage-api coverage-web

[group: 'test']
coverage-api:
  cargo llvm-cov --workspace --all-targets --all-features --no-report
  cargo llvm-cov report --html
  cargo llvm-cov report --summary-only

[group: 'test']
coverage-web:
  cd apps/web && bun test --coverage

[group: 'test']
test: test-api test-web

[group: 'test']
test-api:
  cargo test --all

[group: 'test']
test-web:
  bun test
