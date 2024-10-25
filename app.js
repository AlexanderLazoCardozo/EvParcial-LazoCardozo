const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('./public/scripts/config');
const path = require('path');
const app = express();
const cors = require('cors');

const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));  

io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado');

  socket.on('disconnect', () => {
      console.log('Un usuario se ha desconectado');
  });

  socket.on('chat', (msg) => {
      console.log('mensaje: ' + msg);
      io.emit('chat', { text: msg, userId: socket.id });
  });
});



app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

app.get('/chat', verifyToken, (req, res) => {
  if (req.user) {
    res.sendFile(path.join(__dirname, 'public/chat.html'));
  } else {
    res.status(401).json({ message: 'No autorizado' });
  }
});


app.get('/api/dashboard-data', verifyToken, (req, res) => {
    if (req.user) {
      res.json({ 
        success: true,  
        message: 'Acceso autorizado',
      });
    } else {
      res.status(401).json({ message: 'No autorizado' });
    }
});


app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Faltan campos por llenar' });
    }

    const newUser = { username, email, password };

    jwt.sign({ user: newUser }, config.secret, { expiresIn: '1h' }, (err, token) => {
        if (err) {
        return res.status(500).json({ message: 'Error generando token' });
        }
        res.json({ token });
    });
});

  
app.post('/signin', (req, res) => {
    const { email, password } = req.body;
  
    if (email == 'admin@example.com' && password == '1234') {
      const user = { email };
  
      jwt.sign({ user }, config.secret, { expiresIn: '1h' }, (err, token) => {
        if (err) {
          return res.status(500).json({ message: 'Error generando token' });
        }
        res.json({ 
          token,
          message: 'Login exitoso' 
        });
      });
    } else {
      res.status(401).json({ message: 'Credenciales inválidas' });
    }
});

app.get('/verify-token', verifyToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];  
    
    if (bearerHeader && bearerHeader.startsWith('Bearer ')) {
      const bearerToken = bearerHeader.split(" ")[1];
      req.token = bearerToken;
  
      jwt.verify(req.token, config.secret, (err, authData) => {
        if (err) {
          return res.status(403).json({ message: 'Token inválido' });
        }
        req.user = authData;
        next();
      });
    } else {
      res.status(401).json({
        message: 'No autorizado, falta token o formato incorrecto'
      });
    }
}



server.listen(config.port, () => {
  console.log(`Servidor corriendo en http://localhost:${config.port}`);
});