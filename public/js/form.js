/* JS-Funktionen für Formulare */
/* JS-Funktion um POST-Requests über Javascript abzuwickeln */


/* Registrierung: Button zeigen, wenn Nutzungsbedingungen akzeptiert */
/* modifiziert von: https://www.w3schools.com/howto/howto_js_toggle_hide_show.asp */
function showButton() {
    var button = document.getElementById("bHidden");
    if (button.style.display === "none") {
      button.style.display = "flex";
    }
  }

/* Registrierung: Button verstecken, wenn Nutzungsbedingungen nicht akzeptiert */
/* modifiziert von: https://www.w3schools.com/howto/howto_js_toggle_hide_show.asp */
  function hideButton() {
    var button = document.getElementById("bHidden");
    if (button.style.display === "flex") {
      button.style.display = "none";
    }
  }

  
/* Profil: Save-Button anzeigen, wenn Änderungen gemacht wurden. */
/* modifiziert von: https://www.w3schools.com/howto/howto_js_toggle_hide_show.asp */
  function showButtonSave(id) {
    var button = document.getElementById(`bHidden${id}`);
    if (button.style.display === "none") {
      button.style.display = "flex";
    }
  }


/* Formularfehleingaben sofort abfangen */
/* Code-Inspiration von https://www.mediaevent.de/javascript/formulare.html */

// Prüft, ob Email ein valides Dateiformat hat
  function checkEmail() {
      var email = document.getElementById("email");
      if (email.value.match(/^([a-zA-Z0-9_\.-]+)@([\da-zA-Z\.-]+)\.([a-zA-Z\.]{2,6})$/)) {
          email.setAttribute('style','border:solid; border-color:#33cc33');
          document.querySelector('.error-msg.email').setAttribute('style','display:none');
      } else {
          email.setAttribute('style','border:solid; border-color:red');
          document.querySelector('.error-msg.email').setAttribute('style','display:block');
      }
  }

// Prüft Namen auf korrektes Format

  function checkName() {
      let name = document.getElementById("loginname");
      if (name.value.match(/^[a-zA-Z0-9_]+([-.][a-zA-Z0-9_]+)*$/)) {
          name.setAttribute('style','border:solid; border-color:#33cc33');
          document.querySelector('.error-msg.loginname').setAttribute('style','display:none');
      } else {
          name.setAttribute('style','border:solid; border-color:red');
          document.querySelector('.error-msg.loginname').setAttribute('style','display:block');
      }
  }

// Prüft, ob Passwort lang genug ist.
  function checkPass() {
      var password1 = document.getElementById("password1");
      if ((password1.value.length) > 7) {
          password1.setAttribute('style','border:solid; border-color:#33cc33');
          document.querySelector('.error-msg.password1').setAttribute('style','display:none');
      } else {
          password1.setAttribute('style','border:solid; border-color:red');
          document.querySelector('.error-msg.password1').setAttribute('style','display:block');
      }
  }

// Prüft, ob Passwort-Wdh mit Passwort übereinstimmt
  function checkMatch() {
      var password1 = document.getElementById("password1");
      var password2 = document.getElementById("password2");
      if (password1.value == password2.value) {
          password2.setAttribute('style','border:solid; border-color:#33cc33');
          document.querySelector('.error-msg.password2').setAttribute('style','display:none');
      } else {
          password2.setAttribute('style','border:solid; border-color:red');
          document.querySelector('.error-msg.password2').setAttribute('style','display:block');
      }
  }


// Dynamisch <input>-Felder für ein Formular zum Submit erstellen
// Quelle: https://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
 /**
 * sends a request to the specified url from a form. this will change the window location.
 * @param {string} path the path to send the post request to
 * @param {object} params the paramiters to add to the url
 * @param {string} [method=post] the method to use on the form
 */

function post(path, params, method='post') {

  // The rest of this code assumes you are not using a library.
  // It can be made less wordy if you use one.
  const form = document.createElement('form');
  form.method = method;
  form.action = path;

  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const hiddenField = document.createElement('input');
      hiddenField.type = 'hidden';
      hiddenField.name = key;
      hiddenField.value = params[key];

      form.appendChild(hiddenField);
    }
  }

  document.body.appendChild(form);
  form.submit();
}

/* Lösch-Aktion bestätigen, sonst ausführen abfangen */
function confirmDelete(elementID){
  document.getElementById(elementID).onsubmit = function (evt) { 	
      var confirmDel = confirm("Wirklich löschen?\nKann nicht rückgängig gemacht werden!");
      if (confirmDel == false) {
          evt.preventDefault();
      }
  }
}

// Jetzigen Zeitpunkt erhalten YYYY-MM-DD HH:MM:SS

  // Mini-Funktion, um 0 darzustellen, falls Zeitangabe < 10 
  function displayZero(time) {
    if (time < 10) {
      time = "0" + time;
    }
    return time;
  }

  function timeStamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = displayZero(now.getMonth()+1);
    const day = displayZero(now.getDate());
    const hours = displayZero(now.getHours());
    const minutes = displayZero(now.getMinutes());
    const seconds = displayZero(now.getSeconds());
    const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return timestamp;
  }


/* Funktion wird im Profil aufgerufen und gibt einen String für die Sprache nach Format zurück*/
function getFormatName(format) {
  switch (format) {
    case "c":
      return "C";
    case "c++":
      return "C++";
    case "c#":
      return "C#";
    case "coffeescript":
      return "CoffeeScript";
    case "commonlisp":
      return "Common Lisp";
    case "css":
      return "CSS";
    case "django":
      return "Django";
    case "ejs":
      return "Embedded Javascript";
    case "html":
      return "HTML";
    case "http":
      return "HTTP";
    case "java":
      return "Java";
    case "javascript":
      return "JavaScript";
    case "julia":
      return "Julia";
    case "mathematica":
      return "Mathematica";
    case "mysql":
      return "MySQL";
    case "objectivec":
      return "Objective-C";
    case "objectivec++":
      return "Objective-C++";
    case "pascal":
      return "Pascal";
    case "perl":
      return "Perl";
    case "php":
      return "PHP";
    case "text":
      return "Plain Text";
    case "powershell":
      return "Power Shell";
    case "python":
      return "Python";
    case "r":
      return "R";
    case "ruby":
      return "Ruby";
    case "shell":
      return "Shell";
    case "spreadsheet":
      return "Spreadsheet";
    case "sql":
      return "SQL";
    case "sqlite":
      return "SQLite";
    case "swift":
      return "Swift";
    case "latex":
      return "LaTeX";
    case "typescript":
      return "TypeScript";
    case "vbnet":
      return "VB.NET";
    case "vbscript":
      return "VBScript";
    case "xml":
      return "XML";
    default:
      return "not defined";
  }    
}

/*
Darkmode-Toggle (Settings-Page)
*/

function changeDarkmode() {
  const theme = document.querySelector("#stylesheet-theme");
  if (document.getElementById("darkmode").checked == true) {
      document.getElementById("darkmode").setAttribute('value', 1);
      theme.href = "stylesheet-dark.css";
  } else {
      document.getElementById("darkmode").setAttribute('value', 0);
      theme.href = "stylesheet.css";
  }
}