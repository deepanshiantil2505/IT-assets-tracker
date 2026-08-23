import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { authorize } from "../middleware/authorize";

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

const createTicketSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assetId: z.number().int().optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assigneeId: z.number().int().nullable().optional(),
});

// Employees see their own tickets; agents/admins see all (optionally filtered).
router.get("/", async (req: AuthRequest, res) => {
  const { status, priority, assignedToMe, page = "1", pageSize = "20" } = req.query as Record<string, string>;
  const take = Math.min(parseInt(pageSize) || 20, 100);
  const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

  const where: any = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;

  if (req.user!.role === "EMPLOYEE") {
    where.requesterId = req.user!.userId;
  } else if (assignedToMe === "true") {
    where.assigneeId = req.user!.userId;
  }

  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: { requester: true, assignee: true, asset: true },
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), pageSize: take });
});

router.get("/:id", async (req: AuthRequest, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: Number(req.params.id) },
    include: { requester: true, assignee: true, asset: true, comments: { include: { author: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  if (req.user!.role === "EMPLOYEE" && ticket.requesterId !== req.user!.userId) {
    return res.status(403).json({ error: "You can only view your own tickets" });
  }
  res.json(ticket);
});

router.post("/", async (req: AuthRequest, res) => {
  const parsed = createTicketSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const ticket = await prisma.ticket.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority ?? "MEDIUM",
      assetId: parsed.data.assetId,
      requesterId: req.user!.userId,
    },
  });
  res.status(201).json(ticket);
});

// Agents/admins update status, priority, and assignment.
router.patch("/:id", authorize("ADMIN", "AGENT"), async (req, res) => {
  const parsed = updateTicketSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const data: any = { ...parsed.data };
  if (data.status === "RESOLVED" || data.status === "CLOSED") {
    data.resolvedAt = new Date();
  }

  try {
    const ticket = await prisma.ticket.update({ where: { id: Number(req.params.id) }, data });
    res.json(ticket);
  } catch {
    res.status(404).json({ error: "Ticket not found" });
  }
});

router.post("/:id/comments", async (req: AuthRequest, res) => {
  const bodySchema = z.object({ body: z.string().min(1) });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Comment cannot be empty" });

  const ticket = await prisma.ticket.findUnique({ where: { id: Number(req.params.id) } });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  if (req.user!.role === "EMPLOYEE" && ticket.requesterId !== req.user!.userId) {
    return res.status(403).json({ error: "You can only comment on your own tickets" });
  }

  const comment = await prisma.comment.create({
    data: { body: parsed.data.body, ticketId: ticket.id, authorId: req.user!.userId },
    include: { author: true },
  });
  res.status(201).json(comment);
});

export default router;
