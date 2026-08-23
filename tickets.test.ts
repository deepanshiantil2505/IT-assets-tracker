import request from "supertest";
import { app } from "../src/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
let employeeToken: string;
let employeeEmail: string;

beforeAll(async () => {
  employeeEmail = `ticket-tester-${Date.now()}@company.com`;
  const res = await request(app).post("/api/auth/register").send({
    name: "Ticket Tester",
    email: employeeEmail,
    password: "Password123!",
  });
  employeeToken = res.body.token;
});

afterAll(async () => {
  await prisma.ticket.deleteMany({ where: { requester: { email: employeeEmail } } });
  await prisma.user.deleteMany({ where: { email: employeeEmail } });
  await prisma.$disconnect();
});

describe("Ticket API", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(401);
  });

  it("lets an employee create a ticket", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ title: "Printer not working", description: "The 3rd floor printer is jammed." });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("OPEN");
  });

  it("only shows the employee their own tickets", async () => {
    const res = await request(app).get("/api/tickets").set("Authorization", `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.items.every((t: any) => t.requester.email === employeeEmail)).toBe(true);
  });

  it("blocks employees from updating ticket status directly", async () => {
    const create = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ title: "VPN not connecting", description: "VPN client fails at 90%." });

    const res = await request(app)
      .patch(`/api/tickets/${create.body.id}`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ status: "CLOSED" });

    expect(res.status).toBe(403);
  });
});
