require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const pool = require('./db');

const app = express();
app.use(express.json());


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { erro: 'Muitas requisições criadas a partir deste IP, tente novamente mais tarde.' }
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


app.get('/tarefas', async (req, res) => {
  try {
    const { concluida } = req.query;
    let query = 'SELECT * FROM tarefas';
    let params = [];

    if (concluida !== undefined) {
      query += ' WHERE concluida = $1';
      params.push(concluida === 'true');
    }
    query += ' ORDER BY id';

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);
  } catch (error) {
    console.error(error); 
    res.status(500).json({ erro: 'Erro ao buscar tarefas' }); 
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


app.post('/tarefas', async (req, res) => {
  try {
    const { titulo } = req.body;
    
    const erroValidacao = validarTitulo(titulo);
    if (erroValidacao) {
      return res.status(400).json({ erro: erroValidacao });
    }

    const resultado = await pool.query(
      'INSERT INTO tarefas (titulo) VALUES ($1) RETURNING *',
      [titulo.trim()]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao criar tarefa' });
  }
});

app.put('/tarefas/:id', async (req, res) => {
  try {
    const { titulo, concluida } = req.body;
    
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

    const resultado = await pool.query(
      'UPDATE tarefas SET titulo = $1, concluida = $2 WHERE id = $3 RETURNING *',
      [novoTitulo, novaConcluida, req.params.id]
    );

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao atualizar tarefa' });
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