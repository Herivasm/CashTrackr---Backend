import request from 'supertest'
import server, { connectDB } from '../../server'
import { AuthController } from '../../controllers/AuthController'
import User from '../../models/User'
import * as authUtils from '../../utils/auth'
import * as jwtUtils from '../../utils/jwt'

describe('Authentication - Create Account', () => {
    it('should display errors when form is empty', async () => {
        const response = await request(server)
            .post('/api/auth/create-account')
            .send({})
        const createAccountMock = jest.spyOn(AuthController, 'createAccount')

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(3)

        expect(response.status).not.toBe(201)
        expect(response.body.errors).not.toHaveLength(2)
        expect(createAccountMock).not.toHaveBeenCalled()
    })

    it('should return 400 status code when the email is invalid', async () => {
        const response = await request(server)
            .post('/api/auth/create-account')
            .send({
                "name": "Heriberto",
                "password": "password",
                "email": "not_valid_email"
            })
        const createAccountMock = jest.spyOn(AuthController, 'createAccount')

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(1)
        expect(response.body.errors[0].msg).toBe('Correo no válido')

        expect(response.status).not.toBe(201)
        expect(response.body.errors).not.toHaveLength(2)
        expect(createAccountMock).not.toHaveBeenCalled()
    })

    it('should return 400 status code when the password is less than 8 characters', async () => {
        const response = await request(server)
            .post('/api/auth/create-account')
            .send({
                "name": "Heriberto",
                "password": "short",
                "email": "test@test.com"
            })
        const createAccountMock = jest.spyOn(AuthController, 'createAccount')

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(1)
        expect(response.body.errors[0].msg).toBe('La contraseña debe tener mínimo 8 caracteres')

        expect(response.status).not.toBe(201)
        expect(response.body.errors).not.toHaveLength(2)
        expect(createAccountMock).not.toHaveBeenCalled()
    })

    it('should register a new user successfully', async () => {
        const userData = {
            "name": "Saulo",
            "password": "password",
            "email": "test@test.com"
        }

        const response = await request(server)
            .post('/api/auth/create-account')
            .send(userData)

        expect(response.status).toBe(201)
        expect(response.body).not.toHaveProperty('errors')
        expect(response.status).not.toBe(400)
    })

    it('should return 409 conflict when a user is already registered', async () => {
        const userData = {
            "name": "Saulo",
            "password": "password",
            "email": "test@test.com"
        }

        const response = await request(server)
            .post('/api/auth/create-account')
            .send(userData)

        expect(response.status).toBe(409)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('Este correo ya está en uso')

        expect(response.status).not.toBe(201)
        expect(response.status).not.toBe(400)
        expect(response.body).not.toHaveProperty('errors')
    })
})

describe('Authentication - Account Confirmation with Token', () => {
    it('should display error if token is empty or is not valid', async () => {
        const response = await request(server)
            .post('/api/auth/confirm-account')
            .send({ "token": "not_valid_token" })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(1)
        expect(response.body.errors[0].msg).toBe('Token no válido')
    })

    it('should display error if token does not exist', async () => {
        const response = await request(server)
            .post('/api/auth/confirm-account')
            .send({ "token": "123456" })

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('Token no válido')
        expect(response.status).not.toBe(200)
    })

    it('should confirm account with a valid token', async () => {
        const token = globalThis.cashTrackrConfirmationToken
        const response = await request(server)
            .post('/api/auth/confirm-account')
            .send({ token })

        expect(response.status).toBe(200)
        expect(response.body).toBe('Cuenta confirmada')
    })
})

describe('Authentication - Login', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should display validation errors when the form is empty', async () => {
        const response = await request(server)
            .post('/api/auth/login')
            .send({})

        const loginMock = jest.spyOn(AuthController, 'login')

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(2)

        expect(response.body.errors).not.toHaveLength(1)
        expect(loginMock).not.toHaveBeenCalled()
    })

    it('should retrun 400 bad request when the email is invalid', async () => {
        const response = await request(server)
            .post('/api/auth/login')
            .send({
                "password": "password",
                "email": "not_valid_email"
            })

        const loginMock = jest.spyOn(AuthController, 'login')

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(1)
        expect(response.body.errors[0].msg).toBe('Correo no válido')

        expect(response.body.errors).not.toHaveLength(2)
        expect(loginMock).not.toHaveBeenCalled()
    })

    it('should retrun a 404 error if the user is not found', async () => {
        const response = await request(server)
            .post('/api/auth/login')
            .send({
                "password": "password",
                "email": "user_not_found@test.com"

            })

        expect(response.status).toBe(404)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('Este usuario no existe')

        expect(response.status).not.toBe(200)
    })

    it('should retrun a 403 error if the user account is not confirmed (with a Mock)', async () => {
        (jest.spyOn(User, 'findOne') as jest.Mock).mockResolvedValue({
            id: 1,
            confirmed: false,
            password: 'hashedPassword',
            email: 'user_not_confirmed@test.com'
        })

        const response = await request(server)
            .post('/api/auth/login')
            .send({
                "password": "password",
                "email": "user_not_confirmed@test.com"
            })

        expect(response.status).toBe(403)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('La cuenta no ha sido confirmada')

        expect(response.status).not.toBe(200)
        expect(response.status).not.toBe(404)
    })

    it('should retrun a 403 error if the user account is not confirmed (with a real endpoint)', async () => {
        const userData = {
            name: 'Test',
            password: 'password',
            email: 'user_not_confirmed@test.com'
        }
        await request(server)
            .post('/api/auth/create-account')
            .send(userData)

        const response = await request(server)
            .post('/api/auth/login')
            .send({
                "password": userData.password,
                "email": userData.email
            })

        expect(response.status).toBe(403)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('La cuenta no ha sido confirmada')

        expect(response.status).not.toBe(200)
        expect(response.status).not.toBe(404)
    })

    it('should retrun a 401 error if the password is incorrect', async () => {
        const findOne = (jest.spyOn(User, 'findOne') as jest.Mock).mockResolvedValue({
            id: 1,
            confirmed: true,
            password: 'hashedPassword',
        })

        const checkPassword = jest.spyOn(authUtils, 'checkPassword').mockResolvedValue(false)

        const response = await request(server)
            .post('/api/auth/login')
            .send({
                "password": "wrongPassword",
                "email": "test@test.com"
            })

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('Contraseña incorrecta')

        expect(response.status).not.toBe(200)
        expect(response.status).not.toBe(404)
        expect(response.status).not.toBe(403)

        expect(findOne).toHaveBeenCalledTimes(1)
        expect(checkPassword).toHaveBeenCalledTimes(1)
    })

    it('should retrun a jwt', async () => {
        const findOne = (jest.spyOn(User, 'findOne') as jest.Mock).mockResolvedValue({
            id: 1,
            confirmed: true,
            password: 'hashedPassword',
        })

        const checkPassword = jest.spyOn(authUtils, 'checkPassword').mockResolvedValue(true)
        const generateJWT = jest.spyOn(jwtUtils, 'generateJWT').mockReturnValue('jwt_token')

        const response = await request(server)
            .post('/api/auth/login')
            .send({
                "password": "correctPassword",
                "email": "test@test.com"
            })

        expect(response.status).toBe(200)
        expect(response.body).toEqual('jwt_token')

        expect(findOne).toHaveBeenCalled()
        expect(findOne).toHaveBeenCalledTimes(1)

        expect(checkPassword).toHaveBeenCalled()
        expect(checkPassword).toHaveBeenCalledTimes(1)
        expect(checkPassword).toHaveBeenCalledWith('correctPassword', 'hashedPassword')

        expect(generateJWT).toHaveBeenCalled()
        expect(generateJWT).toHaveBeenCalledTimes(1)
        expect(generateJWT).toHaveBeenCalledWith(1)
    })
})

let jwt: string

async function authenticateUser() {
    const response = await request(server)
        .post('/api/auth/login')
        .send({
            email: "test@test.com",
            password: "password"
        })
    jwt = response.body
    expect(response.status).toBe(200)
}

describe('GET /api/budgets', () => {

    beforeAll(() => {
        jest.restoreAllMocks() // Restore all the jest.spy functions to their original implementation
    })

    beforeAll(async () => {
        await authenticateUser()
    })

    it('should reject unauthenticated access to budgets without a jwt', async () => {
        const response = await request(server)
            .get('/api/budgets')

        expect(response.status).toBe(401)
        expect(response.body.error).toBe('No autorizado')
    })

    it('should reject unauthenticated access to budgets without a valid jwt', async () => {
        const response = await request(server)
            .get('/api/budgets')
            .auth('not_valid', { type: 'bearer' })

        expect(response.status).toBe(500)
        expect(response.body.error).toBe('Token no válido')
    })

    it('should allow authenticated access to budgets with valid jwt', async () => {
        const response = await request(server)
            .get('/api/budgets')
            .auth(jwt, { type: 'bearer' })

        expect(response.body).toHaveLength(0)

        expect(response.status).not.toBe(401)
        expect(response.body.error).not.toBe('No autorizado')
    })
})

describe('POST /api/budgets', () => {
    beforeAll(async () => {
        await authenticateUser()
    })

    it('should reject unauthenticated post request to budgets without a jwt', async () => {
        const response = await request(server)
            .post('/api/budgets')

        expect(response.status).toBe(401)
        expect(response.body.error).toBe('No autorizado')
    })

    it('should display validation when the form is submitted with invalid data', async () => {
        const response = await request(server)
            .post('/api/budgets')
            .auth(jwt, { type: 'bearer' })
            .send({})

        expect(response.status).toBe(400)
        expect(response.body.errors).toHaveLength(4)
    })

    it('should create a budget if the user is authenticate with a 200 code sucess', async () => {
        const response = await request(server)
            .post('/api/budgets')
            .auth(jwt, { type: 'bearer' })
            .send({
                name: "Gastos",
                amount: 3000
            })

        expect(response.status).toBe(201)
    })
})

describe('GET /api/budgets/:id', () => {
    beforeAll(async () => {
        await authenticateUser()
    })

    it('should reject unauthenticated get request to budget ID without a jwt', async () => {
        const response = await request(server)
            .get('/api/budgets/1')

        expect(response.status).toBe(401)
        expect(response.body.error).toBe('No autorizado')
    })

    it('should return a 400 bad request when ID is not valid', async () => {
        const response = await request(server)
            .get('/api/budgets/not_valid_id')
            .auth(jwt, { type: 'bearer' })

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeDefined()
        expect(response.body.errors).toHaveLength(1)
        expect(response.body.errors[0].msg).toBe('ID no válido')

        expect(response.status).not.toBe(401)
        expect(response.body.error).not.toBe('No autorizado')
    })

    it('should return a 404 not found when a budget does not exist', async () => {
        const response = await request(server)
            .get('/api/budgets/4000')
            .auth(jwt, { type: 'bearer' })

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('Presupuesto no encontrado')

        expect(response.status).not.toBe(400)
        expect(response.status).not.toBe(401)
    })

    it('should return a single budget by ID', async () => {
        const response = await request(server)
            .get('/api/budgets/1')
            .auth(jwt, { type: 'bearer' })

        expect(response.status).toBe(200)

        expect(response.status).not.toBe(400)
        expect(response.status).not.toBe(401)
        expect(response.status).not.toBe(404)
    })
})

describe('PUT /api/budgets/:id', () => {
    beforeAll(async () => {
        await authenticateUser()
    })

    it('should reject unauthenticated put request to budget ID without a jwt', async () => {
        const response = await request(server)
            .put('/api/budgets/1')

        expect(response.status).toBe(401)
        expect(response.body.error).toBe('No autorizado')
    })

    it('should validation errors if the form is empty', async () => {
        const response = await request(server)
            .put('/api/budgets/1')
            .auth(jwt, { type: 'bearer' })
            .send({})

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeTruthy()
        expect(response.body.errors).toHaveLength(4)
    })

    it('should update a budget by ID and return a success message', async () => {
        const response = await request(server)
            .put('/api/budgets/1')
            .auth(jwt, { type: 'bearer' })
            .send({
                name: "Updated Budget",
                amount: 1500
            })

        expect(response.status).toBe(200)
        expect(response.body).toBe('Presupuesto actualizado')
    })
})

describe('DELETE /api/budgets/:id', () => {
    beforeAll(async () => {
        await authenticateUser()
    })

    it('should reject unauthenticated delete request to budget ID without a jwt', async () => {
        const response = await request(server)
            .delete('/api/budgets/1')

        expect(response.status).toBe(401)
        expect(response.body.error).toBe('No autorizado')
    })

    it('should return 404 not found when a budget doesn not exist', async () => {
        const response = await request(server)
            .delete('/api/budgets/4000')
            .auth(jwt, { type: 'bearer' })

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('Presupuesto no encontrado')
    })

    it('should delete a budget by ID and return a success message', async () => {
        const response = await request(server)
            .delete('/api/budgets/1')
            .auth(jwt, { type: 'bearer' })

        expect(response.status).toBe(200)
        expect(response.body).toBe('Presupuesto eliminado')
    })
})