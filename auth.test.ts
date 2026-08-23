import request from "supertest";
import { app } from "../src/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Auth API", () => {
  const testEmail = `test-${Date.now()}@company.com`;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it("registers a new employee and returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: testEmail,
      password: "Password123!",
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("EMPLOYEE");
  });

  it("rejects duplicate registration", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: testEmail,
      password: "Password123!",
    });
    expect(res.status).toBe(409);
  });

  it("rejects login with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: "WrongPassword",
    });
    expect(res.status).toBe(401);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: "Password123!",
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
