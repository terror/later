set dotenv-load

export EDITOR := 'nvim'

alias f := fmt

default:
  just --list

fmt:
  cargo fmt

restart-services:
  docker compose down --volumes && just services

services:
  docker compose up -d
