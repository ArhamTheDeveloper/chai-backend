import request from "supertest";
import { app } from "../app";

describe("Healthcheck API", () => {
  it("should return 200 OK", async () => {
    const res = await request(app).get("/api/v1/healthcheck");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toMatch(/healthy/i);
  });
});

