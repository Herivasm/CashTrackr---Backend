import { type Request, type Response } from 'express'
import Budget from '../models/Buget'
import Expense from '../models/Expense'

export class BudgetController {
    static createBudget = async (req: Request, res: Response) => {
        try {
            const budget = await Budget.create(req.body)

            budget.userId = req.user.id
            await budget.save()

            res.status(201).json('Presupuesto creado')

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static getAllBudgets = async (req: Request, res: Response) => {
        try {
            const budgets = await Budget.findAll({
                order: [
                    ['createdAt', 'DESC']
                ],
                where: {
                    userId: req.user.id
                }
            })
            res.json(budgets)

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static getBudgetById = async (req: Request, res: Response) => {
        const budget = await Budget.findByPk(req.budget.id, {
            include: [Expense]
        })
        res.json(budget)
    }

    static updateBudgetById = async (req: Request, res: Response) => {
        await req.budget.update(req.body)
        res.json('Presupuesto actualizado')
    }

    static deleteBudgetById = async (req: Request, res: Response) => {
        await req.budget.destroy()
        res.json('Presupuesto eliminado')
    }
}