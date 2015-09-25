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

Run `rake index:measurements`

### Turning on in Air Casting app

Visit [locahost:3000/flipper](http://locahost:3000/flipper). Create `elasticsearch` feature and enable it.
