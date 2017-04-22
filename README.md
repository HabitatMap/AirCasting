[![Build Status](https://secure.travis-ci.org/HabitatMap/AirCasting.png)](https://travis-ci.org/HabitatMap/AirCasting)
[![Code Climate](https://codeclimate.com/github/HabitatMap/AirCasting/badges/gpa.svg)](https://codeclimate.com/github/HabitatMap/AirCasting)

## AirCasting - Share your Air!

### About

This is the AirCasting project - the project aims to build a platform for gathering, visualization and sharing of environmental data. To learn more about the platform visit [aircasting.org](http://aircasting.org).

### Developing

For a [Debian](http://debian.org)/[Ubuntu](http://ubuntu.com) system, the easiest way to start is:

**RVM prerequisites**

`sudo apt-get install bzip2 curl subversion git-core -y`

**Install RVM**

`curl -L https://get.rvm.io | bash -s`

**RVM & app requirements**

`sudo apt-get install build-essential openssl libreadline6 libreadline6-dev curl git-core zlib1g zlib1g-dev libssl-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt-dev autoconf libc6-dev ncurses-dev automake libtool bison subversion pkg-config imagemagick mysql-server libmysqlclient-dev redis-server libgsl0-dev nodejs -y`

**install ruby**

```
rvm install 2.0.0
rvm use 2.0.0
```

**install bundler**

`gem install bundler`

**clone sources**

```
git clone git://github.com/HabitatMap/AirCasting.git aircasting
cd aircasting
cp config/database.yml.example config/database.yml
```

**bundle dependencies**

`bundle install`

**create database**

`bundle exec rake db:create db:migrate`

**run sidekiq**

`bundle exec sidekiq -d`

**run application, by default starts at [localhost:3000](http://localhost:3000)**

`bundle exec rails server`

### Tests

**run tests**

```
bundle exec rspec
bundle exec rake spec:javascript
```

### ElasticSearch

Read more [here](doc/elasticsearch.md).

### API documentation

Read more [here](doc/api.md).

### Troubleshooting

* `Mysql2::Error: All parts of a PRIMARY KEY must be NOT NULL; if you need
NULL in a key, use UNIQUE instead (...)`

 If you see this error, you need to downgrade MySql database server to ver. 5.6. We don't support the latest MySql server version yet.

* `Library not loaded: /usr/local/opt/mysql/lib/libmysqlclient.20.dylib`

 If you get this error while attempting `rake db:migrate`, reinstall gem mysql2:

 `gem uninstall mysql2`
 `gem install mysql2 -v '0.3.20'`

### Contribute

If you'd like to contribute just use the usual github process - fork, make changes, issue a pull request.

### Contact

You can contact the authors by email at [info@habitatmap.org](mailto:info@habitatmap.org).

### Thanks
AirCasting uses The YourKit Java Profiler for Performance Tuning

YourKit is kindly supporting open source projects with its full-featured Java Profiler. YourKit, LLC is the creator of innovative and intelligent tools for profiling Java and .NET applications. Take a look at YourKit's leading software products: [YourKit Java Profiler](http://www.yourkit.com/java/profiler/index.jsp) and [YourKit .NET Profiler](http://www.yourkit.com/.net/profiler/index.jsp).

### License

The project is licensed under the GNU Affero GPLv3. For more information see COPYING and visit [http://www.gnu.org/licenses/agpl.html](http://www.gnu.org/licenses/agpl.html).
