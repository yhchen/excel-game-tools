# Excel 配置导出工具

## 简介

这是一个高效的 Excel/CSV 配置导出工具，专为游戏开发者设计，用于将 Excel 表格数据导出为多种格式（JSON、JS、Lua、Protobuf 等），并提供强大的类型检查功能，确保游戏配置数据的正确性和一致性。

主要特点：
- 支持导出为多种格式：JSON、JS、Lua、Protocol Buffers 等
- 强大的类型检查系统，支持基本类型、数组、对象、枚举等
- 支持自定义类型定义和验证规则
- 支持 Excel 和 CSV 文件格式
- 支持数据引用和关联检查
- 高性能处理大型配置文件

## 安装和环境配置

### 环境要求
- Node.js 环境
- TypeScript 支持

### 安装步骤

1. 克隆或下载项目代码
2. 安装依赖包：
```bash
npm install
```
3. 编译项目：
```bash
npm run build
```

## 基本使用流程

1. 准备 Excel/CSV 配置文件，按照规定格式填写数据
2. 创建配置文件 `config.json`，设置导入和导出选项
3. 编写类型定义文件（如 `typeDef.ts`）
4. 运行导出命令：
```bash
node dist/index.js -c config.json -t typeDef.js
```

## Excel/CSV 文件格式规范

### 表格结构

Excel 表格需要按照以下结构组织：

1. **表名行**：第一行为表名，A1 单元格通常为表格的标识符
2. **分组过滤行**（可选）：以 `$` 开头的行，用于设置列的分组
3. **列名行**：定义每列的名称，必须是有效的标识符（字母、数字、下划线）
4. **类型行**：定义每列的数据类型，A列通常为 `*` 标记
5. **数据行**：实际的配置数据

### 特殊标记规则

- 文件名或表名以 `!` `#` `.` `~$` `$` 开头的会被忽略
- 列名以 `#` 开头表示注释列，不会被导出
- 行首单元格（A列）以 `#` 开头表示注释行，不会被导出

### 示例表格

| *      | Id    | Name   | Type  | Value | Desc   |
|--------|-------|--------|-------|-------|--------|
| $      | *     | *      | *     | *     | *      |
| *      | int<!!;!0> | string<!N> | int   | float  | string |
| #注释行 |       |        |       |       |        |
|        | 1001  | 物品1   | 1     | 10.5  | 这是物品1 |
|        | 1002  | 物品2   | 2     | 20.3  | 这是物品2 |

### 分组过滤行详解

分组过滤行以 `$` 开头，用于设置每列的分组标识。在配置文件的 `GroupMap` 中定义分组，然后在导出配置的 `GroupFilter` 中指定要导出的分组。

例如：

| *      | Id    | Name   | Type  | Value | Desc   |
|--------|-------|--------|-------|-------|--------|
| $      | *     | S      | C     | *     | *      |

上面的配置表示：
- `Id` 列属于所有分组（`*`）
- `Name` 列仅属于服务端分组（`S`）
- `Type` 列仅属于客户端分组（`C`）
- `Value` 和 `Desc` 列属于所有分组（`*`）

在导出配置中，如果设置 `"GroupFilter": ["C"]`，则只会导出 `Id`、`Type`、`Value` 和 `Desc` 列。

## 类型系统和类型检查

### 基本类型

| 类型 | 描述 | 取值范围 |
|------|------|---------|
| `char` | 有符号字符 | -127 ~ 127 |
| `uchar` | 无符号字符 | 0 ~ 255 |
| `short` | 有符号短整型 | -32768 ~ 32767 |
| `ushort` | 无符号短整型 | 0 ~ 65535 |
| `int` | 有符号整型 | -2147483648 ~ 2147483647 |
| `uint` | 无符号整型 | 0 ~ 4294967295 |
| `int64` | 有符号长整型 | -9223372036854775808 ~ 9223372036854775807 |
| `uint64` | 无符号长整型 | 0 ~ 18446744073709551615 |
| `string` | 字符串 | 自动将换行符转换为 '\n' |
| `double` | 双精度浮点数 | 无限制 |
| `float` | 单精度浮点数 | 无限制 |
| `bool` | 布尔值 | true: 'true'或'1'，false: 'false'、空值或'0' |
| `date` | 日期时间 | YYYY/MM/DD HH:mm:ss |
| `tinydate` | 日期 | YYYY/MM/DD |
| `timestamp` | 时间戳 | Linux 时间戳 |
| `utctime` | UTC 时间戳 | UTC 时间戳 |

### 组合类型

| 类型 | 描述 |
|------|------|
| `<type>[<N> or null]` | 数组类型，`<type>` 为基本类型或组合类型，`<N>` 为数组长度（可选） |
| `vector2` | 等同于 `float[2]`，常用于表示二维坐标 |
| `vector3` | 等同于 `float[3]`，常用于表示三维坐标 |

### 数组格式

数组使用分隔符来区分不同层级：
- 第一级分隔符：`;`（可在配置中修改）
- 第二级分隔符：`/`（可在配置中修改）
- 第三级分隔符：`\n`（可在配置中修改）

例如，对于类型 `int[][]`，数据 `1;2/3;4;5` 表示 `[[1,2,3], [4,5]]`。

**注意**：为了更好的数值配置体验，建议数组嵌套深度不要超过三层。

#### 数组示例

1. 一维数组 `int[]`：
   ```
   1;2;3;4;5
   ```
   解析结果：`[1, 2, 3, 4, 5]`

2. 二维数组 `int[][]`：
   ```
   1;2/3;4;5/6
   ```
   解析结果：`[[1, 2], [3, 4, 5], [6]]`

3. 三维数组 `int[][][]`：
   ```
   1/2
   3;4/5
   6;7;8
   ```
   解析结果：`[[[1], [2]], [[3, 4], [5]], [[6, 7, 8]]]`

4. 固定长度数组 `int[3]`：
   ```
   1;2;3
   ```
   解析结果：`[1, 2, 3]`（如果元素数量不等于3，会报错）

### 列验证器详解

验证器用于增强类型检查，确保数据符合特定规则。验证器添加在类型后面，使用尖括号 `<>` 包裹。

#### 基本验证器

- `<!!>` : 唯一值验证器
  - 确保该列中的所有值都是唯一的，不允许重复
  - 常用于 ID 列或其他需要唯一标识的字段
  - 示例：`int<!!>`

- `<!N>` : 非空验证器
  - 确保该列的值不能为空
  - 适用于必填字段
  - 示例：`string<!N>`

- `<!0>` : 非零验证器
  - 确保该列的值不能为 0
  - 适用于不允许为零的数值字段，如物品数量、倍率等
  - 示例：`int<!0>`

#### 组合验证器

可以组合使用多个验证器，用分号 `;` 分隔：

- `int<!!;!0>` : 值必须唯一且不能为 0
- `string<!N;!!>` : 值不能为空且必须唯一

#### 验证器使用示例

| *      | Id           | Name        | Count      | Rate       |
|--------|--------------|-------------|------------|------------|
| *      | int<!!;!0>   | string<!N>  | int<!0>    | float      |
|        | 1001         | 物品1        | 10         | 1.5        |
|        | 1002         | 物品2        | 5          | 0.8        |

在上面的示例中：
- `Id` 列的值必须唯一且不能为 0
- `Name` 列的值不能为空
- `Count` 列的值不能为 0
- `Rate` 列没有特殊验证

### 复合类型详解

复合类型是由基本类型组合而成的更复杂的数据结构，包括对象、数组、枚举等。

#### 对象类型

对象类型用于表示具有多个属性的复杂数据结构。在 Excel 中，对象类型通常使用分隔符分隔各个属性值。

**定义方式**：
```typescript
typeDefs.Position = def.TObject({
    x: int,
    y: int,
    width: int,
    height: int,
});
```

**Excel 中的使用**：
```
10;20;100;50
```
解析结果：`{ x: 10, y: 20, width: 100, height: 50 }`

#### 嵌套对象

对象可以嵌套包含其他对象或数组：

```typescript
typeDefs.Character = def.TObject({
    id: int,
    name: string,
    position: typeDefs.Position,
    stats: def.TObject({
        hp: int,
        mp: int,
        attack: int,
        defense: int
    })
});
```

**Excel 中的使用**：
```
1001;英雄;10;20;100;50;1000;500;80;60
```
解析结果：
```json
{
    "id": 1001,
    "name": "英雄",
    "position": { "x": 10, "y": 20, "width": 100, "height": 50 },
    "stats": { "hp": 1000, "mp": 500, "attack": 80, "defense": 60 }
}
```

#### 带验证的对象

对象类型可以添加自定义验证函数：

```typescript
typeDefs.Award = def.TObject({
    type: EItemType,
    id: int,
    count: int64,
}, function (data) {
    // 根据类型验证 id 是否存在于对应表中
    switch (data.type) {
        case EItemType.Equip:
            return Sheets.Equip.id(data.id);
        case EItemType.Item:
            return Sheets.Item.id(data.id);
    }
});
```

#### 枚举类型

枚举类型用于表示一组命名常量：

```typescript
const EItemType = typeDefs.EItemType = def.TEnum({
    Invalid: 0,
    Item: 1,    // 普通物品
    Equip: 2,   // 装备
    Pet: 101,   // 宠物
});
```

**Excel 中的使用**：
可以使用枚举的名称或值：
```
Item    // 或者直接使用 1
```

#### 表引用类型

表引用类型用于引用其他表格中的数据，确保数据一致性：

```typescript
// 定义引用 Item 表的 id 列
typeDefs.ItemId = Sheets.Item.id;

// 使用引用类型
typeDefs.Equipment = def.TObject({
    id: int<!!>,
    name: string,
    requiredItem: typeDefs.ItemId  // 确保引用的物品 ID 存在
});
```

#### JSON 解析模式

对于特别复杂的数据结构，可以使用 JSON 字符串直接在 Excel 中配置：

```typescript
// 定义 JSON 对象类型
const KVJson = typeDefs.KVJson = def.TJson({
    key: int.DVAL(1),  // 默认值为 1
    value: int,
});
```

**Excel 中的使用**：
```
{"key": 5, "value": 100}
```

### 自定义类型定义

可以在 `typeDef.ts` 文件中定义自定义类型：

```typescript
// 定义枚举类型
const EItemType = typeDefs.EItemType = def.TEnum({
    Invalid: 0,
    Item: 1,    // 普通物品
    Equip: 2,   // 装备
    Pet: 101,   // 宠物
});

// 定义对象类型
typeDefs.Position = def.TObject({
    x: int,
    y: int,
    width: int,
    height: int,
});

// 定义数组类型
typeDefs.Vector3 = def.TArray(float, 3);

// 定义引用其他表的类型
typeDefs.EquipId = Sheets.Equip.id;

// 定义带验证的复杂类型
typeDefs.Award = def.TObject({
    type: EItemType,
    id: int,
    count: int64,
}, function (data) {
    // 根据类型验证 id 是否存在于对应表中
    switch (data.type) {
        case EItemType.Equip:
            return Sheets.Equip.id(data.id);
        case EItemType.Item:
            return Sheets.Item.id(data.id);
    }
});
```

### 默认值设置

可以为类型设置默认值，当单元格为空时使用：

```typescript
// 设置默认值为 0
const defaultInt = int.DVAL(0);

// 设置默认值为 "未知"
const defaultString = string.DVAL("未知");

// 在对象中使用默认值
typeDefs.Item = def.TObject({
    id: int<!!>,
    name: string.DVAL("未命名物品"),
    type: EItemType.DVAL(EItemType.Invalid),
    count: int.DVAL(1)
});
```

## 配置文件详解

配置文件 `config.json` 用于设置导入和导出选项：

```json
{
    "IncludeFilesAndPath": [
        "./testcase"  // 要处理的文件和目录
    ],
    "GroupMap": {
        "*": "(All) Default value",  // 默认分组
        "A": "Server And Client",    // 服务端和客户端
        "S": "Server",               // 仅服务端
        "C": "Client"                // 仅客户端
    },
    "Export": [
        {
            "type": "json",                  // 导出类型
            "OutputDir": "./exports/json/",  // 输出目录
            "GroupFilter": ["C"],            // 分组过滤
            "UseDefaultValueIfEmpty": false  // 空值是否使用默认值
        },
        // 可以配置多个导出目标
    ],
    "DateFmt": "YYYY/MM/DD HH:mm:ss",  // 日期格式
    "TinyDateFmt": "YYYY/MM/DD",       // 简短日期格式
    "TypeCheckerJSFilePath": "./typeDef",  // 类型定义文件路径
    "EnableDebugOutput": true,         // 是否启用调试输出
    "ArraySpliter": [",", ";", "\n"]   // 数组分隔符
}
```

### 配置项详解

#### IncludeFilesAndPath

指定要处理的文件和目录路径，可以是相对路径或绝对路径：

```json
"IncludeFilesAndPath": [
    "./testcase",           // 处理 testcase 目录下的所有文件
    "./configs/items.xlsx"  // 处理特定的 Excel 文件
]
```

#### GroupMap

定义分组映射，用于过滤导出的列：

```json
"GroupMap": {
    "*": "(All) Default value",  // 默认分组，所有导出配置都会包含
    "A": "Server And Client",    // 服务端和客户端共用
    "S": "Server",               // 仅服务端
    "C": "Client"                // 仅客户端
}
```

#### Export

定义导出配置，可以配置多个导出目标：

```json
"Export": [
    {
        "type": "json",                  // 导出类型
        "OutputDir": "./exports/json/",  // 输出目录
        "GroupFilter": ["C"],            // 分组过滤
        "UseDefaultValueIfEmpty": false, // 空值是否使用默认值
        "NameTranslate": {               // 列名转换
            "Id": "_id"
        }
    }
]
```

#### 其他配置项

- `DateFmt`：日期格式，默认为 `"YYYY/MM/DD HH:mm:ss"`
- `TinyDateFmt`：简短日期格式，默认为 `"YYYY/MM/DD"`
- `TypeCheckerJSFilePath`：类型定义文件路径
- `EnableDebugOutput`：是否启用调试输出
- `ArraySpliter`：数组分隔符，默认为 `[",", ";", "\n"]`
- `TimeStampUseMS`：时间戳是否使用毫秒，默认为 `true`
- `FractionDigitsFMT`：小数位数格式，默认为 `6`

## 导出格式说明

### JSON 格式

```json
{
    "type": "json",
    "OutputDir": "./exports/json/",  // 目录则每个表单独导出，文件则合并导出
    "GroupFilter": ["C"],            // 分组过滤
    "UseDefaultValueIfEmpty": false  // 空值是否使用默认值
}
```

导出结果示例：
```json
{
    "1001": {
        "_id": 1001,
        "name": "物品1",
        "type": 1,
        "value": 10.5
    },
    "1002": {
        "_id": 1002,
        "name": "物品2",
        "type": 2,
        "value": 20.3
    },
    "_ids": [1001, 1002]
}
```

### JavaScript 格式

```json
{
    "type": "js",
    "OutputDir": "./exports/js/",
    "ExportTemple": "export const {name}={data}",  // 导出模板
    "GroupFilter": ["S", "C", "*"]
}
```

导出结果示例：
```javascript
export const Item={
    "1001": {
        "id": 1001,
        "name": "物品1",
        "type": 1,
        "value": 10.5
    },
    "1002": {
        "id": 1002,
        "name": "物品2",
        "type": 2,
        "value": 20.3
    },
    "_ids": [1001, 1002]
}
```

### Lua 格式

```json
{
    "type": "lua",
    "OutputDir": "./exports/lua/",
    "ExportTemple": "local {name} = {data}\n\nreturn {name}",
    "UseShortName": true  // 是否使用短名称压缩键名
}
```

导出结果示例（使用短名称）：
```lua
local Item = {
    [1001] = {
        a = 1001,  -- id
        b = "物品1", -- name
        c = 1,     -- type
        d = 10.5   -- value
    },
    [1002] = {
        a = 1002,  -- id
        b = "物品2", -- name
        c = 2,     -- type
        d = 20.3   -- value
    },
    _ids = {1001, 1002}
}

return Item
```

### Protocol Buffers 格式

```json
{
    "type": "proto3",
    "OutputDir": "./exports/proto3.proto",      // 输出协议文件
    "OutputDataDir": "./exports/proto3-data/",  // 输出数据文件
    "Namespace": "GameConfig",                  // 命名空间
    "ARRAY_ELEMENT_NAME": "list"                // 数组元素名称
}
```

导出结果示例（协议文件）：
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

### C# Protobuf-net 格式

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

导出结果示例：
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

## 命令行参数

```
node dist/index.js [options...]
```

选项：
- `-c` : 配置文件路径
- `-t` : 类型定义文件路径
- `--debug-output` : 1 启用调试输出，0 关闭调试输出

## 最佳实践

### 游戏配置数据组织

1. **合理规划表格结构**：
   - 将相关配置放在同一个表格中
   - 使用有意义的列名和注释
   - 为重要字段添加验证器

2. **使用类型定义增强数据验证**：
   - 定义枚举类型规范化常量值
   - 使用对象类型组织复杂数据
   - 添加自定义验证函数处理复杂业务逻辑

3. **利用分组功能分离数据**：
   - 使用分组标记区分服务端和客户端数据
   - 只导出必要的数据到客户端，减小包体积

4. **建立数据引用关系**：
   - 使用表引用确保数据一致性
   - 例如：物品表的 ID 被装备表引用时，确保 ID 存在

### 性能优化

1. 对于大型配置，考虑拆分为多个表格
2. 使用 `--debug-output 0` 关闭调试输出提高性能
3. 对于客户端，考虑使用 `UseShortName: true` 减小数据体积

### 实际应用场景

#### 游戏物品系统

```typescript
// 物品类型枚举
const EItemType = typeDefs.EItemType = def.TEnum({
    Invalid: 0,
    Consumable: 1,  // 消耗品
    Equipment: 2,   // 装备
    Material: 3,    // 材料
    Currency: 4,    // 货币
});

// 物品品质枚举
const EItemQuality = typeDefs.EItemQuality = def.TEnum({
    Common: 1,      // 普通
    Uncommon: 2,    // 优秀
    Rare: 3,        // 稀有
    Epic: 4,        // 史诗
    Legendary: 5,   // 传说
});

// 装备位置枚举
const EEquipSlot = typeDefs.EEquipSlot = def.TEnum({
    None: 0,
    Head: 1,        // 头部
    Body: 2,        // 身体
    Hands: 3,       // 手部
    Feet: 4,        // 脚部
    Weapon: 5,      // 武器
    Accessory: 6,   // 饰品
});

// 物品基础属性
typeDefs.ItemBase = def.TObject({
    id: int<!!;!0>,         // 唯一ID，不为0
    name: string<!N>,       // 名称，非空
    icon: string,           // 图标路径
    description: string,    // 描述
    type: EItemType,        // 物品类型
    quality: EItemQuality,  // 品质
    stackLimit: int.DVAL(1) // 堆叠上限，默认1
});

// 装备属性
typeDefs.EquipmentStats = def.TObject({
    attack: int.DVAL(0),    // 攻击力
    defense: int.DVAL(0),   // 防御力
    health: int.DVAL(0),    // 生命值
    critRate: float.DVAL(0) // 暴击率
});

// 装备定义
typeDefs.Equipment = def.TObject({
    baseInfo: typeDefs.ItemBase,        // 基础信息
    slot: EEquipSlot,                   // 装备位置
    level: int<!0>,                     // 等级要求，非0
    stats: typeDefs.EquipmentStats,     // 属性
    setId: int.DVAL(0)                  // 套装ID，0表示不属于套装
});
```

## 常见问题和解决方案

1. **导出失败，提示类型错误**
   - 检查 Excel 中的数据类型是否与定义匹配
   - 检查是否有必填字段为空

2. **数组数据格式错误**
   - 确认使用了正确的分隔符
   - 检查数组嵌套层级是否正确

3. **引用检查失败**
   - 确保被引用的表格和列已正确加载
   - 检查引用的 ID 是否存在于目标表中

4. **中文或特殊字符显示问题**
   - 确保 Excel 文件使用 UTF-8 编码保存
   - 检查导出格式是否支持中文字符
