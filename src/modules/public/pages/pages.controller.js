const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * [GET] /page/:key
 */
const renderPage = async (req, res, next) => {
    try {
        const { key } = req.params;
        const page = await prisma.setting.findUnique({
            where: { key }
        });

        if (!page || page.group_key !== 'static_page') {
            return res.status(404).render('public/404', { title: '404 Not Found', layout: 'layouts/main' });
        }

        res.render('public/pages/static', {
            title: page.description,
            page,
            layout: 'layouts/main'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    renderPage
};
