/**
 * MySQL 数据库连接工具
 * 不使用 Prisma，直接使用 mysql2
 */

import mysql from 'mysql2/promise'

// 数据库配置 - 从环境变量读取，或使用默认值
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'ces_version',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
}

// 创建连接池
const pool = mysql.createPool(dbConfig)

/**
 * 执行查询
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.execute(sql, params)
    return rows as T[]
  } finally {
    connection.release()
  }
}

/**
 * 执行单条查询
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows.length > 0 ? rows[0] : null
}

/**
 * 插入数据并返回插入的 ID
 */
export async function insert(sql: string, params?: any[]): Promise<number> {
  const connection = await pool.getConnection()
  try {
    const [result] = await connection.execute(sql, params)
    return (result as any).insertId
  } finally {
    connection.release()
  }
}

/**
 * 更新数据并返回影响的行数
 */
export async function update(sql: string, params?: any[]): Promise<number> {
  const connection = await pool.getConnection()
  try {
    const [result] = await connection.execute(sql, params)
    return (result as any).affectedRows
  } finally {
    connection.release()
  }
}

/**
 * 删除数据并返回影响的行数
 */
export async function remove(sql: string, params?: any[]): Promise<number> {
  return update(sql, params)
}

/**
 * 测试数据库连接
 */
export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT 1')
    return true
  } catch (error) {
    console.error('数据库连接失败:', error)
    return false
  }
}

export default pool
