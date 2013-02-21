![http://travis-ci.org/LunarLogicPolska/AirCasting](https://secure.travis-ci.org/LunarLogicPolska/AirCasting.png)

##AirCasting - Share your Air!

###About

This is the AirCasting project - the project aims to build a platform for gathering, visualization and sharing of environmental data. To learn more about the platform visit [aircasting.org](http://aircasting.org).

###Developing

For a [Debian](http://debian.org)/[Ubuntu](http://ubuntu.com) system, the easiest way to start is:

* rvm prerequisites  
    `sudo apt-get install bzip2 curl subversion git-core` 

* install rvm  
curl -L https://get.rvm.io | bash -s
* rvm requirements  
`sudo apt-get install build-essential openssl libreadline6 libreadline6-dev curl git-core zlib1g zlib1g-dev libssl-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt-dev autoconf libc6-dev ncurses-dev automake libtool bison subversion pkg-config imagemagick`
* install ruby  
`rvm install ruby-1.9.2-p290`  
`rvm use ruby-1.9.2-p290`  
* install database  
`sudo apt-get install mysql-server libmysqlclient-dev `
* clone sources  
`git clone git://github.com/LunarLogicPolska/AirCasting.git aircasting`  
`cd aircasting`    
`cp config/database.yml.example config/database.yml`  
* create database  
`rake db:create db:migrate`
* run application, by default starts as [localhost:3000](http://localhost:3000)  
`rails s`

###Contribute

If you'd like to contribute just use the usual github process - fork, make changes, issue a pull request.

###Contact

You can contact the authors by email at [info@habitatmap.org](mailto:info@habitatmap.org).

###Thanks
AirCasting uses The YourKit Java Profiler for Performance Tuning

YourKit is kindly supporting open source projects with its full-featured Java Profiler. YourKit, LLC is the creator of innovative and intelligent tools for profiling Java and .NET applications. Take a look at YourKit's leading software products: [YourKit Java Profiler](http://www.yourkit.com/java/profiler/index.jsp) and [YourKit .NET Profiler](http://www.yourkit.com/.net/profiler/index.jsp).

###License

The project is licensed under the GNU Affero GPLv3. For more information see COPYING and visit [http://www.gnu.org/licenses/agpl.html](http://www.gnu.org/licenses/agpl.html).
`
