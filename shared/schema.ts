import { pgTable, text, serial, integer, numeric, jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const villages = pgTable("villages", {
  id: serial("id").primaryKey(),
  code: text("code"), // Kode Desa
  name: text("name").notNull(),
  district: text("district").notNull(), // Kecamatan
  districtCode: text("district_code"),  // Kode Kec
  regency: text("regency").notNull(),   // Kabupaten/Kota
  regencyCode: text("regency_code"),    // Kode Kab
  province: text("province").notNull(),
  provinceCode: text("province_code"),  // Kode Prov
  createdAt: timestamp("created_at").defaultNow(),
});

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  villageId: integer("village_id").notNull(),
  year: integer("year").notNull(),
  status: text("status"), // Sangat Tertinggal, Tertinggal, Berkembang, Maju, Mandiri
  totalScore: numeric("total_score", { precision: 5, scale: 2 }), // 0-100
  dimensionScores: jsonb("dimension_scores").$type<Record<string, number>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assessmentValues = pgTable("assessment_values", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  indicatorCode: text("indicator_code").notNull(), // e.g., '1.1.1'
  aspect: text("aspect"), // New: To store separated evaluation aspect
  value: integer("value").notNull(), // 1-5
});

// === INDICATOR MANAGEMENT TABLES ===

export const dimensions = pgTable("dimensions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g., '1'
  name: text("name").notNull(),
  weight: numeric("weight", { precision: 5, scale: 2 }).notNull(), // Percentage
  description: text("description"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subDimensions = pgTable("sub_dimensions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g., '1.A'
  name: text("name").notNull(),
  dimensionId: integer("dimension_id").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const indicators = pgTable("indicators", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g., '1.1'
  name: text("name").notNull(),
  subDimensionId: integer("sub_dimension_id").notNull(),
  description: text("description"),
  scoreValues: jsonb("score_values").$type<number[]>(), // e.g., [1, 3, 5] or [1, 5]
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const indicatorAspects = pgTable("indicator_aspects", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g., '1.1.1'
  name: text("name").notNull(),
  indicatorId: integer("indicator_id").notNull(),
  aspect: text("aspect").notNull(),
  scoreValues: jsonb("score_values").$type<number[]>(), // e.g., [1, 3, 5] or [1, 5]
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === RELATIONS ===

export const villagesRelations = relations(villages, ({ many }) => ({
  assessments: many(assessments),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  village: one(villages, {
    fields: [assessments.villageId],
    references: [villages.id],
  }),
  values: many(assessmentValues),
}));

export const assessmentValuesRelations = relations(assessmentValues, ({ one }) => ({
  assessment: one(assessments, {
    fields: [assessmentValues.assessmentId],
    references: [assessments.id],
  }),
}));

export const dimensionsRelations = relations(dimensions, ({ many }) => ({
  subDimensions: many(subDimensions),
}));

export const subDimensionsRelations = relations(subDimensions, ({ one, many }) => ({
  dimension: one(dimensions, {
    fields: [subDimensions.dimensionId],
    references: [dimensions.id],
  }),
  indicators: many(indicators),
}));

export const indicatorsRelations = relations(indicators, ({ one, many }) => ({
  subDimension: one(subDimensions, {
    fields: [indicators.subDimensionId],
    references: [subDimensions.id],
  }),
  aspects: many(indicatorAspects),
}));

export const indicatorAspectsRelations = relations(indicatorAspects, ({ one }) => ({
  indicator: one(indicators, {
    fields: [indicatorAspects.indicatorId],
    references: [indicators.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVillageSchema = createInsertSchema(villages).omit({ id: true, createdAt: true });
export const insertAssessmentSchema = createInsertSchema(assessments).omit({ id: true, createdAt: true, updatedAt: true, status: true, totalScore: true, dimensionScores: true });
export const insertAssessmentValueSchema = createInsertSchema(assessmentValues).omit({ id: true });

export const insertDimensionSchema = createInsertSchema(dimensions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubDimensionSchema = createInsertSchema(subDimensions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertIndicatorSchema = createInsertSchema(indicators).omit({ id: true, createdAt: true, updatedAt: true });
export const insertIndicatorAspectSchema = createInsertSchema(indicatorAspects).omit({ id: true, createdAt: true, updatedAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Village = typeof villages.$inferSelect;

export type Dimension = typeof dimensions.$inferSelect;
export type InsertDimension = z.infer<typeof insertDimensionSchema>;
export type SubDimension = typeof subDimensions.$inferSelect;
export type InsertSubDimension = z.infer<typeof insertSubDimensionSchema>;
export type Indicator = typeof indicators.$inferSelect;
export type InsertIndicator = z.infer<typeof insertIndicatorSchema>;
export type IndicatorAspect = typeof indicatorAspects.$inferSelect;
export type InsertIndicatorAspect = z.infer<typeof insertIndicatorAspectSchema>;
export type InsertVillage = z.infer<typeof insertVillageSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type AssessmentValue = typeof assessmentValues.$inferSelect;
export type InsertAssessmentValue = z.infer<typeof insertAssessmentValueSchema>;

// Request types
export type CreateVillageRequest = InsertVillage;
export type UpdateVillageRequest = Partial<InsertVillage>;
export type CreateAssessmentRequest = InsertAssessment;
export type UpdateAssessmentValueRequest = {
  value: number;
};
export type BulkUpdateValuesRequest = {
  assessmentId: number;
  values: { indicatorCode: string; value: number }[];
};

// Response types
export type VillageResponse = Village;
export type AssessmentResponse = Assessment & { village?: Village }; // Joined
export type AssessmentDetailResponse = Assessment & {
  village: Village;
  values: AssessmentValue[];
};
