const express = require('express');
const { Pool } = require('pg');

// --- Configurações ---
const PORT = 3000;

// O Coolify vai nos fornecer a URL do banco através de uma variável de ambiente.
// Isso é muito mais seguro do que colocar a senha no código!
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const app = express();
app.use(express.json());

// Função para criar a tabela se ela não existir
const createTable = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS leituras (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            temperatura REAL,
            umidade REAL,
            acel_x REAL,
            acel_y REAL,
            acel_z REAL
        );
    `;
    try {
        await pool.query(createTableQuery);
        console.log('Tabela "leituras" verificada/criada com sucesso.');
    } catch (err) {
        console.error('Erro ao criar a tabela:', err.stack);
    }
};

// Rota de teste
app.get('/', (req, res) => {
    res.send('API para monitoramento de colmeia está no ar!');
});

// Endpoint para receber os dados do ESP32
app.post('/dados', async (req, res) => {
    const { temperatura, umidade, acelerometro } = req.body;
    console.log('Dados recebidos:', req.body);

    if (temperatura === undefined || umidade === undefined || acelerometro === undefined) {
        return res.status(400).json({ error: 'Dados incompletos.' });
    }

    const insertQuery = `INSERT INTO leituras (temperatura, umidade, acel_x, acel_y, acel_z) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
    const values = [temperatura, umidade, acelerometro.x, acelerometro.y, acelerometro.z];

    try {
        const result = await pool.query(insertQuery, values);
        console.log(`Nova leitura inserida com o ID: ${result.rows[0].id}`);
        res.status(200).json({ message: 'Dados recebidos com sucesso!', id: result.rows[0].id });
    } catch (err) {
        console.error('Erro ao salvar os dados:', err.stack);
        res.status(500).json({ error: 'Erro interno ao salvar os dados.' });
    }
});

// Inicia o servidor após garantir que a tabela existe
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    createTable();
});
