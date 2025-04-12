# CI/CD 设置指南

本文档提供了项目的 CI/CD 设置指南，包括代码质量检查、自动测试和 GitHub Actions 配置。

## 已配置的工具

### 1. ESLint 和 Prettier

ESLint 用于静态代码分析，Prettier 用于代码格式化。

#### 使用方法

-   运行代码检查：

    ```bash
    npm run lint
    ```

-   自动修复代码问题：

    ```bash
    npm run lint:fix
    ```

-   格式化代码：
    ```bash
    npm run format
    ```

### 2. Jest 测试框架

Jest 用于单元测试和集成测试。

#### 使用方法

-   运行测试：

    ```bash
    npm test
    ```

-   生成测试覆盖率报告：
    ```bash
    npm run test:coverage
    ```

### 3. Husky 和 lint-staged

Husky 用于 Git 钩子，lint-staged 用于在提交前运行 lint 和格式化。

#### 工作原理

-   当你执行`git commit`时，husky 会触发 pre-commit 钩子
-   pre-commit 钩子会运行 lint-staged
-   lint-staged 会对暂存的文件运行 ESLint 和 Prettier
-   如果有错误，提交会被阻止

### 4. GitHub Actions

已配置两个 GitHub Actions 工作流：

#### CI 工作流 (.github/workflows/ci.yml)

触发条件：

-   推送到任何分支
-   创建 Pull Request

步骤：

1. 代码检出
2. 设置 Node.js 环境
3. 安装依赖
4. 运行代码质量检查 (ESLint)
5. 运行单元测试和集成测试
6. 生成测试覆盖率报告
7. 构建项目验证

#### CD 工作流 (.github/workflows/release.yml)

触发条件：

-   创建新的发布标签 (格式: `v*.*.*`)

步骤：

1. 代码检出
2. 设置 Node.js 环境
3. 安装依赖
4. 运行测试确认
5. 构建项目
6. 为不同平台构建二进制文件 (Windows, Linux, macOS)
7. 发布到 npm
8. 发布到 GitHub Packages
9. 创建 GitHub Release 并上传二进制文件

## 版本管理流程

项目使用语义化版本(SemVer)进行版本管理，格式为 `X.Y.Z`：

-   **X (主版本号)**: 当进行不兼容的 API 更改时增加
-   **Y (次版本号)**: 当添加向后兼容的功能时增加
-   **Z (修订号)**: 当进行向后兼容的 bug 修复时增加

### 发布流程

1. 确保所有测试通过并且代码质量检查没有问题
2. 更新 CHANGELOG.md，记录本次发布的变更
3. 更新 package.json 中的版本号
4. 提交更改并创建一个新的标签
    ```bash
    git add .
    git commit -m "chore: 发布 vX.Y.Z"
    git tag vX.Y.Z
    git push origin main --tags
    ```

GitHub Actions 将自动构建并发布新版本。

## 分支管理策略

项目采用 GitHub Flow 分支策略：

1. `main`分支始终保持可部署状态
2. 开发新功能或修复 bug 时，从`main`分支创建一个新的功能分支
3. 在功能分支上进行开发和测试
4. 完成开发后，创建 Pull Request 请求合并到`main`分支
5. 代码审查通过后，合并到`main`分支
6. 发布版本时，在`main`分支上创建标签

## 配置文件说明

-   `.eslintrc.js`: ESLint 配置文件
-   `.prettierrc`: Prettier 配置文件
-   `jest.config.js`: Jest 配置文件
-   `.lintstagedrc`: lint-staged 配置文件
-   `.husky/pre-commit`: Git pre-commit 钩子
-   `.github/workflows/ci.yml`: CI 工作流配置
-   `.github/workflows/release.yml`: CD 工作流配置

## 注意事项

1. 提交代码前，确保运行`npm run lint`和`npm test`，确保代码质量和测试通过
2. 遵循[约定式提交](https://www.conventionalcommits.org/zh-hans/v1.0.0/)规范编写提交信息
3. 发布版本前，确保更新 CHANGELOG.md 和 package.json 中的版本号
4. 如需修改 CI/CD 配置，编辑`.github/workflows`目录下的 YAML 文件
