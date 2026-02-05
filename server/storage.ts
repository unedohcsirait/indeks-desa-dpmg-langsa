import { db } from "./db";
import {
  users, villages, assessments, assessmentValues,
  dimensions, subDimensions, indicators, indicatorAspects,
  type User, type InsertUser,
  type Village, type InsertVillage,
  type Assessment, type InsertAssessment,
  type AssessmentValue, type InsertAssessmentValue,
  type BulkUpdateValuesRequest,
  type Dimension, type InsertDimension,
  type SubDimension, type InsertSubDimension,
  type Indicator, type InsertIndicator,
  type IndicatorAspect, type InsertIndicatorAspect,
} from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;

  // Village operations
  getVillages(search?: string): Promise<Village[]>;
  getVillage(id: number): Promise<Village | undefined>;
  createVillage(village: InsertVillage): Promise<Village>;
  updateVillage(id: number, village: Partial<InsertVillage>): Promise<Village>;
  deleteVillage(id: number): Promise<void>;

  // Assessment operations
  getAssessments(villageId?: number, year?: number): Promise<(Assessment & { village: Village })[]>;
  getAssessment(id: number): Promise<(Assessment & { village: Village; values: AssessmentValue[] }) | undefined>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: number, updates: Partial<Assessment>): Promise<Assessment>;
  deleteAssessment(id: number): Promise<void>;
  
  // Assessment Values operations
  getAssessmentValues(assessmentId: number): Promise<AssessmentValue[]>;
  bulkUpdateAssessmentValues(assessmentId: number, values: { indicatorCode: string; value: number }[]): Promise<void>;

  // Dimension operations
  getDimensions(): Promise<Dimension[]>;
  getDimension(id: number): Promise<Dimension | undefined>;
  createDimension(dimension: InsertDimension): Promise<Dimension>;
  updateDimension(id: number, updates: Partial<InsertDimension>): Promise<Dimension>;
  deleteDimension(id: number): Promise<void>;

  // SubDimension operations
  getSubDimensions(): Promise<SubDimension[]>;
  getSubDimension(id: number): Promise<SubDimension | undefined>;
  createSubDimension(subDimension: InsertSubDimension): Promise<SubDimension>;
  updateSubDimension(id: number, updates: Partial<InsertSubDimension>): Promise<SubDimension>;
  deleteSubDimension(id: number): Promise<void>;

  // Indicator operations
  getIndicators(): Promise<Indicator[]>;
  getIndicator(id: number): Promise<Indicator | undefined>;
  createIndicator(indicator: InsertIndicator): Promise<Indicator>;
  updateIndicator(id: number, updates: Partial<InsertIndicator>): Promise<Indicator>;
  deleteIndicator(id: number): Promise<void>;

  // IndicatorAspect operations
  getIndicatorAspects(): Promise<IndicatorAspect[]>;
  getIndicatorAspect(id: number): Promise<IndicatorAspect | undefined>;
  createIndicatorAspect(aspect: InsertIndicatorAspect): Promise<IndicatorAspect>;
  updateIndicatorAspect(id: number, updates: Partial<InsertIndicatorAspect>): Promise<IndicatorAspect>;
  deleteIndicatorAspect(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // === User operations ===
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [updated] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // === Village operations ===
  async getVillages(search?: string): Promise<Village[]> {
    if (search) {
      return await db.select().from(villages)
        .where(sql`lower(${villages.name}) LIKE lower(${`%${search}%`})`)
        .orderBy(desc(villages.createdAt));
    }
    return await db.select().from(villages).orderBy(desc(villages.createdAt));
  }

  async getVillage(id: number): Promise<Village | undefined> {
    const [village] = await db.select().from(villages).where(eq(villages.id, id));
    return village;
  }

  async createVillage(village: InsertVillage): Promise<Village> {
    const [newVillage] = await db.insert(villages).values(village).returning();
    return newVillage;
  }

  async updateVillage(id: number, updates: Partial<InsertVillage>): Promise<Village> {
    const [updated] = await db.update(villages)
      .set(updates)
      .where(eq(villages.id, id))
      .returning();
    return updated;
  }

  async deleteVillage(id: number): Promise<void> {
    await db.delete(villages).where(eq(villages.id, id));
  }

  async getAssessments(villageId?: number, year?: number): Promise<(Assessment & { village: Village })[]> {
    let conditions = [];
    if (villageId) conditions.push(eq(assessments.villageId, villageId));
    if (year) conditions.push(eq(assessments.year, year));

    const query = db.select({
      assessment: assessments,
      village: villages,
    })
    .from(assessments)
    .innerJoin(villages, eq(assessments.villageId, villages.id));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(assessments.year));
    return results.map(row => ({
      ...row.assessment,
      village: row.village
    }));
  }

  async getAssessment(id: number): Promise<(Assessment & { village: Village; values: AssessmentValue[] }) | undefined> {
    const [result] = await db.select({
      assessment: assessments,
      village: villages,
    })
    .from(assessments)
    .innerJoin(villages, eq(assessments.villageId, villages.id))
    .where(eq(assessments.id, id));

    if (!result) return undefined;

    const values = await db.select().from(assessmentValues).where(eq(assessmentValues.assessmentId, id));

    return {
      ...result.assessment,
      village: result.village,
      values,
    };
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db.insert(assessments).values(assessment).returning();
    return newAssessment;
  }

  async updateAssessment(id: number, updates: Partial<Assessment>): Promise<Assessment> {
    const [updated] = await db.update(assessments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assessments.id, id))
      .returning();
    return updated;
  }

  async deleteAssessment(id: number): Promise<void> {
    await db.delete(assessmentValues).where(eq(assessmentValues.assessmentId, id));
    await db.delete(assessments).where(eq(assessments.id, id));
  }

  async getAssessmentValues(assessmentId: number): Promise<AssessmentValue[]> {
    return await db.select().from(assessmentValues).where(eq(assessmentValues.assessmentId, assessmentId));
  }

  async bulkUpdateAssessmentValues(assessmentId: number, values: { indicatorCode: string; value: number }[]): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete existing values for these codes (simple upsert strategy)
      // Or we can use ON CONFLICT if we had a unique constraint on assessmentId + indicatorCode
      // For simplicity, let's delete provided codes and insert new ones, or use upsert if schema allows.
      // Since we don't have unique constraint defined in schema.ts (yet), let's loop upsert manually or do a delete-insert for simplicity/safety
      
      for (const val of values) {
         // Check if exists
         const existing = await tx.select().from(assessmentValues).where(
            and(
                eq(assessmentValues.assessmentId, assessmentId),
                eq(assessmentValues.indicatorCode, val.indicatorCode)
            )
         );

         if (existing.length > 0) {
             await tx.update(assessmentValues)
                .set({ 
                    value: val.value,
                    aspect: (val as any).aspect 
                })
                .where(eq(assessmentValues.id, existing[0].id));
         } else {
             await tx.insert(assessmentValues).values({
                 assessmentId,
                 indicatorCode: val.indicatorCode,
                 aspect: (val as any).aspect,
                 value: val.value
             });
         }
      }
    });
  }

  // === Dimension operations ===
  async getDimensions(): Promise<Dimension[]> {
    return await db.select().from(dimensions).orderBy(dimensions.code);
  }

  async getDimension(id: number): Promise<Dimension | undefined> {
    const [dimension] = await db.select().from(dimensions).where(eq(dimensions.id, id));
    return dimension;
  }

  async createDimension(dimension: InsertDimension): Promise<Dimension> {
    const [newDimension] = await db.insert(dimensions).values(dimension).returning();
    return newDimension;
  }

  async updateDimension(id: number, updates: Partial<InsertDimension>): Promise<Dimension> {
    const [updated] = await db.update(dimensions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dimensions.id, id))
      .returning();
    return updated;
  }

  async deleteDimension(id: number): Promise<void> {
    await db.delete(dimensions).where(eq(dimensions.id, id));
  }

  // === SubDimension operations ===
  async getSubDimensions(): Promise<SubDimension[]> {
    return await db.select().from(subDimensions).orderBy(subDimensions.code);
  }

  async getSubDimension(id: number): Promise<SubDimension | undefined> {
    const [subDimension] = await db.select().from(subDimensions).where(eq(subDimensions.id, id));
    return subDimension;
  }

  async createSubDimension(subDimension: InsertSubDimension): Promise<SubDimension> {
    const [newSubDimension] = await db.insert(subDimensions).values(subDimension).returning();
    return newSubDimension;
  }

  async updateSubDimension(id: number, updates: Partial<InsertSubDimension>): Promise<SubDimension> {
    const [updated] = await db.update(subDimensions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subDimensions.id, id))
      .returning();
    return updated;
  }

  async deleteSubDimension(id: number): Promise<void> {
    await db.delete(subDimensions).where(eq(subDimensions.id, id));
  }

  // === Indicator operations ===
  async getIndicators(): Promise<Indicator[]> {
    return await db.select().from(indicators).orderBy(indicators.code);
  }

  async getIndicator(id: number): Promise<Indicator | undefined> {
    const [indicator] = await db.select().from(indicators).where(eq(indicators.id, id));
    return indicator;
  }

  async createIndicator(indicator: InsertIndicator): Promise<Indicator> {
    const [newIndicator] = await db.insert(indicators).values(indicator).returning();
    return newIndicator;
  }

  async updateIndicator(id: number, updates: Partial<InsertIndicator>): Promise<Indicator> {
    const [updated] = await db.update(indicators)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(indicators.id, id))
      .returning();
    return updated;
  }

  async deleteIndicator(id: number): Promise<void> {
    await db.delete(indicators).where(eq(indicators.id, id));
  }

  // === IndicatorAspect operations ===
  async getIndicatorAspects(): Promise<IndicatorAspect[]> {
    return await db.select().from(indicatorAspects).orderBy(indicatorAspects.code);
  }

  async getIndicatorAspect(id: number): Promise<IndicatorAspect | undefined> {
    const [aspect] = await db.select().from(indicatorAspects).where(eq(indicatorAspects.id, id));
    return aspect;
  }

  async createIndicatorAspect(aspect: InsertIndicatorAspect): Promise<IndicatorAspect> {
    const [newAspect] = await db.insert(indicatorAspects).values(aspect).returning();
    return newAspect;
  }

  async updateIndicatorAspect(id: number, updates: Partial<InsertIndicatorAspect>): Promise<IndicatorAspect> {
    const [updated] = await db.update(indicatorAspects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(indicatorAspects.id, id))
      .returning();
    return updated;
  }

  async deleteIndicatorAspect(id: number): Promise<void> {
    await db.delete(indicatorAspects).where(eq(indicatorAspects.id, id));
  }
}

export const storage = new DatabaseStorage();
