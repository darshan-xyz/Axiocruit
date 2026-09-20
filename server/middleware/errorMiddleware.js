const errorHandler = (err, req, res, next) => {
    // Ensure accurate HTTP status code (default to 500 if not set or if 200)
    const statusCode = (res.statusCode && res.statusCode !== 200) ? res.statusCode : 500;

    const response = {
        success: false,
        message: err.message || 'Internal Server Error',
        requestId: req.id || undefined,
        timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV !== 'production') {
        response.stack = err.stack;
    }

    // Structured logging of unhandled errors
    console.error(`[Error] [${req.id || 'N/A'}] ${req.method} ${req.originalUrl} - ${statusCode} - ${err.message}`);
    if (process.env.NODE_ENV !== 'production' && err.stack) {
        console.error(err.stack);
    }

    res.status(statusCode).json(response);
};

module.exports = { errorHandler };
