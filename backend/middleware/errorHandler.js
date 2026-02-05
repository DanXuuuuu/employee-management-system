// deal with diff error situations 

const errorHandler = (err, req, res, next)=>{
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'ValidationError') {
        error.message = Object.values(err.errors).map(val => val.message).join(', ');
        error.statusCode = 400;
    }

    
    if (err.code === 11000) {
        error.message = 'Duplicate field value entered';
        error.statusCode = 400;
    }

    
    if (err.name === 'JsonWebTokenError') {
        error.message = 'Not authorized to access this route';
        error.statusCode = 401;
    }
    const statusCode = err.statusCode || 500;
    
    res.status(statusCode).json({
        success: false,
        error: err.message || 'Server Error',
        // tell the develper how to debug 
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler; 