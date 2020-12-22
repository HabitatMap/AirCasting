FROM ruby:2.6.2

RUN apt-get update && \
    apt-get install -y  libgsl-dev nano apt-transport-https mariadb-client \
                        build-essential openssl libreadline6-dev curl git-core zlib1g zlib1g-dev \
                        libssl-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt-dev autoconf \
                        libc6-dev ncurses-dev automake libtool bison subversion pkg-config \
                        imagemagick libgsl0-dev

#Install NodeJS (needed for YARN)
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - && \
    apt-get install -y nodejs

# Install yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && \
    apt-get install -y yarn

COPY . /app
WORKDIR /app

RUN gem install bundler && \
    bundle install -j10 && \
    bundle update sassc-rails && \
    yarn install && \
    yarn upgrade

ENTRYPOINT ["/app/docker-scripts/entrypoint.sh"]
