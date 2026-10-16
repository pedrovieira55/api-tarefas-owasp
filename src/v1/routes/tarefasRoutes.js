const express = require('express');
const router = express.Router();
const tarefasController = require('../controllers/tarefasController');

router.get('/resumo', tarefasController.resumo);
router.delete('/concluidas', tarefasController.limparConcluidas);
router.get('/', tarefasController.listar);
router.get('/:id', tarefasController.buscarPorId);
router.post('/', tarefasController.criar);
router.put('/:id', tarefasController.atualizar);
router.delete('/:id', tarefasController.deletar);

module.exports = router;