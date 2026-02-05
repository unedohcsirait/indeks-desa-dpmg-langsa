import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import ExcelJS from 'exceljs';
import { hashPassword, verifyPassword, authMiddleware } from "./auth";

// Constants for Dimensions and Weights
const DIMENSIONS = [
  { id: '1', name: 'Layanan Dasar', weight: 26.77, prefix: '1' },
  { id: '2', name: 'Sosial', weight: 13.39, prefix: '2' },
  { id: '3', name: 'Ekonomi', weight: 25.20, prefix: '3' },
  { id: '4', name: 'Lingkungan', weight: 14.17, prefix: '4' },
  { id: '5', name: 'Aksesibilitas', weight: 7.87, prefix: '5' },
  { id: '6', name: 'Tata Kelola', weight: 12.60, prefix: '6' },
];

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === AUTH ROUTES ===
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByUsername(input.username);

      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const isPasswordValid = await verifyPassword(input.password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Set session
      req.session!.userId = user.id;
      req.session!.username = user.username;

      // Save session explicitly to ensure it's written before response
      req.session!.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
        });
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: err.errors });
      }
      throw err;
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session!.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  app.get(api.auth.me.path, authMiddleware, async (req, res) => {
    const user = await storage.getUserById(req.userId!);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  });

  app.put(api.auth.profile.path, authMiddleware, async (req, res) => {
    try {
      const input = api.auth.profile.input.parse(req.body);
      const user = await storage.getUserById(req.userId!);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if new username already exists (if different)
      if (input.username && input.username !== user.username) {
        const existing = await storage.getUserByUsername(input.username);
        if (existing) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }

      // Check if new email already exists (if different)
      if (input.email) {
        const existing = await storage.getUserByEmail(input.email);
        if (existing && existing.id !== user.id) {
          return res.status(400).json({ message: "Email already taken" });
        }
      }

      const updates: any = {};
      if (input.username) updates.username = input.username;
      if (input.email) updates.email = input.email;
      if (input.password) {
        updates.passwordHash = await hashPassword(input.password);
      }

      const updated = await storage.updateUser(req.userId!, updates);

      res.json({
        id: updated.id,
        username: updated.username,
        email: updated.email,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: err.errors });
      }
      throw err;
    }
  });

  // === VILLAGES ===
  app.get(api.villages.list.path, authMiddleware, async (req, res) => {
    const search = req.query.search as string | undefined;
    const result = await storage.getVillages(search);
    res.json(result);
  });

  app.get(api.villages.get.path, authMiddleware, async (req, res) => {
    const result = await storage.getVillage(Number(req.params.id));
    if (!result) return res.status(404).json({ message: "Village not found" });
    res.json(result);
  });

  app.post(api.villages.create.path, authMiddleware, async (req, res) => {
    try {
      const input = api.villages.create.input.parse(req.body);
      const result = await storage.createVillage(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  app.put(api.villages.update.path, authMiddleware, async (req, res) => {
    try {
      const input = api.villages.update.input.parse(req.body);
      const result = await storage.updateVillage(Number(req.params.id), input);
      if (!result) return res.status(404).json({ message: "Village not found" });
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.message });
      throw err;
    }
  });

  app.delete(api.villages.delete.path, authMiddleware, async (req, res) => {
    await storage.deleteVillage(Number(req.params.id));
    res.status(204).send();
  });

  // === ASSESSMENTS ===
  app.get(api.assessments.list.path, authMiddleware, async (req, res) => {
    const villageId = req.query.villageId ? Number(req.query.villageId) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const result = await storage.getAssessments(villageId, year);
    res.json(result);
  });

  app.get(api.assessments.get.path, authMiddleware, async (req, res) => {
    const result = await storage.getAssessment(Number(req.params.id));
    if (!result) return res.status(404).json({ message: "Assessment not found" });
    res.json(result);
  });

  app.post(api.assessments.create.path, authMiddleware, async (req, res) => {
    try {
      const input = api.assessments.create.input.parse(req.body);
      const result = await storage.createAssessment(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.message });
      throw err;
    }
  });

  app.put(api.assessments.updateValues.path, authMiddleware, async (req, res) => {
    try {
      const input = api.assessments.updateValues.input.parse(req.body);
      await storage.bulkUpdateAssessmentValues(Number(req.params.id), input.values);
      res.status(200).send();
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.message });
      throw err;
    }
  });

  app.post(api.assessments.calculate.path, authMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    const assessment = await storage.getAssessment(id);
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });

    const values = assessment.values;
    const dimensionScores: Record<string, number> = {};
    let totalScore = 0;

    // Calculate score per dimension
    for (const dim of DIMENSIONS) {
      const dbDim = (await storage.getDimensions()).find(d => d.code === dim.id);
      const dimWeight = dbDim ? parseFloat(dbDim.weight) : dim.weight;
      const dimName = dbDim ? dbDim.name : dim.name;

      const dimValues = values.filter(v => v.indicatorCode.startsWith(dim.prefix));
      if (dimValues.length === 0) {
        dimensionScores[dimName] = 0;
        continue;
      }
      
      // Calculate by unique indicators + aspects
      const sum = dimValues.reduce((acc, curr) => acc + curr.value, 0);
      const totalPossible = dimValues.length * 5;
      const normalizedAvg = (sum / totalPossible) * 100;

      dimensionScores[dimName] = normalizedAvg;
      
      // Add weighted score to total
      totalScore += (normalizedAvg * dimWeight) / 100;
    }

    // Determine status
    let status = "";
    if (totalScore < 30) status = "Sangat Tertinggal";
    else if (totalScore < 50) status = "Tertinggal";
    else if (totalScore < 70) status = "Berkembang";
    else if (totalScore < 90) status = "Maju";
    else status = "Mandiri";

    const updated = await storage.updateAssessment(id, {
      totalScore: totalScore.toFixed(2) as any,
      dimensionScores,
      status
    });

    res.json(updated);
  });

  app.get(api.assessments.exportBulk.path, authMiddleware, async (req, res) => {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const assessments = await storage.getAssessments(undefined, year);
    const dbDimensions = await storage.getDimensions();
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Indeks Desa ${year || 'Semua Tahun'}`);

    // Headers based on the provided image
    sheet.columns = [
      { header: 'NO', key: 'no', width: 5 },
      { header: 'TAHUN', key: 'year', width: 8 },
      { header: 'KODE PROV', key: 'kode_prov', width: 12 },
      { header: 'NAMA PROVINSI', key: 'provinsi', width: 15 },
      { header: 'KODE KAB', key: 'kode_kab', width: 12 },
      { header: 'NAMA KABUPATEN', key: 'kabupaten', width: 20 },
      { header: 'KODE KEC', key: 'kode_kec', width: 12 },
      { header: 'NAMA KECAMATAN', key: 'kecamatan', width: 20 },
      { header: 'KODE DESA', key: 'kode_desa', width: 15 },
      { header: 'NAMA DESA', key: 'desa', width: 25 },
      { header: 'DLD', key: 'dld', width: 10 },
      { header: 'DS', key: 'ds', width: 10 },
      { header: 'DE', key: 'de', width: 10 },
      { header: 'DL', key: 'dl', width: 10 },
      { header: 'DA', key: 'da', width: 10 },
      { header: 'DTPD', key: 'dtpd', width: 10 },
      { header: 'BOBOT SKOR', key: 'skor', width: 12 },
      { header: 'STATUS DESA', key: 'status', width: 20 },
    ];

    // Styling headers
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    assessments.forEach((a, index) => {
      sheet.addRow({
        no: index + 1,
        year: a.year,
        kode_prov: a.village.provinceCode || '-',
        provinsi: a.village.province,
        kode_kab: a.village.regencyCode || '-',
        kabupaten: a.village.regency,
        kode_kec: a.village.districtCode || '-',
        kecamatan: a.village.district,
        kode_desa: a.village.code || '-',
        desa: a.village.name,
        dld: a.dimensionScores?.[dbDimensions.find(d => d.code === '1')?.name || 'Layanan Dasar'] ? `${Number(a.dimensionScores[dbDimensions.find(d => d.code === '1')?.name || 'Layanan Dasar']).toFixed(2)}%` : '-',
        ds: a.dimensionScores?.[dbDimensions.find(d => d.code === '2')?.name || 'Sosial'] ? `${Number(a.dimensionScores[dbDimensions.find(d => d.code === '2')?.name || 'Sosial']).toFixed(2)}%` : '-',
        de: a.dimensionScores?.[dbDimensions.find(d => d.code === '3')?.name || 'Ekonomi'] ? `${Number(a.dimensionScores[dbDimensions.find(d => d.code === '3')?.name || 'Ekonomi']).toFixed(2)}%` : '-',
        dl: a.dimensionScores?.[dbDimensions.find(d => d.code === '4')?.name || 'Lingkungan'] ? `${Number(a.dimensionScores[dbDimensions.find(d => d.code === '4')?.name || 'Lingkungan']).toFixed(2)}%` : '-',
        da: a.dimensionScores?.[dbDimensions.find(d => d.code === '5')?.name || 'Aksesibilitas'] ? `${Number(a.dimensionScores[dbDimensions.find(d => d.code === '5')?.name || 'Aksesibilitas']).toFixed(2)}%` : '-',
        dtpd: a.dimensionScores?.[dbDimensions.find(d => d.code === '6')?.name || 'Tata Kelola'] ? `${Number(a.dimensionScores[dbDimensions.find(d => d.code === '6')?.name || 'Tata Kelola']).toFixed(2)}%` : '-',
        skor: a.totalScore ? `${Number(a.totalScore).toFixed(2)}%` : '-',
        status: a.status || '-',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Rekap-IndeksDesa-${year || 'Semua'}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  });

  app.get(api.assessments.export.path, authMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    const assessment = await storage.getAssessment(id);
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Hasil Indeks Desa');

    sheet.columns = [
      { header: 'Item', key: 'item', width: 30 },
      { header: 'Value', key: 'value', width: 30 },
    ];

    sheet.addRow({ item: 'Desa', value: assessment.village.name });
    sheet.addRow({ item: 'Tahun', value: assessment.year });
    sheet.addRow({ item: 'Status', value: assessment.status });
    sheet.addRow({ item: 'Total Skor', value: assessment.totalScore });
    sheet.addRow({});
    sheet.addRow({ item: 'Dimensi', value: 'Skor' });
    
    if (assessment.dimensionScores) {
      Object.entries(assessment.dimensionScores).forEach(([key, val]) => {
        sheet.addRow({ item: key, value: Number(val).toFixed(2) });
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=IndeksDesa-${assessment.village.name}-${assessment.year}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  });

  app.delete(api.assessments.delete.path, authMiddleware, async (req, res) => {
    await storage.deleteAssessment(Number(req.params.id));
    res.status(204).send();
  });

  // === INDICATOR MANAGEMENT ROUTES ===

  // Dimension Routes
  app.get("/api/indicators/dimensions", authMiddleware, async (req, res) => {
    const dimensions = await storage.getDimensions();
    res.json(dimensions);
  });

  app.get("/api/indicators/dimensions/:id", authMiddleware, async (req, res) => {
    const dimension = await storage.getDimension(Number(req.params.id));
    if (!dimension) {
      return res.status(404).json({ message: "Dimension not found" });
    }
    res.json(dimension);
  });

  app.post("/api/indicators/dimensions", authMiddleware, async (req, res) => {
    try {
      const input = req.body;
      const dimension = await storage.createDimension({
        code: input.code,
        name: input.name,
        weight: input.weight,
        description: input.description,
        color: input.color,
      });
      res.status(201).json(dimension);
    } catch (error) {
      res.status(400).json({ message: "Failed to create dimension" });
    }
  });

  app.put("/api/indicators/dimensions/:id", authMiddleware, async (req, res) => {
    try {
      const input = req.body;
      const dimension = await storage.updateDimension(Number(req.params.id), {
        code: input.code,
        name: input.name,
        weight: input.weight,
        description: input.description,
        color: input.color,
      });
      res.json(dimension);
    } catch (error) {
      res.status(400).json({ message: "Failed to update dimension" });
    }
  });

  app.delete("/api/indicators/dimensions/:id", authMiddleware, async (req, res) => {
    await storage.deleteDimension(Number(req.params.id));
    res.status(204).send();
  });

  // SubDimension Routes
  app.get("/api/indicators/sub-dimensions", authMiddleware, async (req, res) => {
    const subDimensions = await storage.getSubDimensions();
    res.json(subDimensions);
  });

  app.get("/api/indicators/sub-dimensions/:id", authMiddleware, async (req, res) => {
    const subDimension = await storage.getSubDimension(Number(req.params.id));
    if (!subDimension) {
      return res.status(404).json({ message: "Sub-Dimension not found" });
    }
    res.json(subDimension);
  });

  app.post("/api/indicators/sub-dimensions", authMiddleware, async (req, res) => {
    try {
      const input = req.body;
      const subDimension = await storage.createSubDimension({
        code: input.code,
        name: input.name,
        dimensionId: input.dimensionId,
        description: input.description,
      });
      res.status(201).json(subDimension);
    } catch (error) {
      res.status(400).json({ message: "Failed to create sub-dimension" });
    }
  });

  app.put("/api/indicators/sub-dimensions/:id", authMiddleware, async (req, res) => {
    try {
      const input = req.body;
      const subDimension = await storage.updateSubDimension(Number(req.params.id), {
        code: input.code,
        name: input.name,
        dimensionId: input.dimensionId,
        description: input.description,
      });
      res.json(subDimension);
    } catch (error) {
      res.status(400).json({ message: "Failed to update sub-dimension" });
    }
  });

  app.delete("/api/indicators/sub-dimensions/:id", authMiddleware, async (req, res) => {
    await storage.deleteSubDimension(Number(req.params.id));
    res.status(204).send();
  });

  // Indicator Routes
  app.get("/api/indicators/indicators", authMiddleware, async (req, res) => {
    const indicators = await storage.getIndicators();
    res.json(indicators);
  });

  app.get("/api/indicators/indicators/:id", authMiddleware, async (req, res) => {
    const indicator = await storage.getIndicator(Number(req.params.id));
    if (!indicator) {
      return res.status(404).json({ message: "Indicator not found" });
    }
    res.json(indicator);
  });

  app.post("/api/indicators/indicators", authMiddleware, async (req, res) => {
    try {
      const input = req.body;
      const indicator = await storage.createIndicator({
        code: input.code,
        name: input.name,
        subDimensionId: input.subDimensionId,
        description: input.description,
        scoreValues: input.scoreValues || [1, 3, 5],
      });
      res.status(201).json(indicator);
    } catch (error) {
      res.status(400).json({ message: "Failed to create indicator" });
    }
  });

  app.put("/api/indicators/indicators/:id", authMiddleware, async (req, res) => {
    try {
      const input = req.body;
      const indicator = await storage.updateIndicator(Number(req.params.id), {
        code: input.code,
        name: input.name,
        subDimensionId: input.subDimensionId,
        description: input.description,
        scoreValues: input.scoreValues,
      });
      res.json(indicator);
    } catch (error) {
      res.status(400).json({ message: "Failed to update indicator" });
    }
  });

  app.delete("/api/indicators/indicators/:id", authMiddleware, async (req, res) => {
    await storage.deleteIndicator(Number(req.params.id));
    res.status(204).send();
  });

  // IndicatorAspect Routes
  app.get("/api/indicators/aspects", authMiddleware, async (req, res) => {
    const aspects = await storage.getIndicatorAspects();
    res.json(aspects);
  });

  app.get("/api/indicators/aspects/:id", authMiddleware, async (req, res) => {
    const aspect = await storage.getIndicatorAspect(Number(req.params.id));
    if (!aspect) {
      return res.status(404).json({ message: "Aspect not found" });
    }
    res.json(aspect);
  });

  app.post("/api/indicators/aspects", authMiddleware, async (req, res) => {
    try {
      const input = req.body;
      const aspect = await storage.createIndicatorAspect({
        code: input.code,
        name: input.name,
        indicatorId: input.indicatorId,
        aspect: input.aspect,
        scoreValues: input.scoreValues || [1, 3, 5],
      });
      res.status(201).json(aspect);
    } catch (error) {
      res.status(400).json({ message: "Failed to create aspect" });
    }
  });

  app.put("/api/indicators/aspects/:id", authMiddleware, async (req, res) => {
    try {
      const input = req.body;
      const aspect = await storage.updateIndicatorAspect(Number(req.params.id), {
        code: input.code,
        name: input.name,
        indicatorId: input.indicatorId,
        aspect: input.aspect,
        scoreValues: input.scoreValues,
      });
      res.json(aspect);
    } catch (error) {
      res.status(400).json({ message: "Failed to update aspect" });
    }
  });

  app.delete("/api/indicators/aspects/:id", authMiddleware, async (req, res) => {
    await storage.deleteIndicatorAspect(Number(req.params.id));
    res.status(204).send();
  });

  // Seed Data
  await seedDatabase();
  await seedIndicators();

  return httpServer;
}

async function seedIndicators() {
  const existingDimensions = await storage.getDimensions();
  if (existingDimensions.length === 0) {
    console.log("Seeding indicators...");
    const { DIMENSIONS } = await import("../client/src/lib/indicators");
    
    for (const dim of DIMENSIONS) {
      const newDim = await storage.createDimension({
        code: dim.id.toString(),
        name: dim.name,
        weight: dim.weight.toString(),
        color: dim.color,
      });

      for (const sub of dim.subDimensions) {
        const newSub = await storage.createSubDimension({
          code: sub.id,
          name: sub.name,
          dimensionId: newDim.id,
        });

        for (const ind of sub.indicators) {
          const newInd = await storage.createIndicator({
            code: ind.code,
            name: ind.name,
            subDimensionId: newSub.id,
            description: ind.description,
            scoreValues: [1, 2, 3, 4, 5],
          });

          if (ind.aspects) {
            for (let i = 0; i < ind.aspects.length; i++) {
              await storage.createIndicatorAspect({
                code: `${ind.code}.${i + 1}`,
                name: ind.aspects[i],
                indicatorId: newInd.id,
                aspect: ind.aspects[i],
                scoreValues: [1, 2, 3, 4, 5],
              });
            }
          }
        }
      }
    }
    console.log("Indicators seeded!");
  }
}

async function seedDatabase() {
  const existingVillages = await storage.getVillages();
  if (existingVillages.length === 0) {
    console.log("Seeding database...");
    const village = await storage.createVillage({
      name: "Desa Contoh",
      district: "Kecamatan Maju",
      regency: "Kabupaten Sejahtera",
      province: "Jawa Barat",
    });

    const assessment = await storage.createAssessment({
      villageId: village.id,
      year: 2024,
    });

    // Seed some initial values for dimension 1
    const initialValues = [
      { indicatorCode: '1.1.1', value: 3 },
      { indicatorCode: '1.1.2', value: 4 },
      { indicatorCode: '1.2.1', value: 5 },
    ];
    await storage.bulkUpdateAssessmentValues(assessment.id, initialValues);
    console.log("Database seeded!");
  }
}
