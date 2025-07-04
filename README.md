[![Build Status](https://travis-ci.com/HabitatMap/AirCasting.svg?branch=master)](https://travis-ci.org/HabitatMap/AirCasting)
[![Code Climate](https://codeclimate.com/github/HabitatMap/AirCasting/badges/gpa.svg)](https://codeclimate.com/github/HabitatMap/AirCasting)

# AirCasting - Share your Air!

## About

This is the AirCasting project - the project aims to build a platform for gathering, visualization and sharing of environmental data. To learn more about the platform visit [aircasting.org](https://aircasting.org).

## Deploy

To deploy to experimental server use the command:
`SERVER=EXPERIMENTAL_SERVER_IP BRANCH=your-branch bundle exec cap server deploy`

To deploy to staging server use the command:
`SERVER=STAGING_SERVER_IP BRANCH=staging bundle exec cap server deploy`

To deploy to production server use the command:
`SERVER=aircasting.habitatmap.org BRANCH=master bundle exec cap server deploy`

## Setup

```bash
ruby -v
# this command should print the same version as in .ruby-version
# if it's not install and set the correct ruby version
# using https://github.com/rbenv/rbenv

# please make sure you have installed and turned on a correct version of node
# available in the `.nvmrc` file

# run:
bin/setup
```

### configuration.yml

Set up access tokens to be able to access Google Maps and other services.

Please contact development team for develompent credentials.

### Obtaining a bitly access token

Go to https://bitly.com/ create an account and log in. To generate the token go to Settings -> Advanced settings -> For Developers -> OAuth -> Generic Access Token.

## Development

Make sure that redis is running

```bash
redis-server
```

Start all 3 processes in separate terminal windows for full control.

```bash
unset PORT && env RUBY_DEBUG_OPEN=true bin/rails server
```

```bash
yarn dev
```

```bash
bin/sidekiq
```

If sidekiq can't find the correct bundler version run:

```bash
eval "$(rbenv init -)"
```

## Tests

```bash
RAILS_ENV=test bin/rails db:create db:migrate
bin/rspec
yarn test
```

## Formatting

Check:

```bash

yarn prettier --check "**/*.{scss,js,rb}"
```

Update:

```bash

yarn prettier --write app/assets/stylesheets/path/to/your/file.scss
yarn prettier --write app/javascript/path/to/your/file.js
yarn prettier --write app/path/to/your/file.rb
```

## API documentation

Read more [here](doc/api.md).

## Contribute

If you'd like to contribute just use the usual github process - fork, make changes, issue a pull request.

## Contact

You can contact the authors by email at [info@habitatmap.org](mailto:info@habitatmap.org).

## Thanks

AirCasting uses The YourKit Java Profiler for Performance Tuning

YourKit is kindly supporting open source projects with its full-featured Java Profiler. YourKit, LLC is the creator of innovative and intelligent tools for profiling Java and .NET applications. Take a look at YourKit's leading software products: [YourKit Java Profiler](http://www.yourkit.com/java/profiler/index.jsp) and [YourKit .NET Profiler](http://www.yourkit.com/.net/profiler/index.jsp).

## License

The project is licensed under the GNU Affero GPLv3. For more information see COPYING and visit [http://www.gnu.org/licenses/agpl.html](http://www.gnu.org/licenses/agpl.html).

## Frontend Tests

We use two types of frontend tests:

### Unit Tests

- **Frameworks:** [Jest](https://jestjs.io/) and [React Testing Library (RTL)](https://testing-library.com/docs/react-testing-library/intro/)
- **Location:** `app/javascript/react/tests/`
  - `unit/` - Unit tests for React components and utilities
- **How to run:**
  ```bash
  yarn test
  ```
- **Docs:**
  - [Jest Documentation](https://jestjs.io/docs/getting-started)
  - [React Testing Library Documentation](https://testing-library.com/docs/)

### End-to-End (E2E) Tests

- **Framework:** [Playwright](https://playwright.dev/)
- **Location:** `app/javascript/react/tests/e2e/`
- **How to run:**
  ```bash
  yarn playwright test
  ```
- **Docs:**
  - [Playwright Documentation](https://playwright.dev/docs/intro)
