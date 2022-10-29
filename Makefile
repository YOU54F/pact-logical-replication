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
	cd message_pact_python && pytest -o log_cli=true message_consumer_test.py

test_pact_python_provider:
	cd message_pact_python && pytest message_provider_test.py

verify_pact_python_consumer:
	PACT_URL=${PWD}/message_pact_python/pacts/wal2jsonconsumer_python-wal2jsonprovider.json make test_pact_js_provider

install_pact_ruby:
	cd message_pact_ruby && bundle install

test_pact_ruby_consumer:
	cd message_pact_ruby && bundle exec rspec

test_pact_ruby_provider:
	cd message_pact_ruby && bundle exec rake pact:verify

test_pact_net_consumer:
	cd message_pact_net && dotnet test Consumer.Tests

test_pact_net_provider:
	cd message_pact_net && dotnet test Provider.Tests

test_pact_java_consumer:
	cd message_pact_java/consumer && ./gradlew clean test -i

test_pact_java_provider:
	cd message_pact_java/provider && ./gradlew clean test -i

install: install_integration install_pact_js install_pact_python install_pact_ruby
test: test_integration test_pact_js_consumer test_pact_js_provider test_pact_python_consumer test_pact_python_provider test_pact_ruby_consumer test_pact_ruby_provider test_pact_net_consumer test_pact_net_provider
