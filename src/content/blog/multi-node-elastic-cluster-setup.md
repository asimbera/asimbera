---
title: Setup a multi-node elasticsearch cluster
description: Walk-through of setting up a multi node Elasticsearch cluster
pubDate: 2025-03-02
heroImage: /assets/7504550_3685115.svg
---

For this walk-through I am using 3 Linux Containers, each having latest Ubuntu 24.04 image. You can use any OS and Version combination listed in [Elastic Support Matrix](https://www.elastic.co/support/matrix).

|   NAME    |  STATE   |         IPV4           |
| --------- | -------- | ---------------------- |
| elastic0  | RUNNING  | 10.250.252.252 (eth0)  |
| elastic1  | RUNNING  | 10.250.252.236 (eth0)  |
| elastic2  | RUNNING  | 10.250.252.156 (eth0)  |

## Installing Elasticsearch

Grab the latest release of Elasticsearch from <https://www.elastic.co/downloads/elasticsearch>.

If you are also on some Debian based distribution, then do the following:
![](/assets/download_elasticsearch-1.png)
Select 1. `deb x86_64` and 2. Click on the download button.

To install the file run:

```bash
dpkg -i elasticsearch-8.17.2-amd64.deb
```

Replace the filename `elasticsearch-8.17.2-amd64.deb` with the package you downloaded.

## Creating `TLS` Certificates

We will be creating the `TLS` certificates for all nodes in `elastic0` instance. But it is advisable to create the private keys and `CSR` in individual hosts and sign that with CA.

### Creating CA Certificate

```bash
# Generate CA Certificate and Private Key
/usr/share/elasticsearch/bin/elasticsearch-certutil ca --silent --pem -out /etc/elasticsearch/certs/ca.zip

# Unpack
unzip /etc/elasticsearch/certs/ca.zip -d /etc/elasticsearch/certs
```

### Creating Node Certificates

Create a file named `instances.yml` in `/etc/elasticsearch/certs`.

```yaml title="/etc/elasticsearch/certs"
instances:
  - name: elastic0
    dns:
      - elastic0
    ip:
      - 10.250.252.252

  - name: elastic1
    dns:
      - elastic1
    ip:
      - 10.250.252.236

  - name: elastic2
    dns:
      - elastic2
    ip:
      - 10.250.252.156
```

#### Generate Certificates

```bash
# Generate Certificate and Key bundle
/usr/share/elasticsearch/bin/elasticsearch-certutil cert --silent --pem -out /etc/elasticsearch/certs/certs.zip --in /etc/elasticsearch/certs/instances.yml -ca-cert /etc/elasticsearch/certs/ca/ca.crt --ca-key /etc/elasticsearch/certs/ca/ca.key

# Unpack
unzip /etc/elasticsearch/certs/certs.zip -d /etc/elasticsearch/certs
```

Now move the CA and certificate/key to their respective hosts in the same location.

## Elasticsearch Configuration

I'm going to use `hostname` (i.e. - `elastic0`, `elastic1`, `elastic2`) while referring to other nodes in the configuration, but you can use IP as well. You must use IP if your environment does not have a internal dns server or the hostnames are not added in `/etc/hosts`.

Create the following configuration in `elastic0` node `/etc/elasticsearch/elasticsearch.yml`.

```yaml title="/etc/elasticsearch/elasticsearch.yml"
node.name: elastic0
cluster.name: elasticdev
cluster.initial_master_nodes:
  - elastic0
  - elastic1
  - elastic2
discovery.seed_hosts:
  - elastic1
  - elastic2

# bootstrap.memory_lock: true

xpack.security.enabled: true
xpack.security.http.ssl.enabled: true
xpack.security.http.ssl.key: /etc/elasticsearch/certs/elastic0/elastic0.key
xpack.security.http.ssl.certificate: /etc/elasticsearch/certs/elastic0/elastic0.crt
xpack.security.http.ssl.certificate_authorities: /etc/elasticsearch/certs/ca/ca.crt
xpack.security.transport.ssl.enabled: true
xpack.security.transport.ssl.key: /etc/elasticsearch/certs/elastic0/elastic0.key
xpack.security.transport.ssl.certificate: /etc/elasticsearch/certs/elastic0/elastic0.crt
xpack.security.transport.ssl.certificate_authorities: /etc/elasticsearch/certs/ca/ca.crt
xpack.security.transport.ssl.verification_mode: certificate
xpack.ml.use_auto_machine_memory_percent: true

path.data: /var/lib/elasticsearch
path.logs: /var/log/elasticsearch
network.host: 0.0.0.0
http.host: 0.0.0.0
transport.host: 0.0.0.0
```

Create the following configuration in `elastic1` node `/etc/elasticsearch/elasticsearch.yml`.

```yaml title="/etc/elasticsearch/elasticsearch.yml"
node.name: elastic1
cluster.name: elasticdev
cluster.initial_master_nodes:
  - elastic0
  - elastic1
  - elastic2
discovery.seed_hosts:
  - elastic0
  - elastic2

# bootstrap.memory_lock: true

xpack.security.enabled: true
xpack.security.http.ssl.enabled: true
xpack.security.http.ssl.key: /etc/elasticsearch/certs/elastic1/elastic1.key
xpack.security.http.ssl.certificate: /etc/elasticsearch/certs/elastic1/elastic1.crt
xpack.security.http.ssl.certificate_authorities: /etc/elasticsearch/certs/ca/ca.crt
xpack.security.transport.ssl.enabled: true
xpack.security.transport.ssl.key: /etc/elasticsearch/certs/elastic1/elastic1.key
xpack.security.transport.ssl.certificate: /etc/elasticsearch/certs/elastic1/elastic1.crt
xpack.security.transport.ssl.certificate_authorities: /etc/elasticsearch/certs/ca/ca.crt
xpack.security.transport.ssl.verification_mode: certificate
xpack.ml.use_auto_machine_memory_percent: true

path.data: /var/lib/elasticsearch
path.logs: /var/log/elasticsearch
network.host: 0.0.0.0
http.host: 0.0.0.0
transport.host: 0.0.0.0
```

Create the following configuration in `elastic2` node `/etc/elasticsearch/elasticsearch.yml`.

```yaml title="/etc/elasticsearch/elasticsearch.yml"
node.name: elastic2
cluster.name: elasticdev
cluster.initial_master_nodes:
  - elastic0
  - elastic1
  - elastic2
discovery.seed_hosts:
  - elastic0
  - elastic1

# bootstrap.memory_lock: true

xpack.security.enabled: true
xpack.security.http.ssl.enabled: true
xpack.security.http.ssl.key: /etc/elasticsearch/certs/elastic2/elastic2.key
xpack.security.http.ssl.certificate: /etc/elasticsearch/certs/elastic2/elastic2.crt
xpack.security.http.ssl.certificate_authorities: /etc/elasticsearch/certs/ca/ca.crt
xpack.security.transport.ssl.enabled: true
xpack.security.transport.ssl.key: /etc/elasticsearch/certs/elastic2/elastic2.key
xpack.security.transport.ssl.certificate: /etc/elasticsearch/certs/elastic2/elastic2.crt
xpack.security.transport.ssl.certificate_authorities: /etc/elasticsearch/certs/ca/ca.crt
xpack.security.transport.ssl.verification_mode: certificate
xpack.ml.use_auto_machine_memory_percent: true

path.data: /var/lib/elasticsearch
path.logs: /var/log/elasticsearch
network.host: 0.0.0.0
http.host: 0.0.0.0
transport.host: 0.0.0.0
```

### Configuring `JVM` Heap Size

Create a drop-in options file in `/etc/elasticsearch/jvm.options.d/01-memlimit.options` with following contents. Set the heap size to approximate half of physical memory. (e.g. - `512m`, `1g`, `10g`). I'm using a low limit as physical memory on my computer is low.

```
-Xms512m
-Xmx512m
```

## Start the Service

Now start the `elasticsearch` service in all three nodes in sequential order.
i.e. - `elastic0` > `elastic1` > `elastic2`

```bash
systemctl start elasticsearch.service
systemctl enable elasticsearch.service
```

You can check the logs in `/var/log/elasticsearch/elasticdev.log`.

## Reset `elastic` account password

Now log into one of the servers and run the following command:

```bash
/usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic --url https://elastic0:9200
```

It will ask for confirmation, just press `Y` and press `Enter`. Now you will have new password printed into your console.

Now you will be able to access Elasticsearch over API.

## References

1. https://www.elastic.co/guide/en/elasticsearch/reference/current/certutil.html
2. https://www.elastic.co/guide/en/elasticsearch/reference/current/reset-password.html
3. https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/
4. https://www.baeldung.com/openssl-self-signed-cert
