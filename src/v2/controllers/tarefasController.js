const pool = require('../../../db');


function validarTitulo(titulo) {
    if (!titulo || typeof titulo !== 'string') {
        return { valido: false, erro: 'O campo "titulo" deve ser um texto válido.' };
    }
    const tituloLimpo = titulo.trim();
    if (tituloLimpo.length === 0) {
        return { valido: false, erro: 'O campo "titulo" não pode estar vazio.' };
    }
    if (tituloLimpo.length > 255) {
        return { valido: false, erro: 'O "titulo" deve ter no máximo 255 caracteres.' };
    }
    return { valido: true, valor: tituloLimpo };
}

const tarefasController = {
    // GET /api/v2/tarefas (Com filtros e paginação)
    listar: async (req, res) => {
        try {
            const { concluida, prioridade, limite = 10, pagina = 1 } = req.query;
            let query = 'SELECT * FROM tarefas WHERE 1=1';
            let params = [];

            if (concluida !== undefined) {
                params.push(concluida === 'true');
                query += ` AND concluida = $${params.length}`;
            }

            if (prioridade !== undefined) {
                params.push(prioridade);
                query += ` AND prioridade = $${params.length}`;
            }

            const limitNum = parseInt(limite);
            const offsetNum = (parseInt(pagina) - 1) * limitNum;

            params.push(limitNum);
            query += ` ORDER BY id LIMIT $${params.length}`;
            params.push(offsetNum);
            query += ` OFFSET $${params.length}`;

            const resultado = await pool.query(query, params);
            res.json({
                pagina: parseInt(pagina),
                limite: limitNum,
                dados: resultado.rows
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ erro: 'Erro ao buscar tarefas' });
        }
    },

    // GET /api/v2/tarefas/resumo (Estatísticas via SQL)
    resumo: async (req, res) => {
        try {
            const query = `
                SELECT 
                    COUNT(*) AS total,
                    COUNT(CASE WHEN concluida = true THEN 1 END) AS concluidas,
                    COUNT(CASE WHEN concluida = false THEN 1 END) AS pendentes
                FROM tarefas;
            `;
            const resultado = await pool.query(query);
            res.json(resultado.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ erro: 'Erro ao gerar resumo de estatísticas' });
        }
    },

    // GET /api/v2/tarefas/:id
    buscarPorId: async (req, res) => {
        try {
            const resultado = await pool.query('SELECT * FROM tarefas WHERE id = $1', [req.params.id]);
            if (resultado.rows.length === 0) {
                return res.status(404).json({ erro: 'Tarefa não encontrada' });
            }
            res.json(resultado.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ erro: 'Erro ao buscar tarefa' });
        }
    },

    // POST /api/v2/tarefas
    criar: async (req, res) => {
        const validacao = validarTitulo(req.body.titulo);
        if (!validacao.valido) {
            return res.status(400).json({ erro: validacao.erro });
        }

        const { prioridade } = req.body;
        const prioridadesValidas = ['baixa', 'média', 'alta'];
        const prioridadeFinal = prioridadesValidas.includes(prioridade) ? prioridade : 'média';

        try {
            const resultado = await pool.query(
                'INSERT INTO tarefas (titulo, prioridade) VALUES ($1, $2) RETURNING *',
                [validacao.valor, prioridadeFinal]
            );
            res.status(201).json(resultado.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ erro: 'Erro ao criar tarefa' });
        }
    },

    // PUT /api/v2/tarefas/:id
    atualizar: async (req, res) => {
        try {
            const { titulo, concluida, prioridade } = req.body;
            const tarefaAtual = await pool.query('SELECT * FROM tarefas WHERE id = $1', [req.params.id]);
            if (tarefaAtual.rows.length === 0) {
                return res.status(404).json({ erro: 'Tarefa não encontrada' });
            }

            const atual = tarefaAtual.rows[0];
            const novoTitulo = titulo !== undefined ? titulo.trim() : atual.titulo;
            const novaConcluida = concluida !== undefined ? concluida : atual.concluida;
            const novaPrioridade = prioridade !== undefined ? prioridade : atual.prioridade;

            const resultado = await pool.query(
                'UPDATE tarefas SET titulo = $1, concluida = $2, prioridade = $3 WHERE id = $4 RETURNING *',
                [novoTitulo, novaConcluida, novaPrioridade, req.params.id]
            );
            res.json(resultado.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ erro: 'Erro ao atualizar tarefa' });
        }
    },

    // DELETE /api/v2/tarefas/:id
    deletar: async (req, res) => {
        try {
            const resultado = await pool.query('DELETE FROM tarefas WHERE id = $1 RETURNING *', [req.params.id]);
            if (resultado.rows.length === 0) {
                return res.status(404).json({ erro: 'Tarefa não encontrada' });
            }
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ erro: 'Erro ao deletar tarefa' });
        }
    }
};

module.exports = tarefasController;