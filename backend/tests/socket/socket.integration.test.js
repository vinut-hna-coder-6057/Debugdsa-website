import request from "supertest";
import { io as Client } from "socket.io-client";

import app from "../../app.js";
import { server } from "../../server.js";

import User from "../../models/User.js";
import Battle from "../../models/battle.js";

import {
  connectDB,
  clearDB,
  closeDB
} from "../setup/mongoSetup.js";

beforeAll(async () => {

  await connectDB();

  await new Promise(resolve =>
    server.listen(5001, resolve)
  );

});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {

  await closeDB();

  await new Promise(resolve =>
    server.close(resolve)
  );

});

test(
  "socket client connects",
  done => {

    const client =
      Client("http://localhost:5001");

    client.on("connect", () => {

      expect(client.connected)
        .toBe(true);

      client.disconnect();

      done();

    });

  },
  10000
);