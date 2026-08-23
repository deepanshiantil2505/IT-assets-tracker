import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { authorize } from "../middleware/authorize";

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

const assetSchema = z.object({
  assetTag: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  serialNumber: z.string().optional(),
  status: z.enum(["IN_USE", "IN_STORAGE", "IN_REPAIR", "RETIRED"]).optional(),
  purchaseDate: z.string().datetime().optional(),
  ownerId: z.number().int().optional(),
});

// GET /assets?status=&category=&search=&page=&pageSize=
router.get("/", async (req, res) => {
  const { status, category, search, page = "1", pageSize = "20" } = req.query as Record<string, string>;
  const take = Math.min(parseInt(pageSize) || 20, 100);
  const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

  const where: any = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { assetTag: { contains: search } },
      { serialNumber: { contains: search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.asset.findMany({ where, take, skip, orderBy: { createdAt: "desc" }, include: { owner: true } }),
    prisma.asset.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), pageSize: take });
});

router.get("/:id", async (req, res) => {
  const asset = await prisma.asset.findUnique({
    where: { id: Number(req.params.id) },
    include: { owner: true, tickets: true },
  });
  if (!asset) return res.status(404).json({ error: "Asset not found" });
  res.json(asset);
});

router.post("/", authorize("ADMIN", "AGENT"), async (req, res) => {
  const parsed = assetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const data = parsed.data;
  const asset = await prisma.asset.create({
    data: {
      assetTag: data.assetTag,
      name: data.name,
      category: data.category,
      serialNumber: data.serialNumber,
      status: data.status ?? "IN_STORAGE",
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      ownerId: data.ownerId,
    },
  });
  res.status(201).json(asset);
});

router.put("/:id", authorize("ADMIN", "AGENT"), async (req, res) => {
  const parsed = assetSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  try {
    const asset = await prisma.asset.update({
      where: { id: Number(req.params.id) },
      data: {
        ...parsed.data,
        purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : undefined,
      },
    });
    res.json(asset);
  } catch {
    res.status(404).json({ error: "Asset not found" });
  }
});

router.delete("/:id", authorize("ADMIN"), async (req: AuthRequest, res) => {
  try {
    await prisma.asset.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Asset not found" });
  }
});

export default router;
