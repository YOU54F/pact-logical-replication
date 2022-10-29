import pytest
from pact import MessageProvider

# PACT_BROKER_URL = "http://localhost"
# PACT_BROKER_USERNAME = "pactbroker"
# PACT_BROKER_PASSWORD = "pactbroker"
PACT_DIR = "pacts"


@pytest.fixture
def default_opts():
    return {
        # 'broker_username': PACT_BROKER_USERNAME,
        # 'broker_password': PACT_BROKER_PASSWORD,
        # 'broker_url': PACT_BROKER_URL,
        # 'publish_version': '3',
        # 'publish_verification_results': False
    }


def wal2jsonMockListener():
    return {
          "change": [
            {
              "columnnames": ["_id", "id", "name", "price", "version", "type"],
              "columntypes": [
                "integer",
                "text",
                "text",
                "numeric",
                "text",
                "text"
              ],
              "columnvalues": [1, "9", "Gem Visa", 99.99, "v1", "CREDIT_CARD"],
              "kind": "insert",
              "schema": "public",
              "table": "product"
            }
          ]
        }


def test_verify():
    # NOTES
    # pact-js uses pact description for messageProviders
    # pact-python does not use the description
    # pact-js uses pact providerStates for messageProviders
    # pact-python uses pact providerStates for stateHandlers
    # pact-python writes v3 spec but uses v2 matchers
    # pact-js writes v3 spec uses v3 matchers
    provider = MessageProvider(
        message_providers={
            # this is taken from providerStates in the pact file 
            'a wal2json replication slot exists': wal2jsonMockListener,
            # this is taken from description in the pact file
           # 'a valid wal2json change event': print('this is the description in pact-js'),
        },
        provider='wal2JsonProvider',
        # pact-python - consumer name mandatory
        consumer='wal2JsonConsumer_python',
        # only accepts pact_dir not pact_urls
        pact_dir='pacts',
    )
    with provider:
        provider.verify()


# def test_verify_from_broker(default_opts):
#     provider = MessageProvider(
#         message_providers={
#             'A document created successfully': document_created_handler,
#             'A document deleted successfully': document_deleted_handler
#         },
#         provider='ContentProvider',
#         consumer='DetectContentLambda',
#         pact_dir='pacts'

#     )

#     with provider:
#         provider.verify_with_broker(**default_opts)