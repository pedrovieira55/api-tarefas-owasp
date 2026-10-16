const express = require('express');
const app = express();

app.use(express.json());

// Importa as rotas das duas versões
const tarefasV1Routes = require('./src/v1/routes/tarefasRoutes');
const tarefasV2Routes = require('./src/v2/routes/tarefasRoutes');

// Mapeamento dos endpoints com prefixos de versão
app.use('/api/v1/tarefas', tarefasV1Routes);
app.use('/api/v2/tarefas', tarefasV2Routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});