import fs from "fs";
import path from "path";
import crypto from "crypto";

const DB_FILE = path.join(process.cwd(), "mock-data.json");

interface DBData {
  users: any[];
  results: any[];
}

function readDB(): DBData {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    }
  } catch {}
  return { users: [], results: [] };
}

function writeDB(data: DBData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
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

  private _exec(): QueryResult {
    try {
      const db = readDB();
      const table: any[] = (db[this._table as keyof DBData] as any[]) || [];

      // INSERT
      if (this._operation === "insert") {
        const newItem = {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          checkin_status: false,
          bib_number: null,
          rank: null,
          ...this._mutateData,
        };
        (db[this._table as keyof DBData] as any[]).push(newItem);
        writeDB(db);
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
        writeDB(db);
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
        writeDB(db);
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
