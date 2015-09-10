[![Build Status](https://secure.travis-ci.org/HabitatMap/AirCasting.png)](https://travis-ci.org/HabitatMap/AirCasting)
[![Code Climate](https://codeclimate.com/github/HabitatMap/AirCasting/badges/gpa.svg)](https://codeclimate.com/github/HabitatMap/AirCasting)

##AirCasting - Share your Air!

###About

This is the AirCasting project - the project aims to build a platform for gathering, visualization and sharing of environmental data. To learn more about the platform visit [aircasting.org](http://aircasting.org).

###Developing

For a [Debian](http://debian.org)/[Ubuntu](http://ubuntu.com) system, the easiest way to start is:

**rvm prerequisites**

`sudo apt-get install bzip2 curl subversion git-core -y`

**install rvm**

`curl -L https://get.rvm.io | bash -s`

**rvm requirements**

`sudo apt-get install build-essential openssl libreadline6 libreadline6-dev curl git-core zlib1g zlib1g-dev libssl-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt-dev autoconf libc6-dev ncurses-dev automake libtool bison subversion pkg-config imagemagick -y`

**install ruby**

```
rvm install 2.0.0
rvm use 2.0.0
```

**install bundler**

`gem install bundler`

**install databases**

`sudo apt-get install mysql-server libmysqlclient-dev redis-server -y`

**clone sources**

```
git clone git://github.com/HabitatMap/AirCasting.git aircasting
cd aircasting
cp config/database.yml.example config/database.yml
```

**rb-gsl dependency**

`sudo apt-get install libgsl0-dev -y`

**bundle dependencies**

`bundle`

**create database**

`bundle exec rake db:create db:migrate`

**run application, by default starts at [localhost:3000](http://localhost:3000)**

`bundle exec rails server`

### Tests

**dependencies**

`sudo apt-get install libqt4-dev qt4-qmake xvfb -y`

**run tests**

```
bundle exec rspec
xvfb-run bundle exec rake jasmine:headless
```

###Contribute

If you'd like to contribute just use the usual github process - fork, make changes, issue a pull request.

###Contact

You can contact the authors by email at [info@habitatmap.org](mailto:info@habitatmap.org).

###Thanks
AirCasting uses The YourKit Java Profiler for Performance Tuning

YourKit is kindly supporting open source projects with its full-featured Java Profiler. YourKit, LLC is the creator of innovative and intelligent tools for profiling Java and .NET applications. Take a look at YourKit's leading software products: [YourKit Java Profiler](http://www.yourkit.com/java/profiler/index.jsp) and [YourKit .NET Profiler](http://www.yourkit.com/.net/profiler/index.jsp).

###License

The project is licensed under the GNU Affero GPLv3. For more information see COPYING and visit [http://www.gnu.org/licenses/agpl.html](http://www.gnu.org/licenses/agpl.html).
