const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer'); // krävs för enctype = multipart/form-data (filuppladdning)
const notifier = require('node-notifier');

const app = express();

const filePathToJSON = path.join(__dirname, 'user-credentials.json');

// Behandla statiska filer i det nuvarande dir (med hjälp av express module)
app.use(express.static('.'));

// Multer storage config (cb = callback)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/')); // destinationen där alla uppladdade bilder går
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // använd originalla namnet för filen
  }
});

// Variable som ska behandla filuppladningarna med definierad lagring (linje 12-19)
const upload = multer({ storage: storage });

// Parse URL-encoded body, tilldelar resultat inuti req.body 
app.use(express.urlencoded({ extended: true })); // extended: true; för mer komplexa objekt

// Routes för HTML filerna
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/create_user', (req, res) => {
  res.sendFile(path.join(__dirname, 'create_user.html'));
});

app.get('/edit_user', (req, res) => {
  res.sendFile(path.join(__dirname, 'edit_user.html'));
});

app.get('/view_user', (req, res) => {
  res.sendFile(path.join(__dirname, 'view_user.html'));
});

// Starta server på port 3000
app.listen(3000, () => {
  console.log('Server is listening on http://localhost:3000');
});

// Ifall filen existerar: läs json filen och parse
let userData = { users: [] }; // destructuring: extrahera värdet från objekt/array till variable

if (fs.existsSync(filePathToJSON)) {
  const data = fs.readFileSync(filePathToJSON);
  userData = JSON.parse(data);
}

// Processa form data från post (fil, text)
app.post('/create_user', upload.single('image'), (req, res) => {
  console.log(req.body);
  console.log(req.file);

  const formData = req.body; // request.body, ta info från just den client request i <body> html (form)

  // Skapa ett nytt user objekt med form datan
  const newUser = {
    id: userData.users.length + 1,
    firstName: formData['first-name'],
    lastName: formData['last-name'],
    userName: formData['user-name'],
    birthDate: formData['birth-date'],
    image: req.file ? req.file.filename : '', // ternary operator: ifall en bild var uppladdad (optional)
    profession: formData['profession']
  };
  
  // Lägg till (push) objektet inutill 'users' array
  userData.users.push(newUser);

  // Skriv tillbaka de uppdaterade user datan till json filen
  fs.writeFile(filePathToJSON, JSON.stringify(userData, null, 2), (err) => {
    if (err) {
      res.status(500).write('<p>Error saving data</p>');
    } else {
      notifier.notify(
        {
          title: 'Konto skapad!',
          message: 'Bra jobbat',
          icon: path.join(__dirname, '/img/check.jpg')
        }
      );
      res.writeHead(301, {"Location": "/index.html"});
      res.end();   
    }
  });
})

app.post('/search_user', (req, res) => {
  console.log("Searched username: " + req.body.username);

  const userSearched = req.body.username;
  let userFound = false;

  userData.users.forEach(user => {
    if (userSearched === user.userName) {
      userFound = true;
      notifier.notify({
        title: 'JA!',
        message: `${userSearched} fanns!`,
        icon: path.join(__dirname, '/img/check.jpg')
      });

      /// Jämför sökt användarnamn med existerande och tilldela dess värden till user variabel
      const user = userData.users.find(u => u.userName === userSearched);
      const userValues = Object.values(user);
      console.log('Values of user:', userValues);

      // Lägg till redigeringsformulär + användardata
      res.send(` 
        <link rel="stylesheet" href="../css/edit_user.css">
        <form action="/edit_user" method="post">
          <label for="first-name">Förnamn: </label>
          <input type="text" name="first-name" id="first-name">

          <label for="last-name">Efternamn: </label>
          <input type="text" name="last-name" id="last-name">

          <label for="user-name">Användarnamn: </label>
          <input type="text" name="user-name" id="user-name">

          <label for="birth-date">Födelsedag: </label>
          <input type="date" name="birth-date" id="birth-date">

          <label for="image">Bild: </label>
          <input type="file" accept="image/png, image/jpeg" name="image" id="image">

          <label for="profession">Yrke: </label>
          <input type="text" name="profession" id="profession">

          <input type="submit" name="edit" value="Redigera">
        </form>

        <div id="user-info">
          <p id="u-name">${userValues[3]}</p>
          <p id="f-name">${userValues[1]}</p>
          <p id="l-name">${userValues[2]}</p>
          <p id="b-date">${userValues[4]}</p>
          <img src="../uploads/${userValues[5]}" alt="Portrait" id="photo" width=250 height=250>
          <p id="pro">${userValues[6]}</p>
        </div>
      `);
    }
  });

  if (!userFound) {
    notifier.notify({
      title: 'NEJ!',
      message: 'Inget konto med det användarnamn existerar',
      icon: path.join(__dirname, '/img/cross.png')
    });
  }
});

app.post('/create_user', upload.single('image'), (req, res) => { 

})
