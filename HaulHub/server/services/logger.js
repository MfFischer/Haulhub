const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/payments.log' }),
    new winston.transports.Console()
  ]
});

const logTransaction = async (transaction) => {
  logger.info('Payment Transaction', {
    transactionId: transaction.id,
    userId: transaction.userId,
    amount: transaction.amount,
    method: transaction.paymentMethod,
    status: transaction.status,
    timestamp: new Date()
  });
};

module.exports = { logger, logTransaction };