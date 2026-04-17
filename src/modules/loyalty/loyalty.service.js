const db = require('../../config/db');

const POINT_VALUE_VND = 1000;
const EARN_RATE_PERCENT = 1;

const toInt = (value) => parseInt(value, 10) || 0;
const toNumber = (value) => Number(value) || 0;

const calculateRedeemDiscount = (points) => {
    return Math.max(0, toInt(points)) * POINT_VALUE_VND;
};

const calculateEarnedPoints = (orderTotal) => {
    const total = Math.max(0, toNumber(orderTotal));
    const earnedValue = (total * EARN_RATE_PERCENT) / 100;
    return Math.floor(earnedValue / POINT_VALUE_VND);
};

const getUserRewardPoints = async (userId, tx = db) => {
    if (!userId) {
        return 0;
    }

    const rows = await tx.$queryRaw`
        SELECT "reward_points"
        FROM "User"
        WHERE "id" = ${toInt(userId)}
        LIMIT 1
    `;

    return toInt(rows[0]?.reward_points);
};

const getCheckoutLoyaltySummary = async (userId, orderTotal, tx = db) => {
    const availablePoints = await getUserRewardPoints(userId, tx);
    const maxUsablePoints = Math.min(availablePoints, Math.floor(Math.max(0, toNumber(orderTotal)) / POINT_VALUE_VND));

    return {
        availablePoints,
        maxUsablePoints,
        maxDiscountAmount: calculateRedeemDiscount(maxUsablePoints),
        pointValueVnd: POINT_VALUE_VND
    };
};

const redeemPointsForOrder = async (tx, { userId, orderId, points, note }) => {
    const safePoints = Math.max(0, toInt(points));
    if (!userId || safePoints <= 0) {
        return;
    }

    const affectedRows = await tx.$executeRaw`
        UPDATE "User"
        SET "reward_points" = "reward_points" - ${safePoints},
            "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ${toInt(userId)}
          AND "reward_points" >= ${safePoints}
    `;

    if (!affectedRows) {
        throw new Error('Số điểm hiện tại không đủ để áp dụng cho đơn hàng này.');
    }

    await tx.$executeRaw`
        INSERT INTO "PointHistory" ("user_id", "order_id", "type", "points", "note", "created_at")
        VALUES (${toInt(userId)}, ${toInt(orderId)}, 'redeem', ${safePoints}, ${note || 'Đổi điểm khi đặt hàng'}, CURRENT_TIMESTAMP)
    `;
};

const awardPointsForOrder = async (tx, { userId, orderId, points, note }) => {
    const safePoints = Math.max(0, toInt(points));
    if (!userId || safePoints <= 0) {
        return;
    }

    await tx.$executeRaw`
        UPDATE "User"
        SET "reward_points" = "reward_points" + ${safePoints},
            "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ${toInt(userId)}
    `;

    await tx.$executeRaw`
        INSERT INTO "PointHistory" ("user_id", "order_id", "type", "points", "note", "created_at")
        VALUES (${toInt(userId)}, ${toInt(orderId)}, 'earn', ${safePoints}, ${note || 'Tích điểm từ đơn hàng thành công'}, CURRENT_TIMESTAMP)
    `;
};

const getOrderPointSummary = async (orderId, tx = db) => {
    if (!orderId) {
        return { usedPoints: 0, earnedPoints: 0 };
    }

    const rows = await tx.$queryRaw`
        SELECT "type", "points"
        FROM "PointHistory"
        WHERE "order_id" = ${toInt(orderId)}
    `;

    return rows.reduce((summary, row) => {
        const points = toInt(row.points);
        if (row.type === 'redeem') {
            summary.usedPoints += points;
        }
        if (row.type === 'earn') {
            summary.earnedPoints += points;
        }
        return summary;
    }, { usedPoints: 0, earnedPoints: 0 });
};

module.exports = {
    POINT_VALUE_VND,
    calculateRedeemDiscount,
    calculateEarnedPoints,
    getUserRewardPoints,
    getCheckoutLoyaltySummary,
    redeemPointsForOrder,
    awardPointsForOrder,
    getOrderPointSummary
};
