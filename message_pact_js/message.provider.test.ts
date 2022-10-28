const path = require("path");
const { MessageProviderPact } = require("@pact-foundation/pact");

// our client code
import { Client } from "pg";
let client = new Client();

const createTableWithPk = `CREATE TABLE product
  (
      _id SERIAL PRIMARY KEY,
      id TEXT NOT NULL,
      name TEXT NOT NULL,
      price numeric,
      version TEXT NULL,
      type TEXT NULL
  );`;
const createReplicationSlotWal2Json =
  "SELECT 'init' FROM pg_create_logical_replication_slot('test_slot', 'wal2json');";
const transaction = `BEGIN;
INSERT INTO product (id,name, price, version, type) VALUES(09,'Gem Visa', '99.99', 'v1' ,'CREDIT_CARD');
INSERT INTO product (id,name, price, version, type) VALUES(10,'28 Degree', '49.99', 'v1' ,'CREDIT_CARD');
INSERT INTO product (id,name, price, version, type) VALUES(11,'MyFlexiPay', '16.5', 'v2' ,'PERSONAL_LOAN');
COMMIT;`;
const getSlotChanges =
  "SELECT data FROM pg_logical_slot_get_changes('test_slot', NULL, NULL, 'pretty-print', '1');";
const stopReplicationSlotWal2Json =
  "SELECT 'stop' FROM pg_drop_replication_slot('test_slot');";
const dropTableWithPk = "DROP TABLE product CASCADE;";

//


// 1 Messaging integration client
const wal2jsonListener = {
  createChange: () => {
    return new Promise((resolve) => {
      resolve({
        change: [
          {
            columnnames: ["_id", "id", "name", "price", "version", "type"],
            columntypes: ["integer", "text", "text", "numeric", "text", "text"],
            columnvalues: [243, "9", "Gem Visa", 99.99, "v1", "CREDIT_CARD"],
            kind: "insert",
            schema: "public",
            table: "product"
          },
          // {
          //   // renaming a key throws an error
          //   column_names: ["_id", "id", "name", "price", "version", "type"],
          //   columntypes: ["integer", "text", "text", "numeric", "text", "text"],
          //   columnvalues: [1, "9", "Gem Visa", 99.99, "v1", "CREDIT_CARD"],
          //   // changing the type of an attribute inside column values correctly fails
          //   // columnvalues: ["1", "9", "Gem Visa", 99.99, "v1", "CREDIT_CARD"],
          //   kind: "insert",
          //   // changing the type of a key will throw an error
          //   // kind: ["insert"],
          //   schema: "public",
          //   table: "product"
          // },
          // // wouldnt expect this to pass
          // {
          //   columnnames: [],
          //   columntypes: [],
          //   columnvalues: [],
          //   kind: "",
          //   schema: "",
          //   table: ""
          // }
        ],
        // change: [], // this should fail but doesnt
        // change: [{}], // this correctly fails with no keys
        xid:'fpp'
      });
    });
  },
  createRealChange: async () => {
    await client.query(transaction);
    const result = await client.query(getSlotChanges);

    return new Promise((resolve) => {
      resolve(JSON.parse(result.rows[0].data));
    });
  }
  
};

describe("Message provider tests", () => {


  // provider setup
  beforeAll(async () => {
    await client.connect().catch((err) => {
      throw new Error(err);
    });

    await client.query(createTableWithPk).catch((err) => console.log(err));
    await client
      .query(createReplicationSlotWal2Json)
      .catch((err) => console.log(err));
  });

  afterAll(async () => {
    await client
      .query(stopReplicationSlotWal2Json)
      .catch((err) => console.log(err));
    await client.query(dropTableWithPk).catch((err) => console.log(err));
    client.end();
  });

    // 2 Pact setup
    const p = new MessageProviderPact({
      messageProviders: {
        "a valid wal2json change event": () => wal2jsonListener.createRealChange()
      },
      provider: "wal2JsonProvider",
      providerVersion: "1.0.0",
      pactUrls: [
        process.env.PACT_URL ?? path.resolve(
          process.cwd(),
          "pacts",
          "wal2JsonConsumer_js-wal2JsonProvider.json"
        )
      ]
    });

  // 3 Verify the interactions
  describe("wal2Json output plugin", () => {
    it("sends a wal2json change", () => {
      return p.verify();
    });
  });
});
