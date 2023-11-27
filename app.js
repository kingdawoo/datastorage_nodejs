const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer'); // krävs för enctype = multipart/form-data (filuppladdning)

const app = express();

// behandla statiska filer i det nuvarande dir (med hjälp av express module)
app.use(express.static('.'));

// multer storage config (cb = callback)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/')); // destinationen där alla uppladdade bilder går
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // använd originalla namnet för filen
  }
});

// variable som ska behandla filuppladningarna med definierad lagring (linje 12-19)
const upload = multer({ storage: storage });

// parse URL-encoded body, tilldelar resultat inuti req.body 
app.use(express.urlencoded({ extended: true })); // extended: true; för mer komplexa objekt

// routes för HTML filerna
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

// starta server på port 3000
app.listen(3000, () => {
  console.log('Server is listening on http://localhost:3000');
});

// processa form data från post (fil, text)
app.post('/create_user', upload.single('image'), (req, res) => {
  console.log(req.body);
  console.log(req.file);

  const formData = req.body; // request.body, ta info från just den client request i <body> html (form)

  // ifall filen existerar: läs json filen och parse
  const filePath = path.join(__dirname, 'user-credentials.json');
  let userData = { users: [] }; // destructuring: extrahera värdet från objekt/array till variable

  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    userData = JSON.parse(data);
  }

  // skapa ett nytt user objekt med form datan
  const newUser = {
    id: userData.users.length + 1,
    firstName: formData['first-name'],
    lastName: formData['last-name'],
    userName: formData['user-name'],
    birthDate: formData['birth-date'],
    image: req.file ? req.file.filename : '', // ternary operator: ifall en bild var uppladdad (optional)
    profession: formData['profession']
  };

  // lägg till (push) objektet inutill 'users' array
  userData.users.push(newUser);

  // skriv tillbaka de uppdaterade user datan till json filen
  fs.writeFile(filePath, JSON.stringify(userData, null, 2), (err) => {
    if (err) {
      res.status(500).send('Error saving data');
    } else {
      res.status(200).send('Data saved successfully');
    }
  });
});