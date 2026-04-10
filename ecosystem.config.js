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
      watch: false, // Prod thì không watch file để tăng hiệu năng tối đa
      max_memory_restart: "1G",
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
