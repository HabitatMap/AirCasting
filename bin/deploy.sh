#!/bin/bash

if [ "$TRAVIS_BRANCH" == "staging" ]; then
  bundle exec cap staging deploy
elif [ "$TRAVIS_BRANCH" == "master" ]; then
  bundle exec cap production deploy
else
  echo "$TRAVIS_BRANCH is a feature branch so no deploy"
fi
