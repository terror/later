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
    'cd packages/web && bun run dev'

[group: 'format']
fmt: fmt-api fmt-web

[group: 'format']
fmt-api:
  cargo fmt -p api

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
test: test-api test-web

[group: 'test']
test-api:
  cargo test -p api

[group: 'test']
test-web:
  bun test
