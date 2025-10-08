const express = require('express');
const { Pool } = require('pg');
const path = require('path'); // Adicionamos o 'path'

// --- Configurações ---
const PORT = 3000;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const app = express();
app.use(express.json());

// --- Configuração do EJS ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- ROTAS ---

// ROTA PRINCIPAL (GET /): Agora ela vai mostrar o dashboard
app.get('/', async (req, res) => {
    try {
        // Busca as 20 leituras mais recentes no banco de dados
        const query = 'SELECT * FROM leituras ORDER BY timestamp DESC LIMIT 20';
        const result = await pool.query(query);
        
        // Renderiza o arquivo 'dashboard.ejs' e passa os dados do banco para ele
        res.render('dashboard', { leituras: result.rows });

    } catch (err) {
        console.error('Erro ao buscar dados para o dashboard:', err.stack);
        res.status(500).send('Erro ao carregar os dados do dashboard.');
    }
});

// ENDPOINT DE DADOS (POST /dados): Continua o mesmo, recebendo dados do ESP32
app.post('/dados', async (req, res) => {
    const { temperatura, umidade, peso_raw, acelerometro } = req.body;
    console.log('Dados recebidos:', req.body);

    if (temperatura === undefined || umidade === undefined || peso_raw === undefined || acelerometro === undefined) {
        return res.status(400).json({ error: 'Dados incompletos.' });
    }

    const insertQuery = `INSERT INTO leituras (temperatura, umidade, peso_raw, acel_x, acel_y, acel_z) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`;
    const values = [temperatura, umidade, peso_raw, acelerometro.x, acelerometro.y, acelerometro.z];

    try {
        const result = await pool.query(insertQuery, values);
        console.log(`Nova leitura inserida com o ID: ${result.rows[0].id}`);
        res.status(200).json({ message: 'Dados recebidos com sucesso!', id: result.rows[0].id });
    } catch (err) {
        console.error('Erro ao salvar os dados:', err.stack);
        res.status(500).json({ error: 'Erro interno ao salvar os dados.' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});