set dotenv-load

export EDITOR := 'nvim'

alias f := fmt

default:
  just --list

clippy:
  ./bin/clippy

fmt:
  cargo fmt --all

restart-services:
  docker compose down --volumes && just services

services:
  docker compose up -d
