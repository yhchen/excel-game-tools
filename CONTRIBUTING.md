# 贡献指南

感谢您对 excel-game-tools 项目的关注！本文档将指导您如何为项目做出贡献。

## 开发环境设置

1. 克隆仓库

    ```bash
    git clone https://github.com/yhchen/excel-game-tools.git
    cd excel-game-tools
    ```

2. 安装依赖

    ```bash
    npm install
    ```

3. 初始化 husky（如果尚未初始化）
    ```bash
    npm run prepare
    ```

## 开发工作流程

我们采用 GitHub Flow 工作流程：

1. 从`main`分支创建一个新的功能分支

    ```bash
    git checkout -b feature/your-feature-name
    ```

2. 进行开发和测试

    ```bash
    # 运行测试
    npm test

    # 运行代码检查
    npm run lint

    # 格式化代码
    npm run format
    ```

3. 提交您的更改

    ```bash
    git add .
    git commit -m "feat: 添加新功能"
    ```

    > 注意：我们使用[约定式提交](https://www.conventionalcommits.org/zh-hans/v1.0.0/)规范，提交信息应该遵循以下格式：
    >
    > - `feat`: 新功能
    > - `fix`: 修复 bug
    > - `docs`: 文档更新
    > - `style`: 代码风格更改（不影响代码功能）
    > - `refactor`: 代码重构
    > - `perf`: 性能优化
    > - `test`: 添加或修改测试
    > - `chore`: 构建过程或辅助工具的变动

4. 推送到 GitHub

    ```bash
    git push origin feature/your-feature-name
    ```

5. 创建 Pull Request
    - 前往 GitHub 仓库页面
    - 点击"Compare & pull request"
    - 填写 PR 描述，包括您所做的更改和解决的问题
    - 提交 PR

## 代码规范

我们使用 ESLint 和 Prettier 来保证代码质量和一致性：

-   ESLint: 用于静态代码分析，捕获潜在问题
-   Prettier: 用于代码格式化，确保代码风格一致

提交代码前，请确保您的代码通过了 lint 检查并且格式正确：

```bash
# 运行lint检查
npm run lint

# 自动修复lint问题
npm run lint:fix

# 格式化代码
npm run format
```

## 测试

所有新功能和 bug 修复都应该包含测试。我们使用 Jest 作为测试框架：

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage
```

## 版本发布流程

我们使用语义化版本(SemVer)进行版本管理：

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

## 问题和功能请求

如果您发现了 bug 或有新功能建议，请在 GitHub 上创建一个 issue。请尽可能详细地描述问题或建议，包括：

-   对于 bug：复现步骤、预期行为和实际行为
-   对于功能请求：详细描述功能及其用例

## 代码审查

所有 PR 都需要通过代码审查才能合并。审查者将关注：

-   代码质量和风格
-   测试覆盖率
-   文档完整性
-   功能正确性

感谢您的贡献！
