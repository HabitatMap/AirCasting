[![Build Status](https://travis-ci.org/HabitatMap/AirCasting.svg?branch=master)](https://travis-ci.org/HabitatMap/AirCasting)
[![Code Climate](https://codeclimate.com/github/HabitatMap/AirCasting/badges/gpa.svg)](https://codeclimate.com/github/HabitatMap/AirCasting)

# AirCasting - Share your Air!

## About

This is the AirCasting project - the project aims to build a platform for gathering, visualization and sharing of environmental data. To learn more about the platform visit [aircasting.org](http://aircasting.org).

## Developing

### Branching strategy

- `master` is stable code, which automatically deployes to `aircasting.org`. If you're setting up your own copy of Aircasting use this branch.

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
brew install imagemagick
brew install redis
brew install mysql@5.7
```

### App (any OS)

```bash
rvm install 2.2.10
rvm use 2.2.10
gem install bundler
git clone git://github.com/HabitatMap/AirCasting.git
cd aircasting
cp config/database.yml.example config/database.yml
# `socket:` in `config/database.yml` should be equal to the path from
# `mysqladmin variables -uroot | grep socket | grep "\.sock"`
cp config/configuration.yml.example config/configuration.yml
# fill proper configuration in config/configuration.yml
bundle install
bundle exec rake db:create db:migrate
bundle exec foreman start
yarn install
# visit http://localhost:3000
```

## Tests

**run tests**

```bash
RAILS_ENV=test bundle exec rake db:create db:migrate
bundle exec rspec
yarn test
yarn run elm-test app/javascript/elm/tests
yarn run elm-format --validate app/javascript/elm
```

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

## Troubleshooting

In case you encounter a similar error

```
Mysql2::Error: Expression #3 of SELECT list is not in GROUP BY clause and contains nonaggregated column ...
```

please check if any of these files

- /etc/my.cnf
- /etc/mysql/my.cnf
- /usr/local/etc/my.cnf
- ~/.my.cnf

contain `sql_mode = "..."`. If that's the case, make sure to remove `ONLY_FULL_GROUP_BY` from the string. Otherwise, just add

```
sql_mode = "STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"
```

to any existing configuration file. If none exists just create `~/.my.cnf` as follows

```
[mysqld]
sql_mode = "STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"
```
Note: If you installed mysql using a dmg file, you will have to create ~/.my.cnf according to the insturctions above, Even if some of the other files listed above contains `sql_mode = "..."` - this is just a left over from the previous instalations and will not be used by mysql installed by dmg.

To double check the configuration works

```bash
bundle exec rails c
ActiveRecord::Base.connection.execute("show variables like 'sql_mode'").to_a
# the return value should not contain ONLY_FULL_GROUP_BY
```

### Problems with mysql2 gem
If you run into error while installing mysql2 with exit code 2 try
- https://stackoverflow.com/questions/43661360/install-mysql2-gem-on-macos-sierra#answer-44790834
- installing form [this source](https://dev.mysql.com/downloads/mysql/5.7.html#downloads).

If you run into problems with db:migrate related to passwords make sure that you change the root password to `''`. To do that open `/your/path/to/mysql -uroot -p` provide the temporary password you were given during installation, then execute `set password = password('');`.


## Contribute

If you'd like to contribute just use the usual github process - fork, make changes, issue a pull request.

## Contact

You can contact the authors by email at [info@habitatmap.org](mailto:info@habitatmap.org).

## Thanks
AirCasting uses The YourKit Java Profiler for Performance Tuning

YourKit is kindly supporting open source projects with its full-featured Java Profiler. YourKit, LLC is the creator of innovative and intelligent tools for profiling Java and .NET applications. Take a look at YourKit's leading software products: [YourKit Java Profiler](http://www.yourkit.com/java/profiler/index.jsp) and [YourKit .NET Profiler](http://www.yourkit.com/.net/profiler/index.jsp).

## License

The project is licensed under the GNU Affero GPLv3. For more information see COPYING and visit [http://www.gnu.org/licenses/agpl.html](http://www.gnu.org/licenses/agpl.html).
