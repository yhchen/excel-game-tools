# C# Export Blank Lines

## Intent

Generated protobuf-net C# fails code review on blank lines. The reported case is the last enum member: when an enum has any member comment, an empty `tail` is still emitted, so a whitespace-only line sits before `}`.

## Goal

C# files from `export_to_protobuf_net.ts` no longer contain a whitespace-only line, a blank line immediately before `}`, or two blank lines in a row that this exporter itself inserts.

## Non-Goals

- Do not change JSON, JS, Lua, Go, or proto exporters.
- Do not remove the single blank line after `{`.
- Do not remove the single blank line between members. Properties need that gap.
- Do not drop a real tail comment such as `#endregion`.
- Do not reformat comments, attributes, or member order.

## Constraints

- Edit `src/export/export_to_protobuf_net.ts` only for the generator. `TypeDef` comment collection stays as it is.
- Empty `tail` is an empty array. It is truthy. Enum and object export both require `tail.length > 0`, and both put `}` on the line after a non-empty tail.
- Namespace indent must not turn an empty line into spaces. Indent each non-empty line. Leave empty lines empty.
- A type block already ends with a newline. Do not add another newline before the namespace `}`.
- The file banner keeps one blank line under the generated comment, not two.
- No new dependencies.

## Approaches

1. **Emitter layout.** Skip an empty enum `tail`, indent only non-empty lines, and stop inserting the extra newline before a closing `}` and the extra newline that stacks two blanks between types. Chosen.
2. **Only the enum `tail` check.** That fixes `EItemType`'s last member. The namespace `}` and the file banner still fail the same review.
3. **Run a C# formatter after export.** That pulls in a tool and rewrites more than the review warnings.

## Conditions

Tail has three states. `undefined` means no child comment was collected. `[]` means a child comment exists and nothing follows the last member. A non-empty array is a real tail, such as `#endregion`.

- `undefined` and `[]` write nothing before `}`.
- A non-empty tail is written on its own lines, and `}` is the next line. Enum and object use that same shape. No blank line sits between the tail and `}`.
- A tail is collected only when some earlier member already has a comment. Do not change that TypeDef rule.

Brace gaps stay as they are emitted today:

- Keep the one blank line after the `{` of a namespace, enum, object, struct, and array-wrapper class.
- Keep the one blank line between members.
- The sheet list class `{` and the indexer `{` have no blank line after them. Do not add one.
- No `}` has a blank line directly above it. That includes enum, class, indexer, and namespace braces.

Newlines the exporter adds:

- Indent only non-empty lines. An empty line stays empty.
- A wrapped block that already starts with a newline supplies the one blank line after `namespace {`. Do not add a second one.
- A wrapped block that already ends with a newline puts `}` on the next line. Do not add a second one.
- One blank line between lead types, and between sheets. The row class and its list class also keep one blank line, not two.
- The banner has one blank line under the comment, then `using`.
- `Namespace` absent does not print the word `undefined`. The body is written with no namespace and no indent.
- `UseNamespace` still adds its one blank line after the extra usings. Lead files keep their one blank line between `using System;` and `namespace`.

## Behavior

`EItemFlags` has no member comment, so `tail` stays `undefined`. `AppType` has a member comment and no tail comment, so `tail` is `[]`. Both end like this:

```csharp
        Logic = 3,
    }
}
```

`EItemType` keeps its member comments and a real tail. It ends like this:

```csharp
        [ProtoEnum]
        Special = 104,
        #endregion
    }
}
```

`KVJson` has the same non-empty tail on an object. `#endregion` is the line above the class `}`.

- No spaces-only line appears in either ending.
- The namespace `}` is the next line after the type `}`.
- Member comments stay, including the blank line between members.
- `{` is still followed by one blank line where the generator already emits one.
- The banner is one comment line, one blank line, then `using`.
- One blank line stays between two types in `global.cs`. Not two.

## Acceptance

Rebuild, export `testcase/`, and check every generated `.cs` file. No line is only whitespace. No `}` has a blank line directly above it. No two blank lines are adjacent. The banner has one blank line under it. `EItemFlags` still has `[ProtoContract, Flags]`.
