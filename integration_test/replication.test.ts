import { Client } from "pg";

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

describe("handler", () => {
  let client = new Client();
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
  it("should read a wal2json replicated change", async () => {
    await client.query(transaction);
    const result = await client.query(getSlotChanges);

    expect(JSON.parse(result.rows[0].data)).toEqual(
      expect.objectContaining({
        change: [
          {
            columnnames: ["_id", "id", "name", "price", "version", "type"],
            columntypes: ["integer", "text", "text", "numeric", "text", "text"],
            columnvalues: [1, "9", "Gem Visa", 99.99, "v1", "CREDIT_CARD"],
            kind: "insert",
            schema: "public",
            table: "product",
          },
          {
            columnnames: ["_id", "id", "name", "price", "version", "type"],
            columntypes: ["integer", "text", "text", "numeric", "text", "text"],
            columnvalues: [2, "10", "28 Degree", 49.99, "v1", "CREDIT_CARD"],
            kind: "insert",
            schema: "public",
            table: "product",
          },
          {
            columnnames: ["_id", "id", "name", "price", "version", "type"],
            columntypes: ["integer", "text", "text", "numeric", "text", "text"],
            columnvalues: [3, "11", "MyFlexiPay", 16.5, "v2", "PERSONAL_LOAN"],
            kind: "insert",
            schema: "public",
            table: "product",
          },
        ],
      })
    );
  }, 30000);
});
