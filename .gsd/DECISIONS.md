# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? | Made By |
|---|------|-------|----------|--------|-----------|------------|---------|
| D001 | M002 | architecture | How to replace pipe's fixed arity overloads | Recursive conditional types (BuildConstraint + PipeResult) with branded PipeTypeError for positional mismatch messages | Recursive types proven viable up to 15+ arity in prototype. BuildConstraint walks the tuple and constrains each position's input to the previous output. PipeResult extracts Transducer<First, Last>. PipeTypeError brand surfaces the position number in compiler errors. All helper types stay internal to pipe module. | No | collaborative |
| D002 | M002/S01 | type-design | Index direction for BuildConstraint predecessor lookup | PrevIdx<I> tuple (maps I → I-1) rather than NextIdx (I → I+1) with reverse lookup | PrevIdx directly answers "what came before position K?", which is what BuildConstraint needs. A forward-direction NextIdx requires an extra reverse step and was harder to reason about correctly. | Yes | agent |
| D003 | M002/S01 | type-design | How to extract the last element of the transducer tuple for PipeResult | LastOf<T> using rest-element inference ([...any[], infer L]) rather than Extract<keyof T, `${number}`> index extraction | TypeScript's built-in rest-element inference is simpler, more readable, and equally correct. The Extract pattern required multiple intermediate types and was harder to verify. | Yes | agent |
