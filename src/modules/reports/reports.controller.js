const reportsService = require('./reports.service');

/**
 * [GET] /admin/reports/revenue
 */
const renderRevenueReport = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;

        // Default range: Last 30 days
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        
        const startDate = start_date ? new Date(start_date) : oneMonthAgo;
        const endDate = end_date ? new Date(end_date) : new Date();

        const report = await reportsService.getRevenueReport(startDate, endDate);

        res.render('admin/reports/revenue', {
            title: 'Báo cáo doanh thu',
            report,
            filters: {
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            },
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /admin/reports/insights
 */
const renderInsightsReport = async (req, res, next) => {
    try {
        const insights = await reportsService.getInsightsReport();
        res.render('admin/reports/insights', {
            title: 'Insight Khách hàng & Sản phẩm',
            insights,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    renderRevenueReport,
    renderInsightsReport
};
