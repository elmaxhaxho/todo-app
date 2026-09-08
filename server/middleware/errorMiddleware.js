const notFound = (req, res) => {
    res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
    console.error(err);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error'
    });
};

module.exports = { notFound, errorHandler };
