const app = require('./app');

// Ghi nốt thống kê tin ẩn còn trong bộ nhớ khi PM2/hệ thống dừng tiến trình
require('./modules/news-stats/news-stats.service').registerShutdownFlush();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
});
