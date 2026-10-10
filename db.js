// =============================================================
// db.js —— SQLite 数据库模块
// -------------------------------------------------------------
// 这个文件负责：
//   1. 连接（或创建）SQLite 数据库文件
//   2. 初始化 messages 表（如果表不存在则创建）
//   3. 导出 db 实例，供 server.js 直接使用
//
// 我们使用 better-sqlite3 这个库，它的特点是「同步 API」：
//   每一行数据库操作会立刻返回结果，不需要写回调函数或 async/await，
//   对于新手来说代码更直观、更容易理解。
// =============================================================

// 引入 path 模块，用来处理文件路径（跨 Windows / Mac / Linux 兼容）
const path = require('path');

// 引入 fs 模块，用来检查/创建 data 目录
const fs = require('fs');

// 引入 better-sqlite3，返回一个 Database 构造函数
const Database = require('better-sqlite3');

// -------------------------------------------------------------
// 1. 确定数据库文件存放的目录和路径
// -------------------------------------------------------------
// __dirname 是当前文件（db.js）所在的目录，即项目根目录
// 我们把数据库文件放在项目根目录下的 data 文件夹里
const dataDir = path.join(__dirname, 'data');

// 如果 data 目录不存在，就创建它（recursive: true 表示递归创建父目录）
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 数据库文件的完整路径：项目根目录/data/messages.db
const dbPath = path.join(dataDir, 'messages.db');

// -------------------------------------------------------------
// 2. 连接数据库
// -------------------------------------------------------------
// 如果 messages.db 文件不存在，better-sqlite3 会自动创建它
// 第二个参数 { verbose: console.log } 会把执行的 SQL 打印到控制台，
// 方便开发时调试；正式上线时可以去掉。
const db = new Database(dbPath, { verbose: console.log });

// -------------------------------------------------------------
// 3. 初始化 messages 表
// -------------------------------------------------------------
// 表结构说明：
//   id         ：主键，自增整数，每条留言的唯一编号
//   content    ：留言内容，TEXT 类型，不允许为空
//   created_at ：创建时间，TEXT 类型，存储 ISO 格式的时间字符串
//
// CREATE TABLE IF NOT EXISTS 的意思是：
//   如果表已经存在就什么都不做，不存在才创建，
//   这样每次启动服务器都不会报错。
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

// -------------------------------------------------------------
// 4. 导出 db 实例
// -------------------------------------------------------------
// server.js 通过 require('./db') 拿到这个 db 对象，
// 就可以直接用 db.prepare(...) 执行增删改查了。
module.exports = db;
