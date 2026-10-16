// Array em memória para a Versão 1
let tarefas = [
    { id: 1, titulo: 'Aprender Express', concluida: false, prioridade: 'alta' },
    { id: 2, titulo: 'Criar minha primeira API', concluida: false, prioridade: 'média' }
];
let proximoId = 3;

const tarefasController = {
    // GET /api/v1/tarefas
    listar: (req, res) => {
        const { concluida } = req.query;
        let resultado = tarefas;
        if (concluida !== undefined) {
            resultado = tarefas.filter(t => t.concluida === (concluida === 'true'));
        }
        res.json(resultado);
    },

    // GET /api/v1/tarefas/resumo 
    resumo: (req, res) => {
        const concluidas = tarefas.filter(t => t.concluida === true).length;
        const pendentes = tarefas.filter(t => t.concluida === false).length;
        res.json({
            total: tarefas.length,
            concluidas,
            pendentes
        });
    },

    // GET /api/v1/tarefas/:id
    buscarPorId: (req, res) => {
        const tarefa = tarefas.find(t => t.id === parseInt(req.params.id));
        if (!tarefa) return res.status(404).json({ erro: 'Tarefa não encontrada' });
        res.json(tarefa);
    },

    // POST /api/v1/tarefas (Com validação e prioridade)
    criar: (req, res) => {
        const { titulo, prioridade } = req.body;

        // Validação básica de título
        if (typeof titulo !== 'string' || titulo.trim().length === 0) {
            return res.status(400).json({ erro: 'O campo "titulo" é obrigatório e deve ser um texto válido' });
        }

        // Validação de título duplicado
        const tituloExiste = tarefas.some(t => t.titulo.toLowerCase() === titulo.trim().toLowerCase());
        if (tituloExiste) {
            return res.status(400).json({ erro: 'Já existe uma tarefa com este título' });
        }

        const prioridadesValidas = ['baixa', 'média', 'alta'];
        const prioridadeFinal = prioridadesValidas.includes(prioridade) ? prioridade : 'média';

        const novaTarefa = {
            id: proximoId++,
            titulo: titulo.trim(),
            concluida: false,
            prioridade: prioridadeFinal
        };

        tarefas.push(novaTarefa);
        res.status(201).json(novaTarefa);
    },

    // PUT /api/v1/tarefas/:id
    atualizar: (req, res) => {
        const tarefa = tarefas.find(t => t.id === parseInt(req.params.id));
        if (!tarefa) return res.status(404).json({ erro: 'Tarefa não encontrada' });

        const { titulo, concluida, prioridade } = req.body;
        if (titulo !== undefined) tarefa.titulo = titulo.trim();
        if (concluida !== undefined) tarefa.concluida = concluida;
        if (prioridade !== undefined) tarefa.prioridade = prioridade;

        res.json(tarefa);
    },

    // DELETE /api/v1/tarefas (Apaga todas as concluídas )
    limparConcluidas: (req, res) => {
        tarefas = tarefas.filter(t => t.concluida === false);
        res.status(200).json({ mensagem: 'Todas as tarefas concluídas foram removidas com sucesso' });
    },

    // DELETE /api/v1/tarefas/:id
    deletar: (req, res) => {
        const index = tarefas.findIndex(t => t.id === parseInt(req.params.id));
        if (index === -1) return res.status(404).json({ erro: 'Tarefa não encontrada' });
        tarefas.splice(index, 1);
        res.status(204).send();
    }
};

module.exports = tarefasController;