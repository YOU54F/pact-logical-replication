const path = require("path");
const {
  MessageConsumerPact,
  synchronousBodyHandler,
  MatchersV3
} = require("@pact-foundation/pact");


const { eachLike } = MatchersV3;

export enum Wal2JsonChangeKind {
  Update = "update",
  Insert = "insert",
  Delete = "delete"
}

export interface Wal2JsonBase {
  kind: Wal2JsonChangeKind;
  table: string;
  schema: string;
}

export interface Wal2JsonColumns {
  columnnames: string[];
  columnvalues: any[];
  columntypes: string[];
}

interface Wal2JsonOldKeys {
  oldkeys: {
    keytypes: string[];
    keyvalues: any[];
    keynames: string[];
  };
}

export interface Wal2JsonInsert extends Wal2JsonBase, Wal2JsonColumns {}

export interface Wal2JsonUpdate extends Wal2JsonBase, Wal2JsonColumns {}

export interface Wal2JsonDelete extends Wal2JsonBase, Wal2JsonOldKeys {}

export type Wal2JsonChange = Wal2JsonUpdate | Wal2JsonInsert | Wal2JsonDelete;

export interface Wal2JsonEvent {
  xid?: number;
  change: Wal2JsonChange[];
}


// 1 wal2Json change event Handler
const wal2JsonHandler = function (wal2JsonEvent: Wal2JsonEvent) {
  // if (!wal2JsonEvent.xid || !wal2JsonEvent.change) {
  if (!wal2JsonEvent.change) {
    console.log(wal2JsonEvent);
    throw new Error("missing change data");
  }

  // do some other things to the event...
  // like sending it to Kinesis Firehose
  // e.g. wal2JsonEventStreamer.send(wal2JsonEvent)
  // It could get picked up by a lambda transformer to
  // transform into business intelligence logic, or enriched
  // and sent to its final location - uploaded as a csv to a bucket
  return;
};

// 2 Pact Message Consumer
const messagePact = new MessageConsumerPact({
  consumer: "wal2JsonConsumer_js",
  dir: path.resolve(process.cwd(), "pacts"),
  pactfileWriteMode: "update",
  provider: "wal2JsonProvider"
});

describe("receive wal2json event", () => {
  it("accepts a valid wal2json event", () => {
    // 3 Consumer expectations
    return (
      messagePact
        .given("a wal2json replication slot exists")
        .expectsToReceive("a valid wal2json change event")
        .withContent({
          // xid: like("bar"),
          change: eachLike(
            {
              columnnames: ["_id", "id", "name", "price", "version", "type"],
              columntypes: [
                "integer",
                "text",
                "text",
                "numeric",
                "text",
                "text"
              ],
              columnvalues: [1, "9", "Gem Visa", 99.99, "v1", "CREDIT_CARD"],
              kind: "insert",
              schema: "public",
              table: "product"
            }
          )
        })
        // 4 Verify consumers' ability to handle messages
        .verify(synchronousBodyHandler(wal2JsonHandler))
    );
  });
});
