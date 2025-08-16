import type { Request, Response } from 'express'
import Expense from '../models/Expense'

export class ExpensesController {
    static createExpense = async (req: Request, res: Response) => {
        try {
            const expense = await Expense.create(req.body)
            expense.budgetId = req.budget.id

            await expense.save()
            res.status(201).json('Gasto creado')

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static getExpenseById = async (req: Request, res: Response) => {
        res.json(req.expense)
    }

    static updateExpenseById = async (req: Request, res: Response) => {
        await req.expense.update(req.body)
        res.json('Gasto actualizado')
    }

    static deleteExpenseById = async (req: Request, res: Response) => {
        await req.expense.destroy()
        res.json('Gasto eliminado')
    }
}