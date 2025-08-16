import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { body, param } from 'express-validator'
import { handleInputErrors } from '../middleware/validation'
import { limiter } from '../config/limiter'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(limiter)

router.post('/create-account',
    body('name')
        .notEmpty().withMessage('El nombre no puede ir vacío'),
    body('password')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener mínimo 8 caracteres'),
    body('email')
        .isEmail().withMessage('Correo no válido'),
    handleInputErrors,
    AuthController.createAccount
)

router.post('/confirm-account',
    body('token')
        .isLength({ min: 6, max: 6 }).withMessage('Token no válido'),
    handleInputErrors,
    AuthController.confirmAccount
)

router.post('/login',
    body('email')
        .isEmail().withMessage('Correo no válido'),
    body('password')
        .notEmpty().withMessage('La contraseña no debe ir vacía'),
    handleInputErrors,
    AuthController.login
)

router.post('/forgot-password',
    body('email')
        .isEmail().withMessage('Correo no válido'),
    handleInputErrors,
    AuthController.forgotPassword
)

router.post('/validate-token',
    body('token')
        .notEmpty().withMessage('Token no válido')
        .isLength({ min: 6, max: 6 }),
    handleInputErrors,
    AuthController.validateToken
)

router.post('/reset-password/:token',
    param('token')
        .notEmpty().withMessage('Token no válido')
        .isLength({ min: 6, max: 6 }),
    body('password')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener mínimo 8 caracteres'),
    handleInputErrors,
    AuthController.resetPasswordWithToken
)

router.get('/user',
    authenticate,
    AuthController.user
)

router.put('/user',
    authenticate,
    AuthController.updateUser
)

router.post('/update-password',
    authenticate,
    body('current_password')
        .notEmpty().withMessage('La contraseña actual no puede ir vacía'),
    body('password')
        .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener mínimo 8 caracteres'),
    handleInputErrors,
    AuthController.updateCurrentUserPassword
)

router.post('/check-password',
    authenticate,
    body('password')
        .notEmpty().withMessage('La contraseña actual no puede ir vacía'),
    handleInputErrors,
    AuthController.checkPassword
)

export default router