#!/bin/bash

set -ex

git fetch --all
git checkout -b deploy
git merge --ff --no-edit cap3
git push --set-upstream origin deploy
bundle exec cap staging deploy BRANCH=deploy
git push origin :deploy
git checkout -
git branch -D deploy
