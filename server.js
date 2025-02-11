/*
###############################################
####       Initialisierung Extensions      ####
###############################################
*/

// Initialisierung von Express, Body-Parser, EJS, sqlite Datenbank, bcrypt, cookie-parser, express-session
const express = require("express");
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.engine("ejs", require("ejs").__express);
app.set("view engine", "ejs");

const DATABASE = "users.db"; // hier wird Datenbank Name festgelegt
const CODEBASE = "code.db";
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(DATABASE);
const codedb = new sqlite3.Database(CODEBASE);


const bcrypt = require("bcrypt");

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const session = require('express-session');
app.use(session({
    secret: 'thisisoursecretsessioncode',
    saveUninitialized: false,
    resave:false
}));

const fileUpload = require('express-fileupload');
app.use(fileUpload());

/*
###############################################
####              Server-Start             ####
###############################################
*/
app.listen(3000, function()
{
    console.log("listening in port 3000");
});

/*
###############################################
####            Ordner-Freigaben           ####
###############################################
*/
// Freigabe Public
app.use(express.static(__dirname + "/public"));

// Freigabe der Ordner für CodeMirror-Editor
app.use('/editCode', express.static(__dirname + "/lib"));
app.use('/editCode', express.static(__dirname + "/mode"));
app.use('/editCode', express.static(__dirname + "/theme"));
app.use('/editCode', express.static(__dirname + "/addon"));

/*
###############################################
####              GET-Requests             ####
###############################################
*/

app.get("/index", function(req,res)
{
    res.sendFile(__dirname + "/views/index.html");
});

app.get("/welcome", function(req, res)
{
    let stylesheet = "/stylesheet.css";
    if (req.cookies.darkmode == 1) {
        stylesheet = "/stylesheet-dark.css";
    }
    res.render("welcome", {session: req.session.sessionValue, stylesheet: stylesheet});
});

app.get("/register", function(req, res)
{
    let stylesheet = "/stylesheet.css";
    if (req.cookies.darkmode == 1) {
        stylesheet = "/stylesheet-dark.css";
    }
    res.render("register", {displayMode: "none", stylesheet: stylesheet, regFail: "display:none;"});
});

app.get("/registration-complete", function(req, res)
{
    let stylesheet = "/stylesheet.css";
    if (req.cookies.darkmode == 1) {
        stylesheet = "/stylesheet-dark.css";
    }
    res.render("reg-success", {stylesheet: stylesheet});
});

/* Login-Seite wird nur aufgerufen, wenn keine Session aktiv ist.
   ansonsten wird direkt aufs Profil umgeleitet. */
app.get("/login", function(req, res)
{
    console.log(req.session);
    if (!req.session.sessionValue) {
        let stylesheet = "/stylesheet.css";
        if (req.cookies.darkmode == 1) {
            stylesheet = "/stylesheet-dark.css";
        }
        res.render("login", {wrongName: "display:none", wrongPass: "display:none", stylesheet: stylesheet});
    } else {
        res.redirect("/my-profile");
    }
});

app.get("/logout", function(req, res)
{
    req.session.destroy(); // Session wird gelöscht
    let stylesheet = "/stylesheet.css";
    if (req.cookies.darkmode == 1) {
        stylesheet = "/stylesheet-dark.css";
    }
    res.render("logout", {stylesheet: stylesheet});
});

// Profil-Aufruf ist geschützt: Nur bei gesetzter sessionValue (Username) ist Aufruf möglich!
app.get("/my-profile", function(req, res)
{
    console.log(req.session);
    if (!req.session.sessionValue) {
        res.redirect("/login");
    } else {
        const sessionValueName = req.session.sessionValue;
        codedb.all(`SELECT id, headline, description, code, edited, format, cmmode FROM allcode WHERE loginname ='${sessionValueName}'`,
                function(err,rows)
                {
                    const param_userCodeInfo = rows;
                    let stylesheet = "/stylesheet.css";
                    if (req.cookies.darkmode == 1) {
                        stylesheet = "/stylesheet-dark.css";
                    }
                    db.all(`SELECT image FROM allusers WHERE loginname ='${sessionValueName}'`, function(err, rows) {
                        if (err) {
                            console.log(err);
                        } else {
                            const pic = rows[0].image;
                            console.log(pic);

                            res.render("myprofile", {username: sessionValueName, codelist: param_userCodeInfo, stylesheet: stylesheet, profilepic: pic, 
                                lastvis1: req.cookies.lastvisit1, lastvis2: req.cookies.lastvisit2, lastvis3: req.cookies.lastvisit3, lastvis4: req.cookies.lastvisit4, lastvis5: req.cookies.lastvisit5});
                        }
                    });
                })
    }
});


// Editier-Ansicht für Code-Snippets
app.get("/edit", function(req, res)
{
    if (!req.session.sessionValue) {
        res.redirect("/login");
    } else {
        let stylesheet = "/stylesheet.css";
        if (req.cookies.darkmode == 1) {
            stylesheet = "/stylesheet-dark.css";
        }
        res.render("edit-snippet", {snippetId: null, snippetCode: null, snippetHead: null, snippetDesc: null, timestamp: null, stylesheet: stylesheet, 
            lastvis1: req.cookies.lastvisit1, lastvis2: req.cookies.lastvisit2, lastvis3: req.cookies.lastvisit3, lastvis4: req.cookies.lastvisit4, lastvis5: req.cookies.lastvisit5});
    } 
});

// Profile anderer Nutzer (nur mit gesetzter Session-Varibale erreichbar): 
/* Beim Aufruf wird der an die URL gehängte URL-Parameter 'view' ausgelesen, um
   den zu betrachtenden Nutzer zu identifizieren.
   
   Beispiel: 
   Die URL 'localhost:3000/profiles?view=admin' übergibt den Parameter 'view' mit dem Wert 'admin'
   Aus der Datenbank werden dann alle Codes von 'admin' ausgelesen. */
app.get("/profile", function(req, res)
{
    console.log(req.session);
    if (!req.session.sessionValue) {
        res.redirect("/login");
    } else {
        const profileName = req.query.view;
        const errorStatus = req.query.error;
        codedb.all(`SELECT id, headline, description, code, edited, format, cmmode FROM allcode WHERE loginname ='${profileName}'`,
                function(err,rows)
                {
                    const maxAge = 3600*1000*24*365; // hier werden die Cookies für 'last visited' neu gesetzt/umsortiert.
                    let lv5 = req.cookies.lastvisit4;
                    let lv4 = req.cookies.lastvisit3;
                    let lv3 = req.cookies.lastvisit2;
                    let lv2 = req.cookies.lastvisit1;
                    let lv1 = profileName;
                    res.cookie('lastvisit1', lv1, {'maxAge': maxAge});
                    res.cookie('lastvisit2', lv2, {'maxAge': maxAge});
                    res.cookie('lastvisit3', lv3, {'maxAge': maxAge});
                    res.cookie('lastvisit4', lv4, {'maxAge': maxAge});
                    res.cookie('lastvisit5', lv5, {'maxAge': maxAge});

                    if (rows.length > 0) {

                        const param_userCodeInfo = rows;
                        let stylesheet = "/stylesheet.css";
                        if (req.cookies.darkmode == 1) {
                            stylesheet = "/stylesheet-dark.css";
                        }
                        let errorMessage = "display:none;";
                        if (errorStatus == 1) {
                            errorMessage = "display:block;";
                        }
                        db.all(`SELECT image FROM allusers WHERE loginname ='${profileName}'`, function(err, rows) {
                            if (err) {
                                console.log(err);
                            } else {
                                const pic = rows[0].image;
                                console.log(pic);

                                res.render("profiles", {username: profileName, codelist: param_userCodeInfo, sessionName: req.session.sessionValue, stylesheet: stylesheet, errorStyle: errorMessage,
                                    lastvis1: lv1, lastvis2: lv2, lastvis3: lv3, lastvis4: lv4, lastvis5: lv5, profilepic: pic});
                            }
                        });
                    } else {
                        // let profilepic = getImage(profileName);
                        let stylesheet = "/stylesheet.css";
                        if (req.cookies.darkmode == 1) {
                            stylesheet = "/stylesheet-dark.css";
                        }
                        
                        db.all(`SELECT image FROM allusers WHERE loginname ='${profileName}'`, function(err, rows) {
                            if (err) {
                                console.log(err);
                            } else {
                                const pic = rows[0].image;
                                console.log(pic);

                                res.render("nosnippets", {username: profileName, stylesheet: stylesheet, profilepic: pic, 
                                    lastvis1: req.cookies.lastvisit1, lastvis2: req.cookies.lastvisit2, lastvis3: req.cookies.lastvisit3, lastvis4: req.cookies.lastvisit4, lastvis5: req.cookies.lastvisit5});
                            }
                        });
                    }
                });
    }
});

// Favoriten-Seite
/* mit kleinem Workaround aufgrund asynchroner Funktionsaufrufe:
   Die Buttons zum Erreichen der Favoritenseite stellen nicht sofort einen GET-Request sondern senden einen POST-Request (siehe unten).
   In diesem Post-Request wird zunächst überprüft, ob die favorisierten Codes noch existieren. Ist dies nicht der Fall, werden diese Codes aus der Favoritenliste
   entfernt. Nach Abschluss dieser Schleife wird auf diesen (hier) GET-Request "redirected". Hier werden sich dann anhand der favorisierten Code-IDs alle Informationen
   zum jeweiligen Snippet aus der Tabelle 'allcode' (code.db) gezogen, um diese beim Aufruf der Favoriten-EJS zu übergeben.  */
app.get("/favorites", function(req, res)
{
    if (!req.session.sessionValue) {
        res.redirect("/login");
    } else {
        const favTable = req.session.sessionValue; // Favoritentabelle = Loginname (ausgelesen von Session-Value)
        getFavsAndSend(favTable);
        function getFavsAndSend(favTable) {
            codedb.all(`SELECT favid FROM '${favTable}'`, function(err,rows2) {
                const favoriteSnippetIDs = rows2; // IDs der Favoriten (als JSON-Objekt) werden in Liste gespeichert
                console.log("3) " + favoriteSnippetIDs); // for Debugging
                var favList = []; // leere Liste für gesamte Code-Infos
                let counter = 0; // Counter, um in der zweiten For-Schleife Aktionen zu differenzieren
                if (favoriteSnippetIDs.length > 0) { // Schleife sucht sich alle Codesnippets aus der Tabelle allcodes, die als Favorit gespeichert wurden und übergibt diese an favorites.ejs
                    for (let i = 0; i < favoriteSnippetIDs.length; i++) {
                        codedb.all(`SELECT * FROM allcode WHERE id='${favoriteSnippetIDs[i].favid}'`, function(err,rows3) {
                            if (counter < (favoriteSnippetIDs.length)-1) {
                                favList.push(rows3[0]);
                                counter++;
                            } else {
                                favList.push(rows3[0]);
                                //console.log(favList); // for Debugging
                                let stylesheet = "/stylesheet.css";
                                if (req.cookies.darkmode == 1) {
                                    stylesheet = "/stylesheet-dark.css";
                                }
                                res.render("favorites", {favSnippets: favList, sessionName: req.session.sessionValue, stylesheet: stylesheet, 
                                    lastvis1: req.cookies.lastvisit1, lastvis2: req.cookies.lastvisit2, lastvis3: req.cookies.lastvisit3, lastvis4: req.cookies.lastvisit4, lastvis5: req.cookies.lastvisit5});
                            }
                        });
                    }
                } else {
                    let stylesheet = "/stylesheet.css";
                    if (req.cookies.darkmode == 1) {
                        stylesheet = "/stylesheet-dark.css";
                    }
                    res.render("nofavorites", {sessionName: req.session.sessionValue, stylesheet: stylesheet, 
                        lastvis1: req.cookies.lastvisit1, lastvis2: req.cookies.lastvisit2, lastvis3: req.cookies.lastvisit3, lastvis4: req.cookies.lastvisit4, lastvis5: req.cookies.lastvisit5});
                }
            });
        }
    }    
});

// Benutzerübersicht/-verwaltung
app.get("/userlist", function(req, res)
{
    if (!req.session.sessionValue) {
        res.redirect("/login");
    } else {
        db.each(`SELECT role FROM allusers WHERE loginname='${req.session.sessionValue}'`, function(err, rows) {
            if ((rows.role) === 'admin') {
                db.all(
                    `SELECT * FROM allusers`,
                    function(err, rows){
                        let stylesheet = "/stylesheet.css";
                        if (req.cookies.darkmode == 1) {
                            stylesheet = "/stylesheet-dark.css";
                        }
                        res.render("adminpanel", {"allusers": rows, adminname: req.session.sessionValue, stylesheet: stylesheet, 
                        lastvis1: req.cookies.lastvisit1, lastvis2: req.cookies.lastvisit2, lastvis3: req.cookies.lastvisit3, lastvis4: req.cookies.lastvisit4, lastvis5: req.cookies.lastvisit5});
                    } 
                );
            } else {
                db.all(
                    `SELECT * FROM allusers`,
                    function(err, rows){
                        let stylesheet = "/stylesheet.css";
                        if (req.cookies.darkmode == 1) {
                            stylesheet = "/stylesheet-dark.css";
                        }
                        res.render("userlist", {"allusers": rows, username: req.session.sessionValue, stylesheet: stylesheet, 
                        lastvis1: req.cookies.lastvisit1, lastvis2: req.cookies.lastvisit2, lastvis3: req.cookies.lastvisit3, lastvis4: req.cookies.lastvisit4, lastvis5: req.cookies.lastvisit5});
                    } 
                );
            }
        });
    }     
});

// Settings-Seite
app.get("/settings", function(req, res)
{
    if (!req.session.sessionValue) {
        res.redirect("/login");
    } else {
        db.all(`SELECT * FROM allusers WHERE loginname='${req.session.sessionValue}'`, function(err, rows) {
            const email = rows[0].email;
            const id = rows[0].id;
            const loginname = rows[0].loginname;
            const password = rows[0].password;
            const image = rows[0].image;
            let stylesheet = "/stylesheet.css";
            if (req.cookies.darkmode == 1) {
                stylesheet = "/stylesheet-dark.css";
            }
            res.render("settings", {currentID: id, currentEmail: email, currentLoginname: loginname, currentPassword: password, errorMessage: "display:none;", stylesheet: stylesheet, profilepic: image,  
            lastvis1: req.cookies.lastvisit1, lastvis2: req.cookies.lastvisit2, lastvis3: req.cookies.lastvisit3, lastvis4: req.cookies.lastvisit4, lastvis5: req.cookies.lastvisit5});
        });
    }
});
// Impressum-Seite
app.get("/impressum", function(req, res)
{
    let stylesheet = "/stylesheet.css";
    if (req.cookies.darkmode == 1) {
        stylesheet = "/stylesheet-dark.css";
    }
    res.render("impressum", {session: req.session.sessionValue, stylesheet: stylesheet});
});

/*
###############################################
####             POST-Requests             ####
###############################################
*/

/*
+++++++++++++++++++++++++++++++
+++ Anmeldung/Registrierung +++
+++++++++++++++++++++++++++++++
*/

// Registrierung
app.post('/newUser', function(req,res)
    {
        const param_email = req.body.email;
        const param_loginname = req.body.loginname;
        const param_password1 = req.body.password1;
        const param_password2 = req.body.password2;
        const param_origin = req.body.origin; // Übergabe, von welcher Seite der Post-Request kommt
        //hier wird gechecked ob die Email "plausibel" ist.
        const check = param_email.match(/^([a-zA-Z0-9_\.-]+)@([\da-zA-Z\.-]+)\.([a-zA-Z\.]{2,6})$/);
        const check2 = param_loginname.match(/^[a-zA-Z0-9_]+([-.][a-zA-Z0-9_]+)*$/);
    
        db.all(`SELECT * FROM allusers WHERE loginname='${param_loginname}'`,
        function (err, rows)
        {// Test ob User bereits existiert und ob Passwort wiederholung korrekt und Passwort mehr als 7 zeichen hat
            if (rows.length == 0 && param_password1 == param_password2 &&  check != null && check2 != null && param_password1.length > 7)  
            {
                const hash = bcrypt.hashSync(param_password1,10);
                // Nachfolgend Tabelle für Favoriten je User erstellen
                sql = `CREATE TABLE '${param_loginname}' (id INTEGER PRIMARY KEY AUTOINCREMENT, favid INTEGER);`;
                codedb.run(sql, function(err)
                    {
                        db.run(
                            `INSERT INTO allusers(time, email, loginname, password, role, favorites, status, darkmode) VALUES(datetime('now'),'${param_email}','${param_loginname}', '${hash}','user','/${param_loginname}', 1, 0)`, 
                        function(err)
                        {
                            // Redirect bei erfolgreicher Registrierung 
                            if (param_origin == "adminpanel") {
                                res.redirect("/userlist"); // Wenn POST-Request vom Admin-Panel kommt, wird darauf zurückgeleitet
                            } else {
                                res.redirect("/registration-complete");
                            }
                        });
                    });
            } else if (rows.length > 0) {
                let stylesheet = "/stylesheet.css";
                if (req.cookies.darkmode == 1) {
                    stylesheet = "/stylesheet-dark.css";
                }
                res.render("register", {displayMode: "block", stylesheet: stylesheet, regFail: "display:none;"});
            } else
                {
                    let stylesheet = "/stylesheet.css";
                    if (req.cookies.darkmode == 1) {
                        stylesheet = "/stylesheet-dark.css";
                    }
                    res.render("register", {displayMode: "none", stylesheet: stylesheet, regFail: "display:block;"});
                }
        });
    });

// Login
app.post('/login', function(req,res)
{
    const param_loginname = req.body.loginname;
    const param_password = req.body.password;
    db.all(`SELECT password, darkmode, image FROM allusers WHERE loginname ='${param_loginname}'`,
    function(err,rows)
    {
        if (rows.length==1)
        {
            let darkmode = rows[0].darkmode;
            const image = rows[0].image;
            const hash = rows[0].password;
            const isValid = bcrypt.compareSync(param_password, hash);
            if (isValid==true)
            {
                if (darkmode == 1) { // ist der Darkmode aktiviert worden, wird ein Cookie auf '1' gesetzt
                    const maxAge = 3600*1000*24*365;
                    res.cookie('darkmode', 1, {'maxAge': maxAge});
                } else {
                    const maxAge = 3600*1000*24*365;
                    res.cookie('darkmode', 0, {'maxAge': maxAge});
                }
                req.session.sessionValue = param_loginname;
                console.log(req.session.sessionValue);
                codedb.all(`SELECT id, headline, description, code, edited, format, cmmode FROM allcode WHERE loginname ='${param_loginname}'`,
                function(err,rows)
                {
                    const param_userCodeInfo = rows;
                    let stylesheet = "/stylesheet.css";
                    if (darkmode == 1) {
                        stylesheet = "/stylesheet-dark.css";
                    }
                    db.all(`SELECT image FROM allusers WHERE loginname ='${param_loginname}'`, function(err, rows) {
                        if (err) {
                            console.log(err);
                        } else {
                            const pic = rows[0].image;
                            console.log(pic);

                            res.render("myprofile", {username: param_loginname, codelist: param_userCodeInfo, stylesheet: stylesheet, profilepic: pic, 
                                lastvis1: req.cookies.lastvisit1, lastvis2: req.cookies.lastvisit2, lastvis3: req.cookies.lastvisit3, lastvis4: req.cookies.lastvisit4, lastvis5: req.cookies.lastvisit5});
                        }
                    });
                })
            }
            else
            {
                let stylesheet = "/stylesheet.css";
                if (req.cookies.darkmode == 1) {
                    stylesheet = "/stylesheet-dark.css"
                }
                res.render("login", {wrongName: "display:none;", wrongPass: "display:block;", stylesheet: stylesheet});
            };
        }
        else{
            let stylesheet = "/stylesheet.css";
            if (req.cookies.darkmode == 1) {
                stylesheet = "/stylesheet-dark.css"
            }
            res.render("login", {wrongName: "display:block;", wrongPass: "display:none;", stylesheet: stylesheet});
        }
    });
});

/*
+++++++++++++++++++++++++++++++
+++  Code-Snippet Aktionen  +++
+++++++++++++++++++++++++++++++
*/

// Code-Snippet löschen
app.post('/onDeleteCode/:id', function(req, res) {
    const id = req.params['id'];
    const param_loginname = req.session.sessionValue
    const sql = `DELETE FROM allcode WHERE id=${id}`;
    console.log(sql);
    codedb.run(sql, function(err) {
        res.redirect('/my-profile');
    });
});

// Code-Snippet hinzufügen
app.post('/addCode', function(req,res)
{
    const param_loginname = req.session.sessionValue
    const sql = 
    `INSERT INTO allcode (headline, description, code, loginname, format, cmmode, edited) 
    VALUES ('Überschrift','Kurze Beschreibung deines Codes','Dein Code','${param_loginname}','text', 'null', datetime('now'))`;
    codedb.run(sql, function(err)
    {
        codedb.all(`SELECT id, headline, description, code, format, cmmode, edited FROM allcode WHERE id=last_insert_rowid()`, function(err, rows) {
            const id = rows[0]['id'];
            const headline = rows[0]['headline'];
            const description = rows[0]['description'];
            const code = rows[0]['code'];
            const format = rows[0]['format'];
            const cmmode = rows[0]['cmmode'];
            const edited = rows[0]['edited'];
            let stylesheet = "/stylesheet.css";
            if (req.cookies.darkmode == 1) {
                stylesheet = "/stylesheet-dark.css";
            }
            res.render('edit-snippet', {snippetCode: code, snippetId: id, snippetHead: headline, snippetDesc: description, snippetFormat: format, cmMode: cmmode, timestamp: edited, username: req.session.sessionValue, stylesheet: stylesheet, 
                lastvis1: req.cookies.lastvisit1, lastvis2: req.cookies.lastvisit2, lastvis3: req.cookies.lastvisit3, lastvis4: req.cookies.lastvisit4, lastvis5: req.cookies.lastvisit5});
        });
    })
})

// Code-Snippet ändern
app.post('/onChangeCode/', function(req, res) {
    const id = req.body.id;
    const head = req.body.head;
    const desc = req.body.desc;
    const code = req.body.code;
    const finalCode = code.replace(/\'/g,"''");
    const finalHead = head.replace(/\'/g,"''");
    const finalDesc = desc.replace(/\'/g,"''");
    const format = req.body.format;
    let cmMode; // cmMode wird im nachfolgenden je nach Snippet-Format gesetzt; perspektivisch ließe sich evtl. auch das "cmmode"-Feld in der DB einsparen
        switch (format) {
            case 'c':
            case 'c++':
            case 'c#':
            case 'java':
            case 'objectivec':
            case 'objectivec++':
                cmMode = "clike";
                break;
            case 'ejs':
                cmMode = "htmlembedded";
                break;
            case 'html':
                cmMode = "htmlmixed";
                break;
            case 'mysql':
            case 'sql':
            case 'sqlite':
                cmMode = "sql";
                break;
            case 'text':
                cmMode = "null";
                break;
            case 'latex':
                cmMode = "stex";
                break;
            case 'typescript':
                cmMode = "javascript";
                break;
            case 'vbnet':
                cmMode = "vb";
                break;
            default:
                cmMode = format;
        }
    const timestamp = req.body.edited;

    const sql = `UPDATE allcode SET code='${finalCode}', headline='${finalHead}', description='${finalDesc}', format='${format}', cmmode='${cmMode}', edited='${timestamp}' WHERE id=${id}`;
    console.log(sql);
    codedb.run(sql, function(err) {
        console.log("Code-Snippet geändert"); // Message zum Debugging
        res.redirect(`/my-profile#code-heading${id}`); // Springt direkt zum geänderten Element
    });
});

// Edit-Page von Code-Snippet aufrufen
app.post('/editCode/', function(req, res) {
    const param_id = req.body.id;
    const param_head = req.body.headline;
    const param_desc = req.body.description;
    const param_code = req.body.code;
    const param_timestamp = req.body.timestamp;
    const param_format = req.body.format;
    const param_cmmode = req.body.cmMode;
    let stylesheet = "/stylesheet.css";
    if (req.cookies.darkmode == 1) {
        stylesheet = "/stylesheet-dark.css";
    }
    res.render('edit-snippet', {snippetCode: `${param_code}`, snippetId: param_id, snippetHead: param_head, snippetDesc: param_desc, snippetFormat: param_format, cmMode: param_cmmode, timestamp: param_timestamp, username: req.session.sessionValue, stylesheet: stylesheet, 
    lastvis1: req.cookies.lastvisit1, lastvis2: req.cookies.lastvisit2, lastvis3: req.cookies.lastvisit3, lastvis4: req.cookies.lastvisit4, lastvis5: req.cookies.lastvisit5});
});

// Code-Snippet aus Favoriten entfernen
app.post('/delfav', function(req, res) {
    const favtable = req.body.favTableName; // Tabellenname der Favoritentabelle
    const favid = req.body.favid; // ID des zu favorisierenden Codes
    const sql =  `DELETE FROM '${favtable}' WHERE favid=${favid}`;
    codedb.run(sql, function(err) { 
        res.redirect(`/favorites`);
    });
});

// Code-Snippet favorisieren
app.post('/addfav', function(req, res) {
    const favtable = req.body.favTableName; // Tabellenname der Favoritentabelle
    const favid = req.body.favid; // ID des zu favorisierenden Codes
    const origin = req.body.origin; // Name der Userseite, auf der favorisiert wurde (für redirect)
    codedb.all(`SELECT * FROM '${favtable}' WHERE favid=${favid}`, function(err, rows) {
        if (rows.length == 0) {
            console.log(rows);
            const sql =  `INSERT INTO '${favtable}'(favid) VALUES(${favid})`;
            codedb.run(sql, function(err) { 
                res.redirect(`/profile?view=${origin}#code-heading${favid}`);
            });
        } else {
            res.redirect(`/profile?view=${origin}&error=1`);
        }
    });
});

/*
+++++++++++++++++++++++++++++++
+++   Benutzerverwaltung    +++
+++++++++++++++++++++++++++++++
*/

// User löschen
app.post("/delete", function(req,res)
{
    const id = req.query.id;
    const loginname = req.query.loginname;
    db.run(
        `DELETE FROM allusers WHERE id=${id}`, // hier wird der Benutzer gelöscht
        function(err)
        {
            codedb.run(`DROP TABLE '${loginname}'`, function() { // hier wird die zugehörige Favoritentabelle des Nutzers gelöscht
                codedb.run(`DELETE FROM allcode WHERE loginname='${loginname}'`, function() { // hier werden alle zum User gehörigen Codes gelöscht
                    console.log("Tabelle " + loginname + " wurde gelöscht.");
                    res.redirect("/userlist");
                });
            });
        }
    );
});

// User bearbeiten
app.post("/update/:id", function(req,res)
{
    db.all(
        `SELECT * FROM allusers WHERE id = ${req.params.id}`,
        function(err,rows)
        {
            let stylesheet = "/stylesheet.css";
            if (req.cookies.darkmode == 1) {
                stylesheet = "/stylesheet-dark.css";
            }
            res.render("userupdate", {rows: rows[0], stylesheet: stylesheet, 
                lastvis1: req.cookies.lastvisit1, lastvis2: req.cookies.lastvisit2, lastvis3: req.cookies.lastvisit3, lastvis4: req.cookies.lastvisit4, lastvis5: req.cookies.lastvisit5});
        }
    );
});

// Userdaten speichern
app.post("/onupdate/:id", function(req,res)
{
    const id = req.params.id;
    const loginname = req.body.loginname;
    const password = req.body.password;
    const passwordHash = bcrypt.hashSync(password,10);
    const email = req.body.email;
    const favorites = req.body.favorites; // bisher nicht verwendet oder nötig
    const status = req.body.status;
    const role = req.body.role;
    const oldLogin = req.body.oldLoginname;

    if (loginname != oldLogin) {
        codedb.run(`ALTER TABLE '${oldLogin}' RENAME TO '${loginname}'`, function(err) {
            if (err) {
                console.log(err);
            } else {
                if (password == "") {
                    db.run(`UPDATE allusers SET loginname="${loginname}", email="${email}", favorites="/${loginname}", status="${status}", role="${role}" WHERE id=${id}`,
                    function(err) {
                        res.redirect("/userlist");
                    });
                } else {
                    db.run(`UPDATE allusers SET loginname="${loginname}", password="${passwordHash}", email="${email}", favorites="/${loginname}", status="${status}", role="${role}" WHERE id=${id}`,
                    function(err) {
                        res.redirect("/userlist");
                    });
                }  
            }
        });
    } else {
        if (password == "") {
            db.run(`UPDATE allusers SET loginname="${loginname}", email="${email}", status="${status}", role="${role}" WHERE id=${id}`,
            function(err) {
                res.redirect("/userlist");
            });
        } else {
            db.run(`UPDATE allusers SET loginname="${loginname}", password="${passwordHash}", email="${email}", status="${status}", role="${role}" WHERE id=${id}`,
            function(err) {
                res.redirect("/userlist");
            });
        }  
    }
});

// User Self-Update (via Settings)
app.post("/selfupdate", function(req,res)
{
    const id = req.body.id;
    const loginname = req.body.loginname;
    const email = req.body.email;
    const emailMatches = email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    const password = req.body.password;
    const password2 = req.body.password2;
    const oldImage = req.body.oldImage;
    // Profilbild es wird noch nicht geprüft, ob das richtige Format und die zugelassene Größe hochgeladen wurde:
    let image;
    const now = new Date();
    let newFilename;
    if (req.files == null) { // hier wird der Fall abgefangen, dass kein neues Bild hochgeladen wurde.
        image = oldImage;
        newFilename = image;
    } else {
        image = req.files.image;
        newFilename = now.valueOf() + "_" + image.name;
        image.mv(__dirname + '/public/img/profileImages/' + newFilename);
    }
    console.log(newFilename);

    let darkmode = req.body.darkmode;
    if (darkmode != 1) { // Ist die Checkbox (der Slider) nicht aktiviert, wird standardmäßig kein Value-Wert übergeben. Daher wird in diesem Fall hier der Wert auf 0 gesetzt.
        darkmode = 0;
    }
    if (darkmode == 1) { // ist der Darkmode aktiviert worden, wird ein Cookie auf '1' gesetzt
        const maxAge = 3600*1000*24*365;
        res.cookie('darkmode', 1, {'maxAge': maxAge});
    } else {
        const maxAge = 3600*1000*24*365;
        res.cookie('darkmode', 0, {'maxAge': maxAge});
    }
    console.log(darkmode);
    if (emailMatches == false || password != password2 || (password.length > 1 && password.length < 8)) { // stimmt eins der Felder nicht, wird die Seite mit Fehlermeldung neu geladen.
        db.all(`SELECT * FROM allusers WHERE loginname='${req.session.sessionValue}'`, function(err, rows) {
            const email = rows[0].email;
            const id = rows[0].id;
            const loginname = rows[0].loginname;
            const password = rows[0].password;
            const image = rows[0].image;
            let stylesheet = "/stylesheet.css";
            if (req.cookies.darkmode == 1) {
                stylesheet = "/stylesheet-dark.css";
            }
            res.render("settings", {currentID: id, currentEmail: email, currentLoginname: loginname, currentPassword: password, errorMessage: "display:block", stylesheet: stylesheet, profilepic: image,  
            lastvis1: req.cookies.lastvisit1, lastvis2: req.cookies.lastvisit2, lastvis3: req.cookies.lastvisit3, lastvis4: req.cookies.lastvisit4, lastvis5: req.cookies.lastvisit5});
        });
    } else {
        if (password === "") { // wurde das Passwortfeld leer gelassen, wird das Passwort nicht geändert
                    db.run(
                    `UPDATE allusers SET loginname="${loginname}", email="${email}", darkmode=${darkmode}, image="${newFilename}" WHERE id=${id}`,
                    function(err) {
                        if (err) {
                            console.log(err);
                        } else {  
                        res.redirect("/my-profile");
                        }
                    });
        } else {
            bcrypt.hash(password, 10).then( // ist das Passwort nicht leer und nicht zu kurz, wird es gehashed und mit den anderen Änderungen gespeichert.
                hash => {
                    console.log('Your hash: ', hash);
                    db.run(
                    `UPDATE allusers SET loginname="${loginname}", password="${hash}", email="${email}", darkmode=${darkmode}, image="${newFilename}" WHERE id=${id}`,
                    function(err) {
                        if (err) {
                            console.log(err);
                        } else {  
                        res.redirect("/my-profile");
                        }
                    });
                },
                err => {
                    console.log(err);
                });
        }
    }
});

/*
+++++++++++++++++++++++++++++++
+++    Favoriten-Handling   +++
+++++++++++++++++++++++++++++++
*/

// Favoriten prüfen und ggf. löschen

/* 
Favoritenliste wird in einer Schleife zunächst darauf überprüft, ob die favorisierten Code-IDs überhaupt noch als Codes vorhanden sind.
Wird zur favorisierten ID keine passende ID in 'allcode' gefunden, wird die entsprechende 'favid' in der Favoritenliste des Benutzers entfernt.
Nach Abschluss dieser Aktion wird verwiesen auf '/favorites' und es werden im entsprechenden GET-Request die erforderlichen Snippet-Infos
gesammelt und übergeben.
*/

app.post("/favorites", function(req,res) {
    favTable = req.body.userTab;
    codedb.all(`SELECT favid FROM '${favTable}'`, function(err,rows1) {
        const favoriteSnippets = rows1;
        if (favoriteSnippets.length != 0) { 
            for (let i = 0; i < favoriteSnippets.length; i++) { // Schleife überprüft, ob favorisierte CodeIDs überhaupt noch existieren und löscht diese sonst aus FavList
                codedb.all(`SELECT * FROM allcode WHERE id='${favoriteSnippets[i].favid}'`, function(err,availableCodes) {
                    console.log(`2) Code ${favoriteSnippets[i].favid} vorhanden: ${availableCodes.length}`); // Debugging
                    if (availableCodes.length == 0) {
                        codedb.run(`DELETE FROM '${favTable}' WHERE favid='${favoriteSnippets[i].favid}'`, function(err) {
                            if (err) {
                                throw err;
                            } else {
                                console.log(`2b) Code-Snippet ${favoriteSnippets[i].favid} wurde gelöscht.`) // Debugging
                            }
                        });
                    }
                });
            }
        }

    });
    res.redirect("/favorites");
});