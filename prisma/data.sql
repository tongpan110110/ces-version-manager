-- CES 版本管理系统 - 完整数据导入 SQL
-- 包含所有计划、局点、组件、里程碑等数据

USE ces_version;

-- 1. 版本线数据
INSERT INTO version_lines (version_line, baseline, is_active) VALUES
('25.10', '25.10.0', 1),
('26.1', '26.1.0', 1);

-- 2. 组件数据
INSERT INTO components (name, description, type) VALUES
('CES-Portal', '前端', 'frontend'),
('CES-GO-API', '', 'backend'),
('CES-HERMES', '', 'backend'),
('CES-ALARM', '', 'backend'),
('CES-ALARM-ROUTER', '', 'backend'),
('CES-ALARM-CALCULATOR', '', 'backend'),
('CES-ALARM-MANAGER', '', 'backend'),
('CES-CONSUMER-ADAPTOR', '', 'backend'),
('CES-TASK-CENTER', '', 'backend'),
('CES-POROS', '', 'backend'),
('CES-METIS', '', 'backend'),
('CES-SCHEDULER', '', 'backend'),
('CES-EVENTPROCESSOR', '', 'backend'),
('CES-AdminServer', '', 'backend'),
('CES-ADMIN-MANAGER', '', 'backend'),
('CES-AGENTSERVER', '', 'backend'),
('CES-UniagentTaskMgr', '', 'backend'),
('CES-UniAgentAgent', '', 'backend'),
('CES-TELESCOPE', '', 'backend');

-- 3. 系统配置
INSERT INTO system_configs (config_key, config_value) VALUES
('baseline_25.8', '25.8.2'),
('baseline_25.10', '25.10.0'),
('active_version_lines', '["25.8","25.10"]');

-- 4. 发布计划
INSERT INTO plans (id, version, version_line, type, status, summary, related_requirements, related_bugs, created_at, updated_at) VALUES
('4', '25.10.0', '25.10', 'Feature Release', 'upgrading', '25.10.0的基线版本', '["REQ-101","REQ-102"]', '[]', '2024-04-01 00:00:00', '2026-01-15 03:03:18'),
('1768445696762', '26.1.0', '26.1', 'Feature Release', 'testing', '当前Beta_T1测试阶段', '[]', '[]', '2026-01-15 02:54:56', '2026-01-15 08:41:52');

-- 5. 37个局点数据
INSERT INTO regions (name, area, backend_version, frontend_version, target_version, backend_ready, frontend_ready) VALUES
('广州友好', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 1, 1),
('乌兰察布二零一', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 1, 1),
('乌兰察布二零二', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('深圳', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('布宜诺斯艾利斯', 'latam', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('利马一', 'latam', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('利雅得', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('非洲-开罗', 'africa', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('土耳其-伊斯坦布尔', 'africa', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('拉美-墨西哥城一', 'latam', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('亚太-马尼拉', 'apac', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('亚太-雅加达', 'apac', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('华东二', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('华北三', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('汽车二', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('西南-贵阳一', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('华北-乌兰察布-汽车一', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('华东-上海二', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('非洲-约翰内斯堡', 'africa', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('俄罗斯-莫斯科二', 'africa', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('亚太-曼谷', 'apac', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('中国-香港', 'apac', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('拉美-圣地亚哥', 'latam', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('华北-北京二零一', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('华北-乌兰察布二零七', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('华东-芜湖二零一', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('亚太-新加坡', 'apac', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('拉美-墨西哥城二', 'latam', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('华南-广州', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('华北-北京一', 'domestic', '25.8.3', '25.8.3.1', '25.10.0', 0, 0),
('华北-北京四', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('华北-北京二', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('华北-乌兰察布一', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('华东-上海一', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('拉美-圣保罗一', 'latam', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('华南-东莞二零一', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0),
('西南-贵阳二零一', 'domestic', '25.8.2', '25.8.3.1', '25.10.0', 0, 0);

-- 6. 计划时间线（26.1.0 的里程碑）
INSERT INTO plan_timelines (plan_id, timeline_key, planned_date, actual_date) VALUES
('1768445696762', 'devStart', '2026-01-09', '2026-01-09'),
('1768445696762', 'testStart', '2026-02-14', NULL),
('1768445696762', 'package', '2026-02-26', NULL);

-- 7. 升级窗口
INSERT INTO upgrade_windows (plan_id, planned_start_date, planned_end_date) VALUES
('1768445696762', '2026-02-27', '2026-04-30');

-- 8. 计划组件（25.10.0 的18个组件）
INSERT INTO plan_components (plan_id, component_name, component_type, current_version, target_version, enabled) VALUES
('4', 'CES-Portal', 'frontend', '25.8.3.1', '25.10.0', 1),
('4', 'CES-GO-API', 'backend', '25.8.2', '25.10.0', 1),
('4', 'CES-HERMES', 'backend', '25.8.0', '25.10.0', 1),
('4', 'CES-ALARM', 'backend', '25.8.0', '25.10.0', 1),
('4', 'CES-ALARM-ROUTER', 'backend', '25.8.0', '25.10.0', 1),
('4', 'CES-ALARM-CALCULATOR', 'backend', '25.8.0', '25.10.0', 1),
('4', 'CES-ALARM-MANAGER', 'backend', '25.8.0', '25.10.0', 1),
('4', 'CES-CONSUMER-ADAPTOR', 'backend', '25.8.0.2', '25.10.0', 1),
('4', 'CES-TASK-CENTER', 'backend', '25.8.1.1', '25.10.0', 1),
('4', 'CES-POROS', 'backend', '25.7.0', '25.10.0', 1),
('4', 'CES-METIS', 'backend', '25.7.0', '25.10.0', 1),
('4', 'CES-SCHEDULER', 'backend', '25.7.0', '25.10.0', 1),
('4', 'CES-EVENTPROCESSOR', 'backend', '25.7.0', '25.10.0', 1),
('4', 'CES-AdminServer', 'backend', '25.7.0', '25.10.0', 1),
('4', 'CES-ADMIN-MANAGER', 'backend', '25.8.2', '25.10.0', 1),
('4', 'CES-AGENTSERVER', 'backend', '25.8.2', '25.10.0', 1),
('4', 'CES-UniagentTaskMgr', 'backend', '25.8.2', '25.10.0', 1),
('4', 'CES-UniAgentAgent', 'backend', '0.2.3', '0.2.5', 1),
('4', 'CES-TELESCOPE', 'backend', '2.7.6', '2.8.2', 1);

-- 9. 计划组件（26.1.0 的15个组件）
INSERT INTO plan_components (plan_id, component_name, component_type, current_version, target_version, enabled) VALUES
('1768445696762', 'CES-Portal', 'frontend', '25.10.0', '26.1.0', 1),
('1768445696762', 'CES-GO-API', 'backend', '25.10.0', '26.1.0', 1),
('1768445696762', 'CES-HERMES', 'backend', '25.10.0', '26.1.0', 1),
('1768445696762', 'CES-ALARM', 'backend', '25.10.0', '26.1.0', 1),
('1768445696762', 'CES-ALARM-ROUTER', 'backend', '25.10.0', '26.1.0', 1),
('1768445696762', 'CES-ALARM-CALCULATOR', 'backend', '25.10.0', '26.1.0', 1),
('1768445696762', 'CES-ALARM-MANAGER', 'backend', '25.10.0', '26.1.0', 1),
('1768445696762', 'CES-CONSUMER-ADAPTOR', 'backend', '25.10.0', '26.1.0', 1),
('1768445696762', 'CES-TASK-CENTER', 'backend', '25.10.0', '26.1.0', 1),
('1768445696762', 'CES-POROS', 'backend', '25.10.0', '26.1.0', 1),
('1768445696762', 'CES-METIS', 'backend', '25.10.0', '26.1.0', 1),
('1768445696762', 'CES-SCHEDULER', 'backend', '25.10.0', '26.1.0', 1),
('1768445696762', 'CES-EVENTPROCESSOR', 'backend', '25.10.0', '26.1.0', 1),
('1768445696762', 'CES-AdminServer', 'backend', '25.10.0', '26.1.0', 1),
('1768445696762', 'CES-ADMIN-MANAGER', 'backend', '25.10.0', '26.1.0', 1),
('1768445696762', 'CES-AGENTSERVER', 'backend', '25.10.0', '26.1.0', 1),
('1768445696762', 'CES-UniagentTaskMgr', 'backend', '25.10.0', '26.1.0', 1);

-- 10. 延期原因记录
INSERT INTO plan_delays (plan_id, delay_key, delay_type, delay_reason, owner, recorded_at) VALUES
('1768445696762', 'package', '需求变更', 'xxxxx', 'xxx', '2026-01-19 06:41:03');
