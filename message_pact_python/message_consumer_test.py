import os
import logging

LOGGER = logging.getLogger('__name__')


import pytest as pytest
from pact import EachLike, Like, MessageConsumer, Provider, Term
from pact.matchers import from_term, get_generated_values

# Actual message handler, doesn't care about SNS at all!
async def receive_product_update(wal2json_event):
    # https://github.com/pact-foundation/pact-python/pull/313
    # This change needs merging, payload isnt reifed before it is sent to consumer
    LOGGER.warning(get_generated_values(wal2json_event))
    wal2json_event = get_generated_values(wal2json_event)
    if not wal2json_event['change']:
    # if not wal2json_event['xid'] or wal2json_event['change']:
        return 'missing fields'
    return "do something"

CONSUMER_NAME = "wal2JsonConsumer_python"
PROVIDER_NAME = "wal2JsonProvider"
PACT_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), "pacts")
@pytest.fixture(scope="session")
def consumer():
    return receive_product_update


@pytest.fixture(scope="session")
def pact():
    pact = MessageConsumer(
        CONSUMER_NAME,
    ).has_pact_with(
        Provider(PROVIDER_NAME),
        pact_dir=PACT_DIR,
    )

    yield pact

@pytest.mark.asyncio
async def test_receive_a_product_update(pact, consumer):
    event = {
          "change": EachLike(
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
              "kind": Term(matcher="^(delete|update|insert)$", generate="insert"),
              "schema": "public",
              "table": "product"
            }
          )
        }
    
    (
        pact
        .given("a wal2json replication slot exists")
        .expects_to_receive("a valid wal2json change event")
        .with_content(event)
        .with_metadata({"Content-Type": "application/json"})
    )

    with pact:
        await consumer(event)
        print(PACT_DIR)
