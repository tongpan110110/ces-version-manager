/**
 * 不使用 Prisma，直接操作 MySQL 的示例
 * 如果你的 Windows 已经安装了 MySQL，可以用这个方式
 */

// 安装 mysql2: npm install mysql2
const mysql = require('mysql2/promise')

// 创建连接
async function getMySQLConnection() {
  return await mysql.createConnection({
    host: 'localhost',
    user: 'root',      // 你的 MySQL 用户名
    password: '',      // 你的 MySQL 密码
    database: 'ces_version'
  })
}

// 查询所有局点
async function getRegions() {
  const connection = await getMySQLConnection()
  const [rows] = await connection.execute('SELECT * FROM regions')
  await connection.end()
  return rows
}

// 创建局点
async function createRegion(region) {
  const connection = await getMySQLConnection()
  await connection.execute(
    'INSERT INTO regions (name, area, backend_version, frontend_version, target_version) VALUES (?, ?, ?, ?, ?)',
    [region.name, region.area, region.backendVersion, region.frontendVersion, region.targetVersion]
  )
  await connection.end()
}

module.exports = { getRegions, createRegion }
