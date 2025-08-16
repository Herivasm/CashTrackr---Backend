import { transport } from '../config/nodemailer'

type EmailType = {
    name: string
    email: string
    token: string
}

export class AuthEmail {
    static sendConfirmationEmail = async (user: EmailType) => {
        const email = await transport.sendMail({
            from: 'CashTrackr <admin@cashtrackr.com>',
            to: user.email,
            subject: 'CashTrackr - Confirmación de tu cuenta',
            html: `
            <p>Hola ${user.name}, has creado tu cuenta en CashTrackr. ¡Ya está casi lista!</p>
            <p>Visita el siguiente enlace:</p>
            <a href='${process.env.FRONTEND_URL}/auth/confirm-account'>Confirmar cuenta</a>
            <p>E ingresa el siguiente código: <b>${user.token}</b></p>`
        })
        // console.log('Mensaje enviado', email.messageId);
    }

    static sendPasswordResetToken = async (user: EmailType) => {
        const email = await transport.sendMail({
            from: 'CashTrackr <admin@cashtrackr.com>',
            to: user.email,
            subject: 'CashTrackr - Reestablecer Contraseña',
            html: `
            <p>Hola ${user.name}, has solicitado reestablecer tu contraseña.</p>
            <p>Visita el siguiente enlace:</p>
            <a href='${process.env.FRONTEND_URL}/auth/new-password'>Reestablecer contraseña</a>
            <p>E ingresa el siguiente código: <b>${user.token}</b></p>`
        })
        // console.log('Mensaje enviado', email.messageId);
    }
}