import os

import pytest as pytest
from pact import EachLike, Like, MessageConsumer, Provider, Term

# Actual message handler, doesn't care about SNS at all!
async def receive_product_update(wal2json_event):
    if not wal2json_event['xid'] or wal2json_event['change']:
        return 'missing fields'
    return "do something"

CONSUMER_NAME = "pactflow-example-consumer-python-sns"
PROVIDER_NAME = "pactflow-example-provider-js-sns"
PACT_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)),"..","..", "pacts")

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
        "xid": Like("some-uuid-1234-5678"),
        "change": EachLike(["some-uuid-1234-5678"]),
        "event": Term(matcher="^(CREATED|UPDATED|DELETED)$", generate="UPDATED")
    }
    (
        pact
        .expects_to_receive("a product event update")
        .with_content(event)
        .with_metadata({"Content-Type": "application/json", 'topic': 'products'})
    )

    with pact:
        await consumer(event)