# ElasticSearch

## Installation

Go to the [page](https://www.elastic.co/downloads/elasticsearch) and follow instructions.

## Configuration

Find `elasticsearch.yml` configuration file:

Ubuntu `/etc/elasticsearch/elasticsearch.yml`

OS X `/usr/local/etc/elasticsearch/elasticsearch.yml`

Ensure following options:

```
cluster.name: elasticsearch_aircasting
node.name: "aircasting"
bootstrap.mlockall: true
network.host: 127.0.0.1
script.inline: on
script.indexed: on
```

## Air Casting app

Right now ElasticSearch is used to provide faster results for `/api/averages` endpoint used by CrowdMap for displaying average values from sensor.

### Indexing

Run `rake elastic:index:measurements`

### Turning on in Air Casting app

1. Create an account ([http://localhost:3000/users/sign_up](http://localhost:3000/users/sign_up)) and sign in ([http://localhost:3000/users/sign_in](http://localhost:3000/users/sign_in)),
3. Give yourself admin privileges (replace `<PUT_YOUR_USERNAME_HERE>`):

  ```
  bundle exec rails c
  User.find_by_username('<PUT_YOUR_USERNAME_HERE>').update_attribute(:admin, true)
  exit
  ```
4. Visit [locahost:3000/flipper](http://locahost:3000/flipper), create `elasticsearch` feature and enable it.
