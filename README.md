# Firebase Studio

Questo è uno starter NextJS in Firebase Studio.

Per iniziare, dai un'occhiata a src/app/page.tsx.

## Distribuzione

Per pubblicare il tuo progetto Next.js sul tuo dominio `schuco.finestreleonardo.it`, di solito seguirai questi passaggi:

1.  **Build del Progetto:**
    Innanzitutto, devi creare una build di produzione della tua applicazione. Esegui il seguente comando nella directory principale del tuo progetto:
    ```bash
    npm run build
    ```
    Questo comando creerà una build ottimizzata della tua applicazione nella cartella `.next`.

2.  **Scegli un Provider di Hosting:**
    Esistono molti provider di hosting che supportano le applicazioni Next.js. Alcune scelte popolari includono:
    *   **Vercel:** (Consigliato da Next.js) Vercel offre una distribuzione fluida per le app Next.js, con funzionalità come build automatiche, CDN globale e funzioni serverless. Spesso puoi collegare il tuo repository Git per la distribuzione continua.
    *   **Firebase Hosting:** Se stai già utilizzando i servizi Firebase, Firebase Hosting può essere una buona opzione. Dovrai configurarlo per servire la tua applicazione Next.js (spesso distribuendo le parti lato server su Cloud Functions o Cloud Run, con asset statici su Hosting).
    *   **Netlify:** Simile a Vercel, Netlify offre un solido supporto per Next.js.
    *   **AWS Amplify:** Fornisce una soluzione full-stack per la distribuzione di app Web e mobili.
    *   **Altri Provider Cloud:** (Google Cloud, Azure, ecc.) Puoi distribuire su macchine virtuali o servizi container, ma questo di solito richiede una configurazione manuale maggiore.

3.  **Distribuisci la Tua Applicazione:**
    Segui le istruzioni specifiche fornite dal provider di hosting scelto per distribuire l'applicazione compilata (generalmente i contenuti della cartella `.next`, della cartella `public` e i file relativi a `package.json`).

4.  **Configura il Tuo Dominio Personalizzato:**
    *   Una volta che la tua applicazione è distribuita e accessibile tramite un URL fornito dal tuo host, puoi puntare il tuo dominio personalizzato `schuco.finestreleonardo.it` ad essa.
    *   Questo di solito comporta:
        *   Aggiungere il tuo dominio personalizzato (`schuco.finestreleonardo.it`) nel pannello di controllo del tuo provider di hosting.
        *   Aggiornare i record DNS (come record A, CNAME o ALIAS) con il tuo registrar di domini (dove hai acquistato il tuo dominio) per puntare all'indirizzo IP o al nome host fornito dal tuo servizio di hosting.
    *   Le modifiche DNS possono richiedere del tempo per propagarsi a livello globale (da pochi minuti a 48 ore).

5.  **Certificato SSL:**
    La maggior parte dei moderni provider di hosting fornirà e rinnoverà automaticamente i certificati SSL/TLS per il tuo dominio personalizzato, abilitando HTTPS.

**Ulteriori Letture:**
*   [Documentazione sulla Distribuzione di Next.js](https://nextjs.org/docs/deployment)

Ricorda di consultare la documentazione del provider di hosting scelto per istruzioni dettagliate sulla distribuzione di applicazioni Next.js e sulla configurazione di domini personalizzati.
