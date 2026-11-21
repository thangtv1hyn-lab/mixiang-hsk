import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_SERVERLESS = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY
);

export const DATA_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), 'mixiangg-hsk-data')
  : path.resolve(__dirname, '..', 'data');
export const LEGACY_DB_FILE = path.resolve(DATA_DIR, 'db.json');

export function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[JsonDatabase] Unable to create data directory (continuing in-memory):', err);
  }
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export class JsonCollection<T> {
  private readonly filePath: string;
  private data: T[] = [];

  constructor(
    public readonly name: string,
    private readonly seedFactory: () => T[]
  ) {
    ensureDataDir();
    this.filePath = path.resolve(DATA_DIR, `${name}.json`);
  }

  getFilePath(): string {
    return this.filePath;
  }

  load(legacyFallback?: T[]): T[] {
    ensureDataDir();
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.data = parsed;
          return this.data;
        }
        if (parsed && Array.isArray(parsed.items)) {
          this.data = parsed.items;
          return this.data;
        }
      }
    } catch (err) {
      console.warn(`[JsonCollection:${this.name}] Failed to parse ${this.filePath}, recovering:`, err);
    }

    if (Array.isArray(legacyFallback) && legacyFallback.length > 0) {
      this.data = deepClone(legacyFallback);
    } else {
      this.data = deepClone(this.seedFactory());
    }

    this.save();
    return this.data;
  }

  getAll(): T[] {
    return this.data;
  }

  setAll(items: T[]): void {
    this.data = items;
    this.save();
  }

  reset(): T[] {
    this.data = deepClone(this.seedFactory());
    this.save();
    return this.data;
  }

  save(): void {
    ensureDataDir();
    const tmpPath = `${this.filePath}.tmp-${process.pid}-${Date.now()}`;
    const payload = {
      collection: this.name,
      updatedAt: new Date().toISOString(),
      count: this.data.length,
      items: this.data,
    };

    try {
      fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.filePath);
    } catch (err) {
      console.error(`[JsonCollection:${this.name}] Atomic write failed:`, err);
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch {
        // ignore cleanup error
      }
    }
  }
}

export function readLegacyDatabase(): Record<string, any> | null {
  try {
    if (fs.existsSync(LEGACY_DB_FILE)) {
      const raw = fs.readFileSync(LEGACY_DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    return null;
  }
  return null;
}
