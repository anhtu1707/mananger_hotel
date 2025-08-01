const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validateRoom = [
  body('room_number').notEmpty().withMessage('Room number is required'),
  body('room_type').isIn(['single', 'double', 'suite', 'deluxe']).withMessage('Invalid room type'),
  body('price_per_night').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  handleValidationErrors
];

const validateGuest = [
  body('name').notEmpty().withMessage('Guest name is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('id_type').isIn(['passport', 'license', 'national_id']).withMessage('Invalid ID type'),
  body('id_number').notEmpty().withMessage('ID number is required'),
  handleValidationErrors
];

const validateBooking = [
  body('guest_id').isInt({ min: 1 }).withMessage('Valid guest ID is required'),
  body('room_id').isInt({ min: 1 }).withMessage('Valid room ID is required'),
  body('check_in_date').isISO8601().withMessage('Valid check-in date is required'),
  body('check_out_date').isISO8601().withMessage('Valid check-out date is required'),
  body('total_amount').isFloat({ min: 0 }).withMessage('Total amount must be positive'),
  handleValidationErrors
];

const validateStaff = [
  body('name').notEmpty().withMessage('Staff name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('role').isIn(['admin', 'manager', 'receptionist', 'housekeeping']).withMessage('Invalid role'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateRoom,
  validateGuest,
  validateBooking,
  validateStaff,
  handleValidationErrors
};