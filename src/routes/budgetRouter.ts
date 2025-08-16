import { Router } from 'express'
import { BudgetController } from '../controllers/BudgetController'
import { handleInputErrors } from '../middleware/validation'
import { hasAccess, validateBudgetExists, validateBudgetId, validateBudgetInput } from '../middleware/budget'
import { ExpensesController } from '../controllers/ExpenseController'
import { belongsToBudget, validateExpenseExists, validateExpenseId, validateExpenseInput } from '../middleware/expense'
import { authenticate } from '../middleware/auth'

export const router = Router()

router.use(authenticate)

/** Params Validation */
router.param('budgetId', validateBudgetId)
router.param('budgetId', validateBudgetExists)
router.param('budgetId', hasAccess)

router.param('expenseId', validateExpenseId)
router.param('expenseId', validateExpenseExists)
router.param('expenseId', belongsToBudget)

/** Budget Routes */
router.post('/',
    validateBudgetInput,
    handleInputErrors,
    BudgetController.createBudget
)

router.get('/', BudgetController.getAllBudgets)

router.get('/:budgetId', BudgetController.getBudgetById)

router.put('/:budgetId',
    validateBudgetInput,
    handleInputErrors,
    BudgetController.updateBudgetById
)

router.delete('/:budgetId', BudgetController.deleteBudgetById)

/** Expenses Routes */
router.post('/:budgetId/expenses',
    validateExpenseInput,
    handleInputErrors,
    ExpensesController.createExpense
)

router.get('/:budgetId/expenses/:expenseId', ExpensesController.getExpenseById)

router.put('/:budgetId/expenses/:expenseId',
    validateExpenseInput,
    handleInputErrors,
    ExpensesController.updateExpenseById
)

router.delete('/:budgetId/expenses/:expenseId', ExpensesController.deleteExpenseById)

export default router