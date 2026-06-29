
// ===== EXTENDED MOCK DATA =====
(function() {
  var extraUsers = [
    {id:11, email:"francesco.blu@example.com", nome:"Francesco Blu", abbonamento:"Pro", status:"attivo", dataReg:"2024-11-01", password:"pass123"},
    {id:12, email:"chiara.verde@example.com", nome:"Chiara Verde", abbonamento:"Starter", status:"attivo", dataReg:"2024-11-15", password:"pass123"},
    {id:13, email:"alessandro.nero@example.com", nome:"Alessandro Nero", abbonamento:"Free", status:"attivo", dataReg:"2024-12-01", password:"pass123"},
    {id:14, email:"valentina.rossi@example.com", nome:"Valentina Rossi", abbonamento:"Business", status:"attivo", dataReg:"2024-12-05", password:"pass123"},
    {id:15, email:"giorgio.bianchi@example.com", nome:"Giorgio Bianchi", abbonamento:"Enterprise", status:"sospeso", dataReg:"2024-10-20", password:"pass123"},
    {id:16, email:"silvia.marrone@example.com", nome:"Silvia Marrone", abbonamento:"Basic", status:"attivo", dataReg:"2024-12-10", password:"pass123"},
    {id:17, email:"davide.oro@example.com", nome:"Davide Oro", abbonamento:"Lifetime", status:"attivo", dataReg:"2024-09-05", password:"pass123"},
    {id:18, email:"martina.argento@example.com", nome:"Martina Argento", abbonamento:"Business Lite", status:"attivo", dataReg:"2024-12-15", password:"pass123"},
    {id:19, email:"stefano.bronzo@example.com", nome:"Stefano Bronzo", abbonamento:"Pro", status:"bannato", dataReg:"2024-08-12", password:"pass123"},
    {id:20, email:"elisa.platino@example.com", nome:"Elisa Platino", abbonamento:"Free", status:"attivo", dataReg:"2024-12-20", password:"pass123"}
  ];
  extraUsers.forEach(function(u) {
    if (!utenti.find(function(ex){ return ex.id === u.id; })) { utenti.push(u); nextUserId = Math.max(nextUserId, u.id + 1); }
  });
  var extraAbb = [
    {utente:"Francesco Blu", piano:"Pro", inizio:"2024-11-01", scadenza:"2025-11-01", stato:"attivo", rinnovo:true},
    {utente:"Chiara Verde", piano:"Starter", inizio:"2024-11-15", scadenza:"2025-11-15", stato:"attivo", rinnovo:true},
    {utente:"Alessandro Nero", piano:"Free", inizio:"2024-12-01", scadenza:"2025-12-01", stato:"attivo", rinnovo:false},
    {utente:"Valentina Rossi", piano:"Business", inizio:"2024-12-05", scadenza:"2025-12-05", stato:"attivo", rinnovo:true},
    {utente:"Giorgio Bianchi", piano:"Enterprise", inizio:"2024-10-20", scadenza:"2025-10-20", stato:"sospeso", rinnovo:true},
    {utente:"Silvia Marrone", piano:"Basic", inizio:"2024-12-10", scadenza:"2025-12-10", stato:"attivo", rinnovo:true},
    {utente:"Davide Oro", piano:"Lifetime", inizio:"2024-09-05", scadenza:"2099-09-05", stato:"attivo", rinnovo:false}
  ];
  extraAbb.forEach(function(a) { if (!abbonamenti.find(function(ex){ return ex.utente === a.utente; })) abbonamenti.push(a); });
  for (var i = 0; i < 50; i++) {
    var uu = utenti[rand(0, utenti.length - 1)];
    transazioni.push({id: generateId(), utente: uu.email, importo: rand(5, 500) + 0.99, tipo: ["pagamento","pagamento","pagamento","rimborso","pagamento","reverse"][rand(0,5)], data: "2024-" + String(rand(1,12)).padStart(2,"0") + "-" + String(rand(1,28)).padStart(2,"0"), stato: ["completato","completato","completato","pending","fallito"][rand(0,4)], dettagli: "Extra tx " + (i+1)});
  }
  var extraTickets = [
    {id:4, utente:"francesco.blu@example.com", oggetto:"Richiesta assistenza fattura", priorita:"bassa", stato:"aperto", data:"2024-12-18", risposte:[]},
    {id:5, utente:"valentina.rossi@example.com", oggetto:"Problema accesso API", priorita:"critica", stato:"aperto", data:"2024-12-19", risposte:[]},
    {id:6, utente:"silvia.marrone@example.com", oggetto:"Downgrade piano", priorita:"media", stato:"in_lavorazione", data:"2024-12-17", risposte:[{admin:"Admin", testo:"Stiamo valutando", data:"2024-12-18"}]}
  ];
  extraTickets.forEach(function(t) { if (!ticketList.find(function(ex){ return ex.id === t.id; })) { ticketList.push(t); nextTicketId = Math.max(nextTicketId, t.id + 1); } });
  var extraFiles = [
    {id:9, nome:"manual_v3.pdf", dimensione:"3.1 MB", tipo:"pdf", data:"2024-12-18"},
    {id:10, nome:"logo_white.png", dimensione:"89 KB", tipo:"image", data:"2024-12-17"},
    {id:11, nome:"backup_2024_12_18.sql", dimensione:"52 MB", tipo:"sql", data:"2024-12-18"},
    {id:12, nome:"report_annuale_2024.pdf", dimensione:"5.7 MB", tipo:"pdf", data:"2024-12-20"}
  ];
  extraFiles.forEach(function(f) { if (!filesList.find(function(ex){ return ex.id === f.id; })) { filesList.push(f); nextFileId = Math.max(nextFileId, f.id + 1); } });
})();

