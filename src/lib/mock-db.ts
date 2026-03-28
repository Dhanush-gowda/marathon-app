import fs from "fs";
import path from "path";
import crypto from "crypto";

const SOURCE_DB = path.join(process.cwd(), "mock-data.json");
const GITHUB_DATA_TOKEN = process.env.GITHUB_DATA_TOKEN;
const GITHUB_DATA_REPO = process.env.GITHUB_DATA_REPO;
const GITHUB_DATA_BRANCH = process.env.GITHUB_DATA_BRANCH || "data-store";
const GITHUB_DATA_PATH = process.env.GITHUB_DATA_PATH || "mock-data.json";
const USE_GITHUB_STORE = Boolean(GITHUB_DATA_TOKEN && GITHUB_DATA_REPO);

interface DBData {
  users: any[];
  results: any[];
}

function getDefaultDB(): DBData {
  return { users: [], results: [] };
}

function readLocalSeed(): DBData {
  try {
    if (fs.existsSync(SOURCE_DB)) {
      return JSON.parse(fs.readFileSync(SOURCE_DB, "utf-8"));
    }
  } catch {}
  return getDefaultDB();
}

function getGitHubPath(): string {
  return GITHUB_DATA_PATH.split("/").map(encodeURIComponent).join("/");
}

async function fetchGitHubFile() {
  if (!USE_GITHUB_STORE) {
    return null;
  }

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_DATA_REPO}/contents/${getGitHubPath()}?ref=${encodeURIComponent(GITHUB_DATA_BRANCH)}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${GITHUB_DATA_TOKEN}`,
        "User-Agent": "marathon-app",
      },
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GitHub data read failed with status ${response.status}`);
  }

  const payload = await response.json();
  const content = Buffer.from(payload.content || "", "base64").toString("utf-8");

  return {
    sha: payload.sha as string,
    data: JSON.parse(content || '{"users":[],"results":[]}') as DBData,
  };
}

async function readDB(): Promise<DBData> {
  if (USE_GITHUB_STORE) {
    try {
      const remoteFile = await fetchGitHubFile();
      return remoteFile?.data || readLocalSeed();
    } catch (error) {
      console.error("MockDB GitHub read error:", error);
      return readLocalSeed();
    }
  }

  try {
    if (fs.existsSync(SOURCE_DB)) {
      return JSON.parse(fs.readFileSync(SOURCE_DB, "utf-8"));
    }
  } catch {}
  return getDefaultDB();
}

async function writeGitHubDB(data: DBData, attempt = 0): Promise<void> {
  if (!USE_GITHUB_STORE) {
    return;
  }

  const existingFile = await fetchGitHubFile();
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_DATA_REPO}/contents/${getGitHubPath()}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${GITHUB_DATA_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "marathon-app",
      },
      body: JSON.stringify({
        message: `Update runtime data ${new Date().toISOString()}`,
        branch: GITHUB_DATA_BRANCH,
        sha: existingFile?.sha,
        content: Buffer.from(JSON.stringify(data, null, 2), "utf-8").toString("base64"),
      }),
    }
  );

  if (response.status === 409 && attempt < 2) {
    await writeGitHubDB(data, attempt + 1);
    return;
  }

  if (!response.ok) {
    throw new Error(`GitHub data write failed with status ${response.status}`);
  }
}

async function writeDB(data: DBData) {
  if (USE_GITHUB_STORE) {
    try {
      await writeGitHubDB(data);
      return;
    } catch (error) {
      console.error("MockDB GitHub write error:", error);
      throw error;
    }
  }

  try {
    fs.writeFileSync(SOURCE_DB, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("MockDB write error:", e);
  }
}

type QueryResult = { data: any; error: any; count?: number };

class QueryBuilder implements PromiseLike<QueryResult> {
  private _table: string;
  private _operation: "select" | "insert" | "update" | "upsert" = "select";
  private _cols = "*";
  private _withCount = false;
  private _conditions: Array<[string, any]> = [];
  private _order?: { field: string; asc: boolean };
  private _rangeFrom = 0;
  private _rangeTo = 9999;
  private _single = false;
  private _mutateData?: any;
  private _upsertConflict?: string;
  private _postSelect = false;

  constructor(table: string) {
    this._table = table;
  }

  select(cols = "*", opts?: { count?: string }): this {
    if (this._operation === "insert" || this._operation === "upsert") {
      this._postSelect = true;
    } else {
      this._operation = "select";
    }
    this._cols = cols;
    this._withCount = !!opts?.count;
    return this;
  }

  insert(data: any): this {
    this._operation = "insert";
    this._mutateData = data;
    return this;
  }

  update(data: any): this {
    this._operation = "update";
    this._mutateData = data;
    return this;
  }

  upsert(data: any, opts?: { onConflict?: string }): this {
    this._operation = "upsert";
    this._mutateData = data;
    this._upsertConflict = opts?.onConflict;
    return this;
  }

  eq(field: string, value: any): this {
    this._conditions.push([field, value]);
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }): this {
    this._order = { field, asc: opts?.ascending !== false };
    return this;
  }

  range(from: number, to: number): this {
    this._rangeFrom = from;
    this._rangeTo = to;
    return this;
  }

  single(): this {
    this._single = true;
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this._exec()).then(onfulfilled, onrejected);
  }

  private _matchRow(row: any): boolean {
    return this._conditions
      .filter(([f]) => !f.includes("."))
      .every(([field, value]) => String(row[field]) === String(value));
  }

  private async _exec(): Promise<QueryResult> {
    try {
      const db = await readDB();
      const table: any[] = (db[this._table as keyof DBData] as any[]) || [];

      // INSERT
      if (this._operation === "insert") {
        const newItem = {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          checkin_status: false,
          bib_number: null,
          password_hash: null,
          categories: null,
          rank: null,
          ...this._mutateData,
        };
        (db[this._table as keyof DBData] as any[]).push(newItem);
        await writeDB(db);
        return {
          data: this._single || this._postSelect ? newItem : [newItem],
          error: null,
        };
      }

      // UPDATE
      if (this._operation === "update") {
        db[this._table as keyof DBData] = table.map((row: any) =>
          this._matchRow(row) ? { ...row, ...this._mutateData } : row
        ) as any;
        await writeDB(db);
        return { data: null, error: null };
      }

      // UPSERT
      if (this._operation === "upsert") {
        const conflictField = this._upsertConflict;
        let found = false;
        db[this._table as keyof DBData] = table.map((row: any) => {
          if (
            conflictField &&
            String(row[conflictField]) ===
              String((this._mutateData as any)[conflictField])
          ) {
            found = true;
            return { ...row, ...this._mutateData };
          }
          return row;
        }) as any;
        if (!found) {
          (db[this._table as keyof DBData] as any[]).push({
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            rank: null,
            ...this._mutateData,
          });
        }
        await writeDB(db);
        return { data: null, error: null };
      }

      // SELECT
      let rows = [...table];

      // Parse join syntax: tableName!inner(col1, col2) or tableName!left(...)
      const joinMatch = this._cols.match(/(\w+)!(?:inner|left)\(([^)]+)\)/);
      if (joinMatch) {
        const [, joinTable, joinCols] = joinMatch;
        const joinData: any[] =
          (db[joinTable as keyof DBData] as any[]) || [];
        const colList = joinCols.split(",").map((s) => s.trim());
        // Derive FK: "users" → "user_id"
        const singular = joinTable.endsWith("s")
          ? joinTable.slice(0, -1)
          : joinTable;
        const fkField = `${singular}_id`;

        rows = rows
          .map((row) => {
            const joined = joinData.find((j: any) => j.id === row[fkField]);
            if (!joined) return null;
            const sub: Record<string, any> = {};
            colList.forEach((col) => {
              sub[col] = joined[col];
            });
            return { ...row, [joinTable]: sub };
          })
          .filter(Boolean) as any[];

        // Apply dotted conditions like "users.category"
        this._conditions
          .filter(([f]) => f.startsWith(`${joinTable}.`))
          .forEach(([field, value]) => {
            const subField = field.split(".")[1];
            rows = rows.filter(
              (row) => String(row[joinTable]?.[subField]) === String(value)
            );
          });
      }

      // Apply non-dotted conditions
      rows = rows.filter((row) => this._matchRow(row));

      // Order
      if (this._order) {
        const { field, asc } = this._order;
        rows.sort((a, b) => {
          const av = a[field] ?? "";
          const bv = b[field] ?? "";
          if (av < bv) return asc ? -1 : 1;
          if (av > bv) return asc ? 1 : -1;
          return 0;
        });
      }

      const total = rows.length;
      const paginated = rows.slice(this._rangeFrom, this._rangeTo + 1);

      if (this._single) {
        return {
          data: paginated[0] ?? null,
          error:
            paginated.length === 0 ? { message: "Row not found" } : null,
        };
      }

      return {
        data: paginated,
        error: null,
        count: this._withCount ? total : undefined,
      };
    } catch (e: any) {
      console.error("MockDB error:", e);
      return { data: null, error: { message: e.message } };
    }
  }
}

export class MockDBClient {
  from(table: string) {
    return new QueryBuilder(table);
  }
}

export const mockDBClient = new MockDBClient();
