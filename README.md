To setup cassandra with docker:
	docker pull cassandra
	docker run --name cass-db -p 127.0.0.1:9042:9042 -p 127.0.0.1:9160:9160   -d cassandra