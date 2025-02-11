/*Tabele erzeugen*/
CREATE TABLE allusers(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time TEXT NOT NULL,
    email TEXT NOT NULL,
    loginname TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    favorites TEXT NOT NULL,
    status INTEGER DEFAULT 1 NOT NULL,
    darkmode INTEGER DEFAULT 0 NOT NULL,
    image TEXT DEFAULT 'default.jpg' NOT NULL
);

INSERT INTO allusers (time, email, loginname, password, role, favorites, status, darkmode) 
VALUES (datetime('now'),'admin@admin.de' , 'admin','$2b$10$1qd0/8ogWCeGYGle2.sw7.rr851zjo7HgDIMSi.0Eq7pMin8xEF4.','admin','/admin', 1, 0);

