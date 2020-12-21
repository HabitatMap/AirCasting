FROM ruby:2.6.2

RUN apt-get update && \
    apt-get install -y libgsl-dev nano apt-transport-https mariadb-client dos2unix

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

RUN bundle install -j10 && \
    yarn install --production=false && \
    find . -type f -print0 | xargs -0 dos2unix

ENTRYPOINT ["/app/docker-scripts/entrypoint.sh"]
