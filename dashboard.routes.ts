import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { authorize } from "../middleware/authorize";

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth, authorize("ADMIN", "AGENT"));

// Aggregated metrics for the dashboard charts.
router.get("/summary", async (_req, res) => {
  const [ticketsByStatus, ticketsByPriority, assetsByStatus, totalAssets, openTickets] = await Promise.all([
    prisma.ticket.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.ticket.groupBy({ by: ["priority"], _count: { priority: true } }),
    prisma.asset.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.asset.count(),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
  ]);

  // Average resolution time (in hours) for resolved/closed tickets.
  const resolved = await prisma.ticket.findMany({
    where: { resolvedAt: { not: null } },
    select: { createdAt: true, resolvedAt: true },
  });
  const avgResolutionHours =
    resolved.length === 0
      ? 0
      : resolved.reduce((sum, t) => sum + (t.resolvedAt!.getTime() - t.createdAt.getTime()) / 36e5, 0) / resolved.length;

  res.json({
    ticketsByStatus: ticketsByStatus.map((r) => ({ status: r.status, count: r._count.status })),
    ticketsByPriority: ticketsByPriority.map((r) => ({ priority: r.priority, count: r._count.priority })),
    assetsByStatus: assetsByStatus.map((r) => ({ status: r.status, count: r._count.status })),
    totalAssets,
    openTickets,
    avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
  });
});

export default router;
