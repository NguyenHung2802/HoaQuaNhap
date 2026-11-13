/**
 * PM2 cho WebHoaQua. VPS 1 vCPU / 1GB RAM chạy chung PostgreSQL + n8n + Nginx nên cấu hình rất tiết kiệm:
 *  - 1 tiến trình (fork), không cluster.
 *  - Giới hạn heap V8 và tự khởi động lại khi RSS vượt ngưỡng (tránh bị kernel OOM-kill làm sập cả VPS).
 *  - kill_timeout đủ dài để ghi nốt thống kê tin ẩn còn trong bộ nhớ khi dừng/khởi động lại.
 * n8n có file cấu hình riêng (xem docs/10-self-host-n8n.md) và KHÔNG nằm trong file này.
 */
module.exports = {
  apps: [
    {
      name: "WebHoaQua-Dev",
      script: "src/server.js",
      watch: ["src"], // Chỉ theo dõi thư mục src để tự reset
      ignore_watch: ["node_modules", "public/uploads", "logs", ".git", "prisma", "docs"],
      max_memory_restart: "1G",
      out_file: "./logs/pm2-out-dev.log",
      error_file: "./logs/pm2-error-dev.log",
      log_file: "./logs/pm2-combined-dev.log",
      time: true,
      env: {
        NODE_ENV: "development",
      }
    },
    {
      name: "WebHoaQua-Prod",
      script: "src/server.js",
      exec_mode: "fork",
      instances: 1,
      watch: false, // Prod thì không watch file để tăng hiệu năng tối đa
      node_args: "--max-old-space-size=192", // heap tối đa ~192MB (RSS thực tế ~250MB)
      max_memory_restart: "280M",
      kill_timeout: 3000, // chờ tối đa 3 giây để flush thống kê trước khi bị kill cứng
      autorestart: true,
      min_uptime: "20s",
      max_restarts: 10,
      restart_delay: 3000,
      out_file: "./logs/pm2-out-prod.log",
      error_file: "./logs/pm2-error-prod.log",
      log_file: "./logs/pm2-combined-prod.log",
      time: true,
      env_production: {
        NODE_ENV: "production",
      }
    }
  ]
};
