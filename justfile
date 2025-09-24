set dotenv-load

export EDITOR := 'nvim'

alias d := dev
alias f := fmt
alias t := test

default:
  just --list

clippy:
  ./bin/clippy

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

fmt:
  cargo fmt --all

restart-services:
  docker compose down --volumes && just services

services:
  docker compose up -d

test:
  cargo test --all
