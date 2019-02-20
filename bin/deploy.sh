#!/bin/bash
set -e

if [ "$TRAVIS_PULL_REQUEST" == "true" ]; then
  echo "This is a pull request build so no deploy"
  exit 0
fi

if [ $TRAVIS_TEST_RESULT != 0 ]; then
  echo "The build failed so no deploy"
  exit 1
fi

if [ "$TRAVIS_BRANCH" == "master" ]; then
  bundle exec cap server deploy
else
  echo "$TRAVIS_BRANCH is a feature branch so no deploy"
fi
