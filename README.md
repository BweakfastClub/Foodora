To setup cassandra with docker:
```bash
docker pull cassandra
docker run --name cass-db -p 127.0.0.1:9042:9042 -p 127.0.0.1:9160:9160 -d cassandra
```

To setup mongo with docker:
```bash
docker pull mongo
docker run --name mongodb -p 127.0.0.1:27017:27017 -d mongo
```
