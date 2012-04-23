#!/bin/bash -i

rvm 1.9.2
rvm gemset list | grep aircasting || rvm gemset create aircasting
rvm 1.9.2@aircasting
gem list | grep bundler || gem install bundler

bundle install

export DISPLAY=:92

script/xvfb start

export RAILS_ENV=test

rake db:migrate
rspec && rake jasmine:ci && script/xvfb stop
