require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const pool = require('./db');

const app = express();
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { erro: 'Muitas requisições enviadas. Tente novamente em 15 minutos.' }
});
app.use(limiter);

function validarTitulo(titulo) {
  if (typeof titulo !== 'string' || titulo.trim().length === 0) {
    return 'O campo "titulo" é obrigatório e deve ser um texto válido.';
  }
  if (titulo.length > 255) {
    return 'O campo "titulo" deve ter no máximo 255 caracteres.';
  }
  return null;
}

// EXERCÍCIO PDF 2: Adicione uma coluna prioridade e permita filtrar por prioridade
app.get('/tarefas', async (req, res) => {
  try {
    const { concluida, prioridade } = req.query;
    let query = 'SELECT * FROM tarefas';
    let params = [];
    let condicoes = [];

    if (concluida !== undefined) {
      params.push(concluida === 'true');
      condicoes.push(`concluida = $${params.length}`);
    }

    if (prioridade !== undefined) {
      params.push(prioridade);
      condicoes.push(`prioridade = $${params.length}`);
    }

    if (condicoes.length > 0) {
      query += ' WHERE ' + condicoes.join(' AND ');
    }

    query += ' ORDER BY id';

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar tarefas' });
  }
});

// EXERCÍCIO PDF 2: Implemente paginação no GET/tarefas usando LIMIT e OFFSET
app.get('/tarefas/paginadas', async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 10;
    const pagina = parseInt(req.query.pagina) || 1;
    const offset = (pagina - 1) * limite;

    const resultado = await pool.query(
      'SELECT * FROM tarefas ORDER BY id LIMIT $1 OFFSET $2',
      [limite, offset]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar página de tarefas' });
  }
});

// EXERCÍCIO PDF 1 e 2: Endpoint com resumo/estatísticas usando SQL (COUNT, GROUP BY)
app.get('/tarefas/resumo', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT concluida, COUNT(*) AS quantidade FROM tarefas GROUP BY concluida'
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao gerar resumo/estatísticas' });
  }
});

app.get('/tarefas/:id', async (req, res) => {
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
});

// EXERCÍCIO PDF 1: Adicione um campo prioridade (baixa, média, alta) às tarefas
app.post('/tarefas', async (req, res) => {
  try {
    const { titulo, prioridade } = req.body;

    const erroValidacao = validarTitulo(titulo);
    if (erroValidacao) {
      return res.status(400).json({ erro: erroValidacao });
    }

    const valorPrioridade = prioridade || 'média';

    const resultado = await pool.query(
      'INSERT INTO tarefas (titulo, prioridade) VALUES ($1, $2) RETURNING *',
      [titulo.trim(), valorPrioridade]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao criar tarefa' });
  }
});

app.put('/tarefas/:id', async (req, res) => {
  try {
    const { titulo, concluida, prioridade } = req.body;

    if (titulo !== undefined) {
      const erroValidacao = validarTitulo(titulo);
      if (erroValidacao) {
        return res.status(400).json({ erro: erroValidacao });
      }
    }

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
});

// EXERCÍCIO PDF 1: Endpoint DELETE /tarefas que apaga todas as tarefas concluídas de uma vez
app.delete('/tarefas/concluidas', async (req, res) => {
  try {
    await pool.query('DELETE FROM tarefas WHERE concluida = true');
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao apagar tarefas concluídas' });
  }
});

app.delete('/tarefas/:id', async (req, res) => {
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
});

app.listen(3000, () => console.log('API rodando na porta 3000'));