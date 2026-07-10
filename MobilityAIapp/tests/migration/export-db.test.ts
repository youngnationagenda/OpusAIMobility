/**
 * Unit tests for the database export script.
 * Tests exported utility functions: validateExportFile, extractLastExportedObject
 */

import { describe, it, expect, afterEach } from 'vitest';
import { writeFile, unlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateExportFile, extractLastExportedObject } from '../../scripts/migrate/export-db';

const TEST_DIR = join(tmpdir(), 'export-db-tests');

async function createTestFile(name: string, content: string): Promise<string> {
  await mkdir(TEST_DIR, { recursive: true });
  const filePath = join(TEST_DIR, name);
  await writeFile(filePath, content, 'utf-8');
  return filePath;
}

async function cleanupFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch {
    // ignore
  }
}

describe('validateExportFile', () => {
  let testFiles: string[] = [];

  afterEach(async () => {
    for (const f of testFiles) {
      await cleanupFile(f);
    }
    testFiles = [];
  });

  it('should reject an empty file', async () => {
    const filePath = await createTestFile('empty.sql', '');
    testFiles.push(filePath);

    const result = await validateExportFile(filePath);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('empty');
  });

  it('should reject a file with no SQL statement terminators', async () => {
    const filePath = await createTestFile('no-semicolon.sql', '-- This is a comment\nSELECT 1');
    testFiles.push(filePath);

    const result = await validateExportFile(filePath);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('no SQL statement terminators');
  });

  it('should reject a file that does not start with valid SQL syntax', async () => {
    const filePath = await createTestFile('invalid-start.sql', 'GARBAGE DATA; more stuff;');
    testFiles.push(filePath);

    const result = await validateExportFile(filePath);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('does not begin with valid SQL syntax');
  });

  it('should accept a valid mysqldump file starting with a comment', async () => {
    const content = `-- MySQL dump 10.13  Distrib 8.0.35
--
-- Host: localhost    Database: terraai
-- ----------------------------------------

CREATE TABLE \`users\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (\`id\`)
);
`;
    const filePath = await createTestFile('valid-comment.sql', content);
    testFiles.push(filePath);

    const result = await validateExportFile(filePath);
    expect(result.valid).toBe(true);
  });

  it('should accept a valid file starting with SET statement', async () => {
    const content = `SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT;
SET NAMES utf8mb4;
CREATE TABLE \`trips\` (\`id\` int NOT NULL);
`;
    const filePath = await createTestFile('valid-set.sql', content);
    testFiles.push(filePath);

    const result = await validateExportFile(filePath);
    expect(result.valid).toBe(true);
  });

  it('should accept a valid file starting with block comment', async () => {
    const content = `/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
CREATE TABLE \`uploads\` (\`id\` int NOT NULL);
`;
    const filePath = await createTestFile('valid-block-comment.sql', content);
    testFiles.push(filePath);

    const result = await validateExportFile(filePath);
    expect(result.valid).toBe(true);
  });
});

describe('extractLastExportedObject', () => {
  it('should return undefined for empty content', () => {
    expect(extractLastExportedObject('')).toBeUndefined();
  });

  it('should extract table name from mysqldump comment about dumping data', () => {
    const content = `-- Dumping data for table \`users\`
INSERT INTO \`users\` VALUES (1, 'test@example.com');
`;
    expect(extractLastExportedObject(content)).toBe('users');
  });

  it('should extract table name from table structure comment', () => {
    const content = `-- Table structure for table \`trips\`
CREATE TABLE \`trips\` (\`id\` int NOT NULL);
`;
    // The last match going backwards is the CREATE TABLE statement
    expect(extractLastExportedObject(content)).toBe('trips');
  });

  it('should extract from CREATE TABLE statement', () => {
    const content = `CREATE TABLE \`uploads\` (
  \`id\` int NOT NULL AUTO_INCREMENT
);`;
    expect(extractLastExportedObject(content)).toBe('uploads');
  });

  it('should extract from CREATE VIEW statement', () => {
    const content = `CREATE VIEW \`active_users\` AS SELECT * FROM users WHERE status = 'active';`;
    expect(extractLastExportedObject(content)).toBe('active_users');
  });

  it('should extract from CREATE PROCEDURE statement', () => {
    const content = `CREATE PROCEDURE \`calculate_fare\`(IN trip_id INT)
BEGIN
  SELECT fare FROM trips WHERE id = trip_id;
END;`;
    expect(extractLastExportedObject(content)).toBe('calculate_fare');
  });

  it('should extract from CREATE FUNCTION statement', () => {
    const content = `CREATE FUNCTION \`get_user_role\`(user_id INT) RETURNS VARCHAR(20)
BEGIN
  RETURN (SELECT role FROM users WHERE id = user_id);
END;`;
    expect(extractLastExportedObject(content)).toBe('get_user_role');
  });

  it('should extract from INSERT statement', () => {
    const content = `INSERT INTO \`notifications\` VALUES (1, 'Hello');`;
    expect(extractLastExportedObject(content)).toBe('notifications');
  });

  it('should return the last object when multiple objects exist', () => {
    const content = `-- Dumping data for table \`users\`
INSERT INTO \`users\` VALUES (1, 'test@example.com');
-- Dumping data for table \`trips\`
INSERT INTO \`trips\` VALUES (1, 1, NULL);
-- Dumping data for table \`uploads\`
`;
    // Last match (going backwards) is the comment about uploads
    expect(extractLastExportedObject(content)).toBe('uploads');
  });

  it('should return undefined for content with no recognizable objects', () => {
    const content = `-- This is just a comment
-- Another comment
`;
    expect(extractLastExportedObject(content)).toBeUndefined();
  });
});
