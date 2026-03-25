import { describe, expect, it } from "vitest";
import * as Rb from "rambda";
import { filter, into, map, pipe, sequence } from "../src/index.js";

// ─── IMPORTANT: Protocol Incompatibility ────────────────────────────────────
//
// Rambda (like ramda) ships its own transducer protocol based on transformer
// objects with @@transducer/step, @@transducer/init, and @@transducer/result
// methods. This protocol is NOT compatible with transducer-ts, which uses
// plain functions (StepFn<R, A>) as step functions.
//
// Do NOT pass Rb.map(f) or Rb.filter(pred) as a transducer to transducer-ts's
// pipe/sequence/transduce — they return transformer objects, not StepFns.
//
// CORRECT pattern: use rambda's curried functions as fully-applied CALLBACKS
// inside transducer-ts transducers:
//   map(Rb.prop("name"))      ✓ — Rb.prop("name") is (obj) => obj.name
//   filter(Rb.equals("x"))    ✓ — Rb.equals("x") is (x) => x === "x"
//
// Note: Rambda 11.x is a significant divergence from ramda — it does not
// include arithmetic helpers like R.add or R.multiply. It focuses on
// collection and object utilities with a data-last API.
// ────────────────────────────────────────────────────────────────────────────

describe("rambda equality predicates as filter callbacks", () => {
  it("Rb.equals('x') keeps only elements equal to 'x'", () => {
    expect(sequence(filter(Rb.equals("x")), ["x", "y", "x", "z"])).toEqual(["x", "x"]);
  });

  it("Rb.complement(Rb.equals('x')) excludes 'x'", () => {
    const isNotX = Rb.complement(Rb.equals("x"));
    expect(sequence(filter(isNotX), ["x", "y", "x", "z"])).toEqual(["y", "z"]);
  });

  it("Rb.equals(0) filters zero values", () => {
    expect(sequence(filter(Rb.equals(0)), [0, 1, 0, 2, 0])).toEqual([0, 0, 0]);
  });
});

describe("rambda object utilities as map callbacks", () => {
  it("Rb.prop('name') extracts a property from each object", () => {
    type Person = { name: string; age: number };
    const people: Person[] = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];
    const getName = (p: Person) => Rb.prop("name")(p);
    expect(sequence(map(getName), people)).toEqual(["Alice", "Bob"]);
  });

  it("Rb.pick(['id', 'name']) extracts a subset of properties", () => {
    type Record = { id: number; name: string; role: string };
    const records: Record[] = [
      { id: 1, name: "Alice", role: "admin" },
      { id: 2, name: "Bob", role: "user" },
    ];
    const pickIdName = (r: Record) => Rb.pick(["id", "name"])(r);
    expect(sequence(map(pickIdName), records)).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
  });

  it("Rb.omit removes specified properties from each object", () => {
    type Record = { id: number; name: string; password: string };
    const records: Record[] = [
      { id: 1, name: "Alice", password: "secret" },
      { id: 2, name: "Bob", password: "hidden" },
    ];
    const omitPassword = (r: Record) => Rb.omit(["password"])(r);
    expect(sequence(map(omitPassword), records)).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
  });
});

describe("pipe composition with rambda callbacks", () => {
  it("filter by equality then extract property", () => {
    const users = [
      { name: "Alice", role: "admin" },
      { name: "Bob", role: "user" },
      { name: "Carol", role: "admin" },
    ];
    const isAdmin = (u: { name: string; role: string }) => u.role === "admin";
    const getName = (u: { name: string; role: string }) => Rb.prop("name")(u);
    const xform = pipe(filter(isAdmin), map(getName));
    expect(sequence(xform, users)).toEqual(["Alice", "Carol"]);
  });

  it("map to property then filter by equality", () => {
    const tags = [{ label: "typescript" }, { label: "javascript" }, { label: "typescript" }];
    const getLabel = (t: { label: string }) => Rb.prop("label")(t);
    const xform = pipe(map(getLabel), filter(Rb.complement(Rb.equals("javascript"))));
    expect(sequence(xform, tags)).toEqual(["typescript", "typescript"]);
  });

  it("pick subset then into an existing array", () => {
    type User = { id: number; name: string; email: string; role: string };
    const users: User[] = [
      { id: 1, name: "Alice", email: "alice@example.com", role: "admin" },
      { id: 2, name: "Bob", email: "bob@example.com", role: "user" },
      { id: 3, name: "Carol", email: "carol@example.com", role: "admin" },
    ];
    const pickIdName = (u: User) => Rb.pick(["id", "name"])(u);
    const xform = pipe(
      filter((u: User) => u.role === "admin"),
      map(pickIdName),
    );
    expect(into([], xform, users)).toEqual([
      { id: 1, name: "Alice" },
      { id: 3, name: "Carol" },
    ]);
  });
});

describe("Rb.pipe vs transducer-ts pipe", () => {
  it("Rb.pipe transforms data eagerly (data-first); transducer-ts pipe builds a lazy transducer", () => {
    type Item = { name: string; active: boolean };
    const items: Item[] = [
      { name: "Alice", active: true },
      { name: "Bob", active: false },
      { name: "Carol", active: true },
    ];

    // Rb.pipe: data-first — the first argument is the data, rest are transform functions
    const rambdaResult = Rb.pipe(
      items,
      Rb.filter((x: Item) => x.active),
      Rb.map((x: Item) => x.name),
    );
    expect(rambdaResult).toEqual(["Alice", "Carol"]);

    // transducer-ts pipe: builds a reusable lazy transducer — no data yet
    const xform = pipe(
      filter((x: Item) => x.active),
      map((x: Item) => x.name),
    );
    expect(sequence(xform, items)).toEqual(["Alice", "Carol"]);
    // Same transducer, different source
    expect(sequence(xform, [{ name: "Dave", active: true }])).toEqual(["Dave"]);
  });
});
