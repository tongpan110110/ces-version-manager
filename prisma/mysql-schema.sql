-- CES 版本管理系统 - MySQL 数据库表结构
-- 不使用 Prisma，使用纯 MySQL

-- 创建数据库
CREATE DATABASE IF NOT EXISTS ces_version CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ces_version;

-- 1. 局点表
CREATE TABLE IF NOT EXISTS regions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  area VARCHAR(50) NOT NULL COMMENT 'domestic, apac, africa, latam',
  backend_version VARCHAR(50) DEFAULT '',
  frontend_version VARCHAR(50) DEFAULT '',
  target_version VARCHAR(50) DEFAULT '',
  backend_ready BOOLEAN DEFAULT FALSE,
  frontend_ready BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_area (area)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 发布计划表
CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(255) PRIMARY KEY,
  version VARCHAR(50) NOT NULL,
  version_line VARCHAR(50) NOT NULL COMMENT '版本线，如 25.8, 25.10',
  type VARCHAR(50) NOT NULL COMMENT 'Feature Release, Update Release, Patch',
  status VARCHAR(50) NOT NULL DEFAULT 'draft' COMMENT 'draft, testing, ready, released, upgrading, completed, deprecated',
  summary TEXT NOT NULL,
  related_requirements TEXT DEFAULT '[]' COMMENT 'JSON 数组',
  related_bugs TEXT DEFAULT '[]' COMMENT 'JSON 数组',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_version_line (version_line)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 计划时间线表（里程碑）
CREATE TABLE IF NOT EXISTS plan_timelines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id VARCHAR(255) NOT NULL,
  timeline_key VARCHAR(50) NOT NULL COMMENT 'devStart, testStart, testBetaT1, testBetaT2, testBetaT3Gamma, package',
  planned_date DATE DEFAULT NULL,
  actual_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_plan_timeline (plan_id, timeline_key),
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  INDEX idx_plan_id (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 升级窗口表
CREATE TABLE IF NOT EXISTS upgrade_windows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id VARCHAR(255) NOT NULL,
  planned_start_date DATE DEFAULT NULL,
  planned_end_date DATE DEFAULT NULL,
  actual_start_date DATE DEFAULT NULL,
  actual_end_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_plan_window (plan_id),
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 计划组件表
CREATE TABLE IF NOT EXISTS plan_components (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id VARCHAR(255) NOT NULL,
  component_name VARCHAR(255) NOT NULL,
  component_type VARCHAR(50) NOT NULL COMMENT 'frontend, backend',
  current_version VARCHAR(50) NOT NULL,
  target_version VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_plan_component (plan_id, component_name),
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  INDEX idx_plan_id (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 延期原因表
CREATE TABLE IF NOT EXISTS plan_delays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id VARCHAR(255) NOT NULL,
  delay_key VARCHAR(50) NOT NULL COMMENT 'package, upgradeWindow 等',
  delay_type VARCHAR(50) DEFAULT '' COMMENT '需求变更, 技术问题等',
  delay_reason TEXT DEFAULT '',
  owner VARCHAR(255) DEFAULT '',
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  INDEX idx_plan_id (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 版本线表
CREATE TABLE IF NOT EXISTS version_lines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  version_line VARCHAR(50) NOT NULL UNIQUE COMMENT '25.8, 25.10',
  baseline VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 组件表
CREATE TABLE IF NOT EXISTS components (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  type VARCHAR(50) NOT NULL COMMENT 'frontend, backend',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(255) NOT NULL UNIQUE COMMENT 'baseline_25.8, baseline_25.10, active_version_lines',
  config_value TEXT NOT NULL COMMENT '可以是字符串、JSON等',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
