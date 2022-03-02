[![Build Status](https://travis-ci.com/HabitatMap/AirCasting.svg?branch=master)](https://travis-ci.org/HabitatMap/AirCasting)
[![Code Climate](https://codeclimate.com/github/HabitatMap/AirCasting/badges/gpa.svg)](https://codeclimate.com/github/HabitatMap/AirCasting)

# AirCasting - Share your Air!

## About

This is the AirCasting project - the project aims to build a platform for gathering, visualization and sharing of environmental data. To learn more about the platform visit [aircasting.habitatmap.org](http://aircasting.habitatmap.org).

## Deploy

The `master` branch automatically deploys to `aircasting.habitatmap.org`.

## Setup

```bash
rvm use # if using rvm
ruby -v # should print the same version as in .ruby-version
nvm use # if using nvm
node -v # should print the same version as in .nvmrc
# Start mysql
bin/setup
```

### Obtaining a bitly access token

Go to https://bitly.com/ create an account and log in. To generate the token go to Settings -> Advanced settings -> For Developers -> OAuth -> Generic Access Token.


## Development

```bash
rvm use
nvm use
# make sure redis is running (brew info redis)
bin/foreman start
open http://localhost:5000/mobile_map
```

If `foreman` does not work, start the single processes manually: `./Procfile`.

## Tests

```bash
RAILS_ENV=test bin/rails db:create db:migrate
bin/rspec
yarn test
yarn elm-test app/javascript/elm/tests
```

## Formatting

Check:

```bash
yarn run elm-format --validate app/javascript/elm

yarn prettier --check "**/*.{scss,js,rb}"
```

Update:

```bash
yarn run elm-format app/javascript/elm

yarn prettier --write app/assets/stylesheets/path/to/your/file.scss
yarn prettier --write app/javascript/path/to/your/file.js
yarn prettier --write app/path/to/your/file.rb
```

Best to add elm-format and prettier to your editor to do this for you on save.

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
