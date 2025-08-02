import Joi from 'joi';
import logger from '../utils/logger.js';

class ValidationMiddleware {
  static validate(schema) {
    return (req, res, next) => {
      const { error } = schema.validate(req.body);
      
      if (error) {
        logger.warn('Validation error:', { 
          error: error.details[0].message,
          body: req.body 
        });
        
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.details[0].message
        });
      }
      
      next();
    };
  }

  // Validation schemas
  static schemas = {
    register: Joi.object({
      userName: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .messages({
          'string.alphanum': 'Username must contain only alphanumeric characters',
          'string.min': 'Username must be at least 3 characters long',
          'string.max': 'Username must be at most 30 characters long',
          'any.required': 'Username is required'
        }),
      password: Joi.string()
        .min(6)
        .required()
        .messages({
          'string.min': 'Password must be at least 6 characters long',
          'any.required': 'Password is required'
        })
    }),

    login: Joi.object({
      userName: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .messages({
          'string.alphanum': 'Username must contain only alphanumeric characters',
          'string.min': 'Username must be at least 3 characters long',
          'string.max': 'Username must be at most 30 characters long',
          'any.required': 'Username is required'
        }),
      password: Joi.string()
        .required()
        .messages({
          'any.required': 'Password is required'
        })
    }),

    selectNumber: Joi.object({
      selectedNumber: Joi.number()
        .integer()
        .min(1)
        .max(9)
        .required()
        .messages({
          'number.base': 'Selected number must be a number',
          'number.integer': 'Selected number must be an integer',
          'number.min': 'Selected number must be at least 1',
          'number.max': 'Selected number must be at most 9',
          'any.required': 'Selected number is required'
        })
    }),

    dateFilter: Joi.object({
      date: Joi.date()
        .iso()
        .required()
        .messages({
          'date.base': 'Date must be a valid date',
          'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
          'any.required': 'Date is required'
        })
    })
  };
}

export default ValidationMiddleware; 