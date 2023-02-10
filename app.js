const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");
const validator = require("validator");
const fs = require("fs");
const pathFile = "./public/data/contacts.json";
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const session = require("express-session");

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("public"));
app.use(morgan("dev"));
app.use(flash());
app.use(
  session({
    secret: "App",
    saveUninitialized: true,
    resave: true,
  })
);

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log("Time:", Date.now());
  next();
});

app.set("layout", "./layout/main");

// akses halaman index
app.get("/", (req, res) => {
  res.render("index", { title: "Home" });
});

// akses halaman aboaut
app.get("/about", (req, res) => {
  // res.sendFile("./about.html", { root: __dirname });
  res.render("about", { title: "About" });
});

// fungsi untuk membuka file
const openFile = () => {
  // membuka file
  const file = fs.readFileSync(pathFile, "utf-8");

  // parse data
  const contact = JSON.parse(file);
  return contact;
};

// menyimpan file
const saveContact = (contact) => {
  const content = JSON.stringify(contact);
  fs.writeFileSync(pathFile, content);
};

// akses halaman contact dari data json
app.get("/contact", (req, res) => {
  const contact = openFile();
  res.render("contact", { contact, title: "Contact" });
});

// akses halaman create
app.get("/contact/create", (req, res) => {
  const err = [];
  res.render("create", { title: "Create Data", err, data: req.body });
});

// proses simpan data
app.post("/store", (req, res) => {
  // membuat array untuk menampung pesan error
  const err = [];

  const cek = openFile().find((contact) => contact.name.toLowerCase() === req.body.name.toLowerCase());

  // jika nama sudah ada di file json
  if (cek) {
    req.flash("message", "Nama sudah ada!");
    // push pesan error ke array
    err.push(req.flash("message"));
  }

  if (req.body.email) {
    // validasi format email
    if (!validator.isEmail(req.body.email)) {
      req.flash("message", "Format email tidak sesuai!");
      // push pesan error ke array
      err.push(req.flash("message"));
    }
  }

  // validasi format nomor telepon
  if (!validator.isMobilePhone(req.body.mobile, "id-ID")) {
    req.flash("message", "Format telephone tidak sesuai!");
    // push pesan error ke array
    err.push(req.flash("message"));
  }

  // jika ada error
  if (err.length > 0) {
    // kembali ke halaman create dengan membawa pesan error
    return res.render("create", { title: "Create Data", err, data: req.body });
  }

  // memasukkan data dari form ke variabel
  const contact = req.body;

  // memanggil fungsi buka file
  const file = openFile();

  // push data baru
  file.push(contact);

  // memanggil fungsi simpan
  saveContact(file);

  res.redirect("/contact");
});

// akses halaman update/edit
app.get("/contact/edit/:name", (req, res) => {
  const err = [];

  const oldName = req.params.name;

  const contacts = openFile();

  const data = contacts.find((contact) => contact.name.toLowerCase() === req.params.name.toLowerCase());

  res.render("edit", { title: "Edit Data", err, data, oldName });
});

// proses update/edit data
app.post("/contact/update", (req, res) => {
  const err = [];

  if (req.body.email) {
    // validasi format email
    if (!validator.isEmail(req.body.email)) {
      req.flash("message", "Format email tidak sesuai!");
      // push pesan error ke array
      err.push(req.flash("message"));
    }
  }

  // validasi format nomor telepon
  if (!validator.isMobilePhone(req.body.mobile, "id-ID")) {
    req.flash("message", "Format telephone tidak sesuai!");
    // push pesan error ke array
    err.push(req.flash("message"));
  }

  // memanggil fungsi  openFile
  const contacts = openFile();

  // cek jika data sudah ada
  const cek = contacts.find((contact) => contact.name.toLowerCase() === req.body.name.toLowerCase());

  // jika nama pada data input sama dengan data oldName sehingga bisa dimasukkan ke dalam file
  if (req.body.oldName === req.body.name) {
    if (err.length == 0) {
      // menghapus data
      const oldData = contacts.filter((contact) => contact.name.toLowerCase() !== req.body.oldName.toLowerCase());

      // Data baru
      const newData = { name: req.body.name, email: req.body.email, mobile: req.body.mobile };

      // push data baru/tambahkan ke arraay yang lama
      oldData.push(newData);

      // menyimpan data
      saveContact(oldData);
    }
  } else {
    // jika nama pada data input berbeda dengan data oldName
    if (cek) {
      req.flash("message", `Gunakan nama lain, ${req.body.name} sudah ada!`);
      // push pesan error ke array
      err.push(req.flash("message"));
    } else {
      if (err.length == 0) {
        // menghapus data
        const oldData = contacts.filter((contact) => contact.name.toLowerCase() !== req.body.oldName.toLowerCase());

        // Data baru
        const newData = { name: req.body.name, email: req.body.email, mobile: req.body.mobile };

        // push data baru/tambahkan ke arraay yang lama
        oldData.push(newData);

        // menyimpan data
        saveContact(oldData);
      }
    }
  }

  // jika ada error
  if (err.length > 0) {
    // kembali ke halaman create dengan membawa pesan error
    return res.render("edit", { title: "Edit Data", err, data: req.body, oldName: req.body.oldName });
  }

  res.redirect("/contact");
});

// delete contact
app.post("/contact/delete/:name", (req, res) => {
  const contacts = openFile();

  const contact = contacts.filter((contact) => contact.name.toLowerCase() !== req.params.name.toLowerCase());

  // jika array lama berbeda panjangnya dengan array baru (nama ditemukan)
  if (contact.length != contacts.length) {
    // memanggil fungsi save contact
    saveContact(contact);
  }

  // redirect ke halaman kontak
  res.redirect("/contact");
});

// akses halaman detail contact
app.get("/contact/:name", (req, res) => {
  const contacts = openFile();

  const contact = contacts.find((contact) => contact.name.toLowerCase() === req.params.name.toLowerCase());

  res.render("detail", { contact, title: "Detail Contact" });
});

app.use("/", (req, res) => {
  res.status(404);
  res.send("Page Not foud : 404");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
