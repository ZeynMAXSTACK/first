const express = require('express');
const { createServer } = require('http');
const { join } = require('path');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

async function main() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server);

  const filesDir = path.join(__dirname, 'files');
  

  app.use('/files', express.static(filesDir));

  app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
  });


  io.on('connection', (socket) => {
    console.log('New client connected');

    
    socket.on('start', () => {
      console.log('Start event received');
    });

   
    socket.on('request-file-list', () => {
      fs.readdir(filesDir, (err, files) => {
        if (err) {
          console.error('Error reading files:', err);
          socket.emit('file-list', { error: 'Could not read files' });
          return;
        }

        
        const audioFiles = files.filter(file => /\.(wav)$/i.test(file));
        socket.emit('file-list', audioFiles);
      });
    });

    // завантаження аудіо
    socket.on('upload-audio', (audioBuffer) => {
      const fileName = `recording_${Date.now()}.wav`;
      const filePath = path.join(filesDir, fileName);

      fs.writeFile(filePath, Buffer.from(audioBuffer), (err) => {
        if (err) {
          console.error('Error saving audio file:', err);
          socket.emit('upload-error', { error: 'Could not save file' });
          return;
        }

        console.log(`File saved: ${filePath}`);
        // Оновлення списку файлів
        fs.readdir(filesDir, (err, files) => {
          if (err) {
            console.error('Error reading files:', err);
            return;
          }
          const audioFiles = files.filter(file => /\.(mp3|wav)$/i.test(file));
          io.emit('file-list', fs.readdirSync(filesDir).filter(file => /\.(mp3|wav)$/i.test(file)));
        });
      });
    });

    
    socket.on('stop', () => {
      console.log('Stop event received');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  server.listen(5502, () => {
    console.log('The server is running on http://localhost:5502');
  });
}

main();
