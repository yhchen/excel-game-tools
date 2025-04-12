# Changelog

All notable changes to the excel-game-tools project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.2] - 2025-04-12

### Added

-   完整的 CI/CD 工作流配置，支持自动测试、构建和发布
-   GitHub Actions 工作流，用于自动发布到 npm 和 GitHub Packages
-   多平台二进制文件构建支持 (Windows, Linux, macOS)
-   ESLint 和 Prettier 代码质量检查工具
-   Husky 和 lint-staged 用于提交前代码检查
-   Jest 测试框架集成

### Changed

-   优化了 JS 导出模块的性能和稳定性
-   改进了对象和数组类型的序列化处理
-   更新了依赖包版本，提高安全性和性能
-   重构了导出逻辑，提高了代码可维护性

### Fixed

-   修复了 JS 导出时对特殊字符的处理问题
-   修复了数组嵌套导出时的格式化问题
-   修复了空值处理的逻辑错误
-   解决了大型 Excel 文件导出时的内存占用问题

## [3.3.0] - 2025-03-15

### Added

-   新增对 Protocol Buffers 3 格式的导出支持
-   新增对 C# Protobuf-net 格式的导出支持
-   添加了更多的类型验证器
-   新增对 CSV 文件格式的支持

### Changed

-   改进了类型检查系统，提供更详细的错误信息
-   优化了导出性能，提高了大型配置文件的处理速度
-   更新了文档，添加了更多示例和最佳实践

## [3.2.0] - 2025-02-10

### Added

-   新增对复合类型的支持，包括对象、数组和枚举
-   添加了表引用功能，支持跨表数据验证
-   新增默认值设置功能
-   添加了分组过滤功能，支持服务端和客户端数据分离

### Changed

-   重构了核心解析引擎，提高了稳定性
-   改进了错误处理和报告机制
-   优化了内存使用

## [3.1.0] - 2025-01-05

### Added

-   新增对 Lua 格式的导出支持
-   添加了命令行参数支持
-   新增配置文件模板

### Changed

-   改进了 JSON 导出格式
-   优化了类型转换逻辑

## [3.0.0] - 2024-12-01

### Added

-   完全重写的类型系统，支持更多基础类型
-   新的配置文件格式
-   TypeScript 支持
-   详细的文档和示例

### Changed

-   使用 TypeScript 重构整个项目
-   改进了 API 设计，提供更好的扩展性
-   优化了导出流程

### Removed

-   移除了旧版不兼容的配置格式
-   移除了过时的导出选项

## [2.0.0] - 2024-10-15

### Added

-   初始版本的类型检查系统
-   支持 Excel 文件导出到 JSON 和 JS 格式
-   基本的验证器功能

## [1.0.0] - 2024-09-01

### Added

-   项目初始版本
-   基本的 Excel 导出功能
-   支持 JSON 格式导出
