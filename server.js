// =============================================================
// server.js —— Express 服务器入口
// -------------------------------------------------------------
// 这个文件负责：
//   1. 创建 Express 应用
//   2. 托管前端静态页面（public 目录）
//   3. 提供两个 API 接口：
//        GET  /api/messages   获取所有留言
//        POST /api/messages   新增一条留言
//   4. 监听端口，启动服务
// =============================================================

// 引入 express 框架
const express = require('express');

// 引入我们自己写的数据库模块（db.js 导出的 db 实例）
const db = require('./db');

// 创建一个 Express 应用
const app = express();

// 服务器监听的端口，3000 是常用的开发端口
const PORT = 3000;

// -------------------------------------------------------------
// 中间件（Middleware）配置
// -------------------------------------------------------------

// express.json() 中间件：
//   它会解析请求体中的 JSON 数据，
//   解析后的数据会挂在 req.body 上供我们使用。
//   比如前端发送 { "content": "你好" }，我们就能通过 req.body.content 拿到。
app.use(express.json());

// express.static() 中间件：
//   把 public 目录下的文件作为静态资源对外提供。
//   浏览器访问 http://localhost:3000/ 时，
//   Express 会自动返回 public/index.html 文件。
//   这样前端页面和后端 API 就在同一个域名下（同域），
//   不存在跨域问题，前端直接用相对路径 /api/messages 即可。
app.use(express.static('public'));

// -------------------------------------------------------------
// 接口 1：GET /api/messages
// -------------------------------------------------------------
// 作用：返回数据库中所有留言，按创建时间倒序排列（最新的在前面）
app.get('/api/messages', (req, res) => {
  try {
    // db.prepare(sql) 是 better-sqlite3 的写法：
    //   先准备一条 SQL 语句，再调用 .all() 执行并返回所有结果行。
    // ORDER BY created_at DESC 表示按 created_at 字段降序排列。
    const messages = db.prepare(
      'SELECT id, content, created_at FROM messages ORDER BY created_at DESC'
    ).all();

    // 返回 JSON 格式的响应
    // 统一格式：{ success: 是否成功, data: 数据 }
    res.json({ success: true, data: messages });
  } catch (err) {
    // 如果出错，打印错误并返回 500 状态码
    console.error('查询留言失败：', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// -------------------------------------------------------------
// 接口 2：POST /api/messages
// -------------------------------------------------------------
// 作用：新增一条留言
// 请求体格式：{ "content": "留言内容" }
app.post('/api/messages', (req, res) => {
  try {
    // 从请求体中取出 content 字段
    const content = req.body.content;

    // 简单校验：内容不能为空，且去掉首尾空格后长度不能为 0
    if (!content || content.trim().length === 0) {
      // 400 表示「客户端请求有误」
      return res.status(400).json({ success: false, message: '留言内容不能为空' });
    }

    // 限制一下留言长度，避免超长内容
    if (content.length > 500) {
      return res.status(400).json({ success: false, message: '留言内容不能超过 500 个字符' });
    }

    // 生成当前时间的 ISO 格式字符串，例如：2026-10-09T06:30:00.000Z
    const createdAt = new Date().toISOString();

    // 执行 INSERT 语句
    //   db.prepare(sql).run(params) 用来执行增删改，
    //   返回值中包含 lastInsertRowid（新插入行的 id）。
    //   SQL 中的 ? 是占位符，better-sqlite3 会自动把参数安全地填入，
    //   防止 SQL 注入攻击。
    const result = db.prepare(
      'INSERT INTO messages (content, created_at) VALUES (?, ?)'
    ).run(content.trim(), createdAt);

    // 把新插入的留言查出来返回给前端
    const newMessage = db.prepare(
      'SELECT id, content, created_at FROM messages WHERE id = ?'
    ).get(result.lastInsertRowid);

    // 返回 201 状态码（表示资源创建成功）和新留言数据
    res.status(201).json({ success: true, data: newMessage });
  } catch (err) {
    console.error('新增留言失败：', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// -------------------------------------------------------------
// 启动服务器
// -------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  留言板服务器已启动！`);
  console.log(`  访问地址：http://localhost:${PORT}`);
  console.log(`  接口地址：http://localhost:${PORT}/api/messages`);
  console.log(`========================================`);
});
