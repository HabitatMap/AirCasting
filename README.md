[![Build Status](https://secure.travis-ci.org/HabitatMap/AirCasting.png)](https://travis-ci.org/HabitatMap/AirCasting)
[![Code Climate](https://codeclimate.com/github/HabitatMap/AirCasting/badges/gpa.svg)](https://codeclimate.com/github/HabitatMap/AirCasting)

# AirCasting - Share your Air!

## About

This is the AirCasting project - the project aims to build a platform for gathering, visualization and sharing of environmental data. To learn more about the platform visit [aircasting.org](http://aircasting.org).

## Developing

### Prerequisite: Debian / Ubuntu

```bash
sudo apt-get install bzip2 curl subversion git-core -y
# install rvm https://rvm.io/rvm/install
sudo apt-get install build-essential openssl libreadline6 libreadline6-dev curl git-core zlib1g zlib1g-dev libssl-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt-dev autoconf libc6-dev ncurses-dev automake libtool bison subversion pkg-config imagemagick mysql-server libmysqlclient-dev redis-server libgsl0-dev nodejs -y
```

### Prerequisite: Mac

```bash
# install rvm https://rvm.io/rvm/install
brew install gsl
```

### App (any OS)

```bash
rvm install 2.0.0
rvm use 2.0.0
gem install bundler
git clone git://github.com/HabitatMap/AirCasting.git
cd aircasting
cp config/database.yml.example config/database.yml
# `socket:` in `config/database.yml` should be equal to the path from
# `mysqladmin variables -uroot | grep socket | grep "\.sock"`
cp config/secrets.yml.example config/secrets.yml
# fill proper secrets in config/secrets.yml
bundle install
bundle exec rake db:create db:migrate
bundle exec sidekiq -d
bundle exec rails server
# visit http://localhost:3000
```

## Tests

**run tests**

```bash
RAILS_ENV=test bundle exec rake db:create db:migrate
bundle exec rspec
bundle exec rake spec:javascript
```

## ElasticSearch

Read more [here](doc/elasticsearch.md).

## API documentation

Read more [here](doc/api.md).

## Assets version bumping

Whenever changing code tounching google maps, the `data-version` attribute in `app/views/layouts/map.html.haml` should
be bumped. This ensures that the assets will reload correctly.

## Importing a big db dump to a server, i.e. staging

For restoring a big db dump you can try to opitimize a process by changing the database configuration temporarily.
See [example post on Stack Overflow](https://stackoverflow.com/questions/13717277/how-can-i-import-a-large-14-gb-mysql-dump-file-into-a-new-mysql-database)

```bash
mysql -u root -p
```

```sql
use MY_DATABASE_NAME;

set global net_buffer_length=1000000; --Set network buffer length to a large byte number

set global max_allowed_packet=1000000000; --Set maximum allowed packet size to a large byte number

SET foreign_key_checks = 0; --Disable foreign key checking to avoid delays,errors and unwanted behaviour

source file.sql --Import your sql dump file

SET foreign_key_checks = 1; --Remember to enable foreign key checks when procedure is complete!
```

## Contribute

If you'd like to contribute just use the usual github process - fork, make changes, issue a pull request.

## Contact

You can contact the authors by email at [info@habitatmap.org](mailto:info@habitatmap.org).

## Thanks
AirCasting uses The YourKit Java Profiler for Performance Tuning

YourKit is kindly supporting open source projects with its full-featured Java Profiler. YourKit, LLC is the creator of innovative and intelligent tools for profiling Java and .NET applications. Take a look at YourKit's leading software products: [YourKit Java Profiler](http://www.yourkit.com/java/profiler/index.jsp) and [YourKit .NET Profiler](http://www.yourkit.com/.net/profiler/index.jsp).

## License

The project is licensed under the GNU Affero GPLv3. For more information see COPYING and visit [http://www.gnu.org/licenses/agpl.html](http://www.gnu.org/licenses/agpl.html).
