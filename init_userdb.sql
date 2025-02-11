/*Tabele erzeugen*/
CREATE TABLE allcode(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    headline TEXT NOT NULL,     /* Spalte für Code-Headline */
    description TEXT NOT NULL,  /* Spalte für Code-Beschreibung */
    code BLOB NOT NULL,         /* Spalte für Code */
    loginname TEXT NOT NULL,    /* Spalte für Eigentümer des Codes */
    format TEXT NOT NULL,       /* Spalte für Syntax/Sprache des Codes */
    cmmode TEXT NOT NULL,       /* Spalte für CodeMirror-Modus */
    edited TEXT NOT NULL        /* Spalte für Zeitstempel "last edited" */
);

INSERT INTO allcode (headline, description, code, loginname, format, cmmode, edited) VALUES ('Überschrift 0', 
'Dieser Code ist vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
'var imgWidth=285, imgHeight=233;
var xStart=Math.floor(imgWidth/2), yStart=Math.floor(imgHeight/2);
var x=xStart, y=yStart;

// CODE 0
function show() {
if(status==1) {
    document.getElementById("image").style.clip=
        "rect("+y+" "+(x+clipWidth)+" "+(y+clipHeight)+" "+x+")";

    x-=1;
    clipWidth+=2;
    y-=1;
    clipHeight+=2;',
    'admin',
    'javascript',
    'javascript',
    datetime('now'));