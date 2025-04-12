# Excel Configuration Export Tool

## Introduction

This is an efficient Excel/CSV configuration export tool designed specifically for game developers, used to export Excel spreadsheet data to various formats (JSON, JS, Lua, Protobuf, etc.), and provides powerful type checking functionality to ensure the correctness and consistency of game configuration data.

Main features:

-   Support for exporting to multiple formats: JSON, JS, Lua, Protocol Buffers, etc.
-   Powerful type checking system, supporting basic types, arrays, objects, enums, etc.
-   Support for custom type definitions and validation rules
-   Support for Excel and CSV file formats
-   Support for data references and association checks
-   High-performance processing of large configuration files

## Installation and Environment Setup

### Requirements

-   Node.js environment
-   TypeScript support

### Installation Steps

1. Clone or download the project code
2. Install dependencies:

```bash
npm install
```

3. Compile the project:

```bash
npm run build
```

## Basic Usage Process

1. Prepare Excel/CSV configuration files, fill in data according to the specified format
2. Create a configuration file `config.json`, set import and export options
3. Write a type definition file (e.g., `typeDef.ts`)
4. Run the export command:

```bash
node dist/index.js -c config.json -t typeDef.js
```

## Excel/CSV File Format Specifications

### Table Structure

Excel tables need to be organized according to the following structure:

1. **Table Name Row**: The first row is the table name, cell A1 is typically the table identifier
2. **Group Filter Row** (optional): A row starting with `$`, used to set column grouping
3. **Column Name Row**: Defines the name of each column, must be a valid identifier (letters, numbers, underscores)
4. **Type Row**: Defines the data type of each column, column A is typically marked with `*`
5. **Data Rows**: The actual configuration data

### Special Marking Rules

-   File names or table names starting with `!` `#` `.` `~$` `$` will be ignored
-   Column names starting with `#` indicate comment columns, which will not be exported
-   Rows with the first cell (column A) starting with `#` indicate comment rows, which will not be exported

### Example Table

| \*       | Id         | Name       | Type | Value | Desc          |
| -------- | ---------- | ---------- | ---- | ----- | ------------- |
| $        | \*         | \*         | \*   | \*    | \*            |
| \*       | int<!!;!0> | string<!N> | int  | float | string        |
| #Comment |            |            |      |       |               |
|          | 1001       | Item1      | 1    | 10.5  | This is item1 |
|          | 1002       | Item2      | 2    | 20.3  | This is item2 |

### Group Filter Row Explained

The group filter row starts with `$` and is used to set the group identifier for each column. Groups are defined in the `GroupMap` of the configuration file, and then the groups to be exported are specified in the `GroupFilter` of the export configuration.

For example:

| \*  | Id  | Name | Type | Value | Desc |
| --- | --- | ---- | ---- | ----- | ---- |
| $   | \*  | S    | C    | \*    | \*   |

The above configuration means:

-   The `Id` column belongs to all groups (`*`)
-   The `Name` column only belongs to the server group (`S`)
-   The `Type` column only belongs to the client group (`C`)
-   The `Value` and `Desc` columns belong to all groups (`*`)

In the export configuration, if `"GroupFilter": ["C"]` is set, only the `Id`, `Type`, `Value`, and `Desc` columns will be exported.

## Type System and Type Checking

### Basic Types

| Type        | Description                     | Value Range                                        |
| ----------- | ------------------------------- | -------------------------------------------------- |
| `char`      | Signed character                | -127 ~ 127                                         |
| `uchar`     | Unsigned character              | 0 ~ 255                                            |
| `short`     | Signed short integer            | -32768 ~ 32767                                     |
| `ushort`    | Unsigned short integer          | 0 ~ 65535                                          |
| `int`       | Signed integer                  | -2147483648 ~ 2147483647                           |
| `uint`      | Unsigned integer                | 0 ~ 4294967295                                     |
| `int64`     | Signed long integer             | -9223372036854775808 ~ 9223372036854775807         |
| `uint64`    | Unsigned long integer           | 0 ~ 18446744073709551615                           |
| `string`    | String                          | Automatically converts line breaks to '\n'         |
| `double`    | Double precision floating point | No limit                                           |
| `float`     | Single precision floating point | No limit                                           |
| `bool`      | Boolean                         | true: 'true' or '1', false: 'false', empty, or '0' |
| `date`      | Date and time                   | YYYY/MM/DD HH:mm:ss                                |
| `tinydate`  | Date                            | YYYY/MM/DD                                         |
| `timestamp` | Timestamp                       | Linux timestamp                                    |
| `utctime`   | UTC timestamp                   | UTC timestamp                                      |

### Combination Types

| Type                  | Description                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `<type>[<N> or null]` | Array type, `<type>` is a basic type or combination type, `<N>` is the array length (optional) |
| `vector2`             | Equivalent to `float[2]`, commonly used to represent 2D coordinates                            |
| `vector3`             | Equivalent to `float[3]`, commonly used to represent 3D coordinates                            |

### Array Format

Arrays use separators to distinguish different levels:

-   First level separator: `;` (can be modified in the configuration)
-   Second level separator: `/` (can be modified in the configuration)
-   Third level separator: `\n` (can be modified in the configuration)

For example, for the type `int[][]`, the data `1;2/3;4;5` represents `[[1,2,3], [4,5]]`.

**Note**: For a better numerical configuration experience, it is recommended that array nesting depth does not exceed three levels.

#### Array Examples

1. One-dimensional array `int[]`:

    ```
    1;2;3;4;5
    ```

    Parsing result: `[1, 2, 3, 4, 5]`

2. Two-dimensional array `int[][]`:

    ```
    1;2/3;4;5/6
    ```

    Parsing result: `[[1, 2], [3, 4, 5], [6]]`

3. Three-dimensional array `int[][][]`:

    ```
    1/2
    3;4/5
    6;7;8
    ```

    Parsing result: `[[[1], [2]], [[3, 4], [5]], [[6, 7, 8]]]`

4. Fixed-length array `int[3]`:
    ```
    1;2;3
    ```
    Parsing result: `[1, 2, 3]` (an error will be reported if the number of elements is not equal to 3)

### Column Validators Explained

Validators are used to enhance type checking and ensure data conforms to specific rules. Validators are added after the type, enclosed in angle brackets `<>`.

#### Basic Validators

-   `<!!>` : Unique value validator

    -   Ensures that all values in the column are unique, no duplicates allowed
    -   Commonly used for ID columns or other fields that require unique identification
    -   Example: `int<!!>`

-   `<!N>` : Non-empty validator

    -   Ensures that the value of the column cannot be empty
    -   Suitable for required fields
    -   Example: `string<!N>`

-   `<!0>` : Non-zero validator
    -   Ensures that the value of the column cannot be 0
    -   Suitable for numeric fields that are not allowed to be zero, such as item quantity, rate, etc.
    -   Example: `int<!0>`

#### Combined Validators

Multiple validators can be combined, separated by semicolons `;`:

-   `int<!!;!0>` : Value must be unique and cannot be 0
-   `string<!N;!!>` : Value cannot be empty and must be unique

#### Validator Usage Example

| \*  | Id         | Name       | Count   | Rate  |
| --- | ---------- | ---------- | ------- | ----- |
| \*  | int<!!;!0> | string<!N> | int<!0> | float |
|     | 1001       | Item1      | 10      | 1.5   |
|     | 1002       | Item2      | 5       | 0.8   |

In the example above:

-   The `Id` column's value must be unique and cannot be 0
-   The `Name` column's value cannot be empty
-   The `Count` column's value cannot be 0
-   The `Rate` column has no special validation

### Compound Types Explained

Compound types are more complex data structures composed of basic types, including objects, arrays, enums, etc.

#### Object Type

Object types are used to represent complex data structures with multiple properties. In Excel, object types typically use separators to separate each property value.

**Definition Method**:

```typescript
typeDefs.Position = def.TObject({
    x: int,
    y: int,
    width: int,
    height: int,
});
```

**Usage in Excel**:

```
10;20;100;50
```

Parsing result: `{ x: 10, y: 20, width: 100, height: 50 }`

#### Nested Objects

Objects can be nested to contain other objects or arrays:

```typescript
typeDefs.Character = def.TObject({
    id: int,
    name: string,
    position: typeDefs.Position,
    stats: def.TObject({
        hp: int,
        mp: int,
        attack: int,
        defense: int,
    }),
});
```

**Usage in Excel**:

```
1001;Hero;10;20;100;50;1000;500;80;60
```

Parsing result:

```json
{
    "id": 1001,
    "name": "Hero",
    "position": { "x": 10, "y": 20, "width": 100, "height": 50 },
    "stats": { "hp": 1000, "mp": 500, "attack": 80, "defense": 60 }
}
```

#### Objects with Validation

Object types can add custom validation functions:

```typescript
typeDefs.Award = def.TObject(
    {
        type: EItemType,
        id: int,
        count: int64,
    },
    function (data) {
        // Validate if the id exists in the corresponding table based on the type
        switch (data.type) {
            case EItemType.Equip:
                return Sheets.Equip.id(data.id);
            case EItemType.Item:
                return Sheets.Item.id(data.id);
        }
    }
);
```

#### Enum Type

Enum types are used to represent a set of named constants:

```typescript
const EItemType = (typeDefs.EItemType = def.TEnum({
    Invalid: 0,
    Item: 1, // Normal item
    Equip: 2, // Equipment
    Pet: 101, // Pet
}));
```

**Usage in Excel**:
You can use the enum name or value:

```
Item    // or directly use 1
```

#### Table Reference Type

Table reference types are used to reference data in other tables, ensuring data consistency:

```typescript
// Define a reference to the id column of the Item table
typeDefs.ItemId = Sheets.Item.id;

// Use the reference type
typeDefs.Equipment = def.TObject({
    id: int<!!>,
    name: string,
    requiredItem: typeDefs.ItemId  // Ensure the referenced item ID exists
});
```

#### JSON Parsing Mode

For particularly complex data structures, JSON strings can be used directly in Excel:

```typescript
// Define a JSON object type
const KVJson = (typeDefs.KVJson = def.TJson({
    key: int.DVAL(1), // Default value is 1
    value: int,
}));
```

**Usage in Excel**:

```
{"key": 5, "value": 100}
```

### Custom Type Definitions

Custom types can be defined in the `typeDef.ts` file:

```typescript
// Define an enum type
const EItemType = (typeDefs.EItemType = def.TEnum({
    Invalid: 0,
    Item: 1, // Normal item
    Equip: 2, // Equipment
    Pet: 101, // Pet
}));

// Define an object type
typeDefs.Position = def.TObject({
    x: int,
    y: int,
    width: int,
    height: int,
});

// Define an array type
typeDefs.Vector3 = def.TArray(float, 3);

// Define a reference to another table
typeDefs.EquipId = Sheets.Equip.id;

// Define a complex type with validation
typeDefs.Award = def.TObject(
    {
        type: EItemType,
        id: int,
        count: int64,
    },
    function (data) {
        // Validate if the id exists in the corresponding table based on the type
        switch (data.type) {
            case EItemType.Equip:
                return Sheets.Equip.id(data.id);
            case EItemType.Item:
                return Sheets.Item.id(data.id);
        }
    }
);
```

### Default Value Settings

Default values can be set for types, to be used when a cell is empty:

```typescript
// Set default value to 0
const defaultInt = int.DVAL(0);

// Set default value to "Unknown"
const defaultString = string.DVAL("Unknown");

// Use default values in an object
typeDefs.Item = def.TObject({
    id: int<!!>,
    name: string.DVAL("Unnamed Item"),
    type: EItemType.DVAL(EItemType.Invalid),
    count: int.DVAL(1)
});
```

## Configuration File Explained

The configuration file `config.json` is used to set import and export options:

```json
{
    "IncludeFilesAndPath": [
        "./testcase" // Files and directories to process
    ],
    "GroupMap": {
        "*": "(All) Default value", // Default group
        "A": "Server And Client", // Server and client
        "S": "Server", // Server only
        "C": "Client" // Client only
    },
    "Export": [
        {
            "type": "json", // Export type
            "OutputDir": "./exports/json/", // Output directory
            "GroupFilter": ["C"], // Group filter
            "UseDefaultValueIfEmpty": false // Whether to use default values for empty cells
        }
        // Multiple export targets can be configured
    ],
    "DateFmt": "YYYY/MM/DD HH:mm:ss", // Date format
    "TinyDateFmt": "YYYY/MM/DD", // Short date format
    "TypeCheckerJSFilePath": "./typeDef", // Type definition file path
    "EnableDebugOutput": true, // Whether to enable debug output
    "ArraySpliter": [",", ";", "\n"] // Array separators
}
```

### Configuration Items Explained

#### IncludeFilesAndPath

Specifies the files and directory paths to process, can be relative or absolute paths:

```json
"IncludeFilesAndPath": [
    "./testcase",           // Process all files in the testcase directory
    "./configs/items.xlsx"  // Process a specific Excel file
]
```

#### GroupMap

Defines group mappings, used to filter exported columns:

```json
"GroupMap": {
    "*": "(All) Default value",  // Default group, included in all export configurations
    "A": "Server And Client",    // Shared by server and client
    "S": "Server",               // Server only
    "C": "Client"                // Client only
}
```

#### Export

Defines export configurations, multiple export targets can be configured:

```json
"Export": [
    {
        "type": "json",                  // Export type
        "OutputDir": "./exports/json/",  // Output directory
        "GroupFilter": ["C"],            // Group filter
        "UseDefaultValueIfEmpty": false, // Whether to use default values for empty cells
        "NameTranslate": {               // Column name translation
            "Id": "_id"
        }
    }
]
```

#### Other Configuration Items

-   `DateFmt`: Date format, default is `"YYYY/MM/DD HH:mm:ss"`
-   `TinyDateFmt`: Short date format, default is `"YYYY/MM/DD"`
-   `TypeCheckerJSFilePath`: Type definition file path
-   `EnableDebugOutput`: Whether to enable debug output
-   `ArraySpliter`: Array separators, default is `[",", ";", "\n"]`
-   `TimeStampUseMS`: Whether timestamps use milliseconds, default is `true`
-   `FractionDigitsFMT`: Decimal places format, default is `6`

## Export Format Descriptions

### JSON Format

```json
{
    "type": "json",
    "OutputDir": "./exports/json/", // If a directory, each table is exported separately; if a file, all tables are combined
    "GroupFilter": ["C"], // Group filter
    "UseDefaultValueIfEmpty": false // Whether to use default values for empty cells
}
```

Example export result:

```json
{
    "1001": {
        "_id": 1001,
        "name": "Item1",
        "type": 1,
        "value": 10.5
    },
    "1002": {
        "_id": 1002,
        "name": "Item2",
        "type": 2,
        "value": 20.3
    },
    "_ids": [1001, 1002]
}
```

### JavaScript Format

```json
{
    "type": "js",
    "OutputDir": "./exports/js/",
    "ExportTemple": "export const {name}={data}", // Export template
    "GroupFilter": ["S", "C", "*"]
}
```

Example export result:

```javascript
export const Item = {
    1001: {
        id: 1001,
        name: 'Item1',
        type: 1,
        value: 10.5,
    },
    1002: {
        id: 1002,
        name: 'Item2',
        type: 2,
        value: 20.3,
    },
    _ids: [1001, 1002],
};
```

### Lua Format

```json
{
    "type": "lua",
    "OutputDir": "./exports/lua/",
    "ExportTemple": "local {name} = {data}\n\nreturn {name}",
    "UseShortName": true // Whether to use short names to compress key names
}
```

Example export result (using short names):

```lua
local Item = {
    [1001] = {
        a = 1001,  -- id
        b = "Item1", -- name
        c = 1,     -- type
        d = 10.5   -- value
    },
    [1002] = {
        a = 1002,  -- id
        b = "Item2", -- name
        c = 2,     -- type
        d = 20.3   -- value
    },
    _ids = {1001, 1002}
}

return Item
```

### Protocol Buffers Format

```json
{
    "type": "proto3",
    "OutputDir": "./exports/proto3.proto", // Output protocol file
    "OutputDataDir": "./exports/proto3-data/", // Output data file
    "Namespace": "GameConfig", // Namespace
    "ARRAY_ELEMENT_NAME": "list" // Array element name
}
```

Example export result (protocol file):

```protobuf
syntax = "proto3";
package GameConfig;

message Item {
    int32 id = 1;
    string name = 2;
    int32 type = 3;
    float value = 4;
}

message ItemCategory {
    repeated Item list = 1;
}
```

### C# Protobuf-net Format

```json
{
    "type": "protobuf-net",
    "OutputDir": "./exports/cs/",
    "Namespace": "GameConfig",
    "UseNamespace": ["System"],
    "IDUseGeterAndSeter": true,
    "NullableReferenceTypes": true
}
```

Example export result:

```csharp
using System;
using ETModel;

namespace GameConfig
{
    [Config()]
    public partial class ItemCategory : ACategory<Item>{}

    [ProtoContract]
    public partial class Item : IConfig
    {
        [ProtoMember(1)]
        private int _id;

        [ProtoMember(2)]
        public string Name { get; set; }

        [ProtoMember(3)]
        public int Type { get; set; }

        [ProtoMember(4)]
        public float Value { get; set; }

        public int Id
        {
            get { return _id; }
            set { _id = value; }
        }
    }
}
```

## Command Line Parameters

```
node dist/index.js [options...]
```

Options:

-   `-c` : Configuration file path
-   `-t` : Type definition file path
-   `--debug-output` : 1 to enable debug output, 0 to disable debug output

## Best Practices

### Game Configuration Data Organization

1. **Plan table structure reasonably**:

    - Put related configurations in the same table
    - Use meaningful column names and comments
    - Add validators for important fields

2. **Use type definitions to enhance data validation**:

    - Define enum types to standardize constant values
    - Use object types to organize complex data
    - Add custom validation functions to handle complex business logic

3. **Utilize grouping functionality to separate data**:

    - Use group markers to distinguish between server and client data
    - Only export necessary data to the client, reducing package size

4. **Establish data reference relationships**:
    - Use table references to ensure data consistency
    - For example: When an item table's ID is referenced by an equipment table, ensure the ID exists

### Performance Optimization

1. For large configurations, consider splitting into multiple tables
2. Use `--debug-output 0` to turn off debug output for better performance
3. For clients, consider using `UseShortName: true` to reduce data volume

### Practical Application Scenarios

#### Game Item System

```typescript
// Item type enum
const EItemType = typeDefs.EItemType = def.TEnum({
    Invalid: 0,
    Consumable: 1,  // Consumable
    Equipment: 2,   // Equipment
    Material: 3,    // Material
    Currency: 4,    // Currency
});

// Item quality enum
const EItemQuality = typeDefs.EItemQuality = def.TEnum({
    Common: 1,      // Common
    Uncommon: 2,    // Uncommon
    Rare: 3,        // Rare
    Epic: 4,        // Epic
    Legendary: 5,   // Legendary
});

// Equipment slot enum
const EEquipSlot = typeDefs.EEquipSlot = def.TEnum({
    None: 0,
    Head: 1,        // Head
    Body: 2,        // Body
    Hands: 3,       // Hands
    Feet: 4,        // Feet
    Weapon: 5,      // Weapon
    Accessory: 6,   // Accessory
});

// Item base attributes
typeDefs.ItemBase = def.TObject({
    id: int<!!;!0>,         // Unique ID, not 0
    name: string<!N>,       // Name, not empty
    icon: string,           // Icon path
    description: string,    // Description
    type: EItemType,        // Item type
    quality: EItemQuality,  // Quality
    stackLimit: int.DVAL(1) // Stack limit, default 1
});

// Equipment stats
typeDefs.EquipmentStats = def.TObject({
    attack: int.DVAL(0),    // Attack
    defense: int.DVAL(0),   // Defense
    health: int.DVAL(0),    // Health
    critRate: float.DVAL(0) // Critical rate
});

// Equipment definition
typeDefs.Equipment = def.TObject({
    baseInfo: typeDefs.ItemBase,        // Base info
    slot: EEquipSlot,                   // Equipment slot
    level: int<!0>,                     // Level requirement, not 0
    stats: typeDefs.EquipmentStats,     // Stats
    setId: int.DVAL(0)                  // Set ID, 0 means not part of a set
});
```

## Common Problems and Solutions

1. **Export fails, type error prompt**

    - Check if the data types in Excel match the definitions
    - Check if required fields are empty

2. **Array data format error**

    - Confirm that the correct separators are used
    - Check if the array nesting level is correct

3. **Reference check failure**

    - Ensure that the referenced tables and columns are correctly loaded
    - Check if the referenced ID exists in the target table

4. **Chinese or special character display issues**
    - Ensure Excel files are saved with UTF-8 encoding
    - Check if the export format supports Chinese characters

## Code Formatting and Style Guide

This project uses a standardized code formatting configuration to ensure consistency across all files. The following tools and configurations are used:

### Formatting Tools

-   **Prettier**: Handles code formatting according to predefined rules
-   **ESLint**: Enforces code quality and style rules
-   **EditorConfig**: Ensures consistent formatting across different editors
-   **Husky & lint-staged**: Automatically formats and lints code before commits

### Configuration Files

-   `.prettierrc`: Defines Prettier formatting rules (indentation, quotes, etc.)
-   `.prettierignore`: Specifies files and directories to be ignored by Prettier (dist, node_modules, etc.)
-   `.eslintrc.js`: Configures ESLint rules for code quality
-   `.editorconfig`: Sets editor-level formatting rules
-   `.vscode/settings.json`: Configures VSCode-specific settings
-   `.lintstagedrc`: Defines which files to format and lint before commits

### VSCode Integration

For the best development experience in VSCode:

1. Install the recommended extensions:

    - ESLint
    - Prettier
    - EditorConfig for VS Code

2. The project is configured to automatically format files on save

### Manual Formatting

You can manually format code using the following npm scripts:

```bash
# Format all files
npm run format

# Check if files are formatted correctly (without changing them)
npm run format:check

# Run ESLint to check for code quality issues
npm run lint

# Fix ESLint issues automatically
npm run lint:fix
```

### CI/CD Integration

The CI pipeline includes a formatting check step to ensure all code follows the project's formatting standards.
