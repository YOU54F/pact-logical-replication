docker_pg:
	docker-compose up -d postgres

docker_pg_down:
	docker-compose down postgres

docker_pg_alpine:
	docker-compose up -d postgres_alpine

test_integration:
	cd integration_test && npm test

install_integration:
	cd integration_test && npm install
	
install_pact_js:
	cd message_pact_js && npm install

test_pact_js_consumer:
	cd message_pact_js && npm run test:consumer
	
test_pact_js_provider:
	cd message_pact_js && npm run test:provider
	
install_pact_python:
	cd message_pact_python && pip install -r requirements.txt

test_pact_python_consumer:
	cd message_pact_python && pytest pact_test.py

verify_pact_python_consumer:
	PACT_URL=${PWD}/message_pact_python/pacts/wal2jsonconsumer_python-wal2jsonprovider.json make test_pact_js_provider