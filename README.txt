John Kyeremeh — portfolio site
==============================

Static HTML/CSS/JS. No build step, no dependencies. Open index.html, or serve
the folder:

    python3 -m http.server 8099

Deploys as-is on GitHub Pages: Settings -> Pages -> Deploy from a branch,
Branch: main, Folder: / (root). everything is plain static files and relative
paths, so it works under the /portfolio-website/ subdirectory.

Design language ported from certifiedg.ai: black stage, liquid-glass surfaces,
Instrument Serif italic display type, Barlow body copy. The work page follows
certifiedg.ai/work.html: a single 760px editorial column, floating pill nav,
colour-block case covers, and case details at work.html?project=<slug>.


Files
-----
index.html            Home: hero stage, capabilities, process, results, about.
work.html             Work: hero, four case studies, earlier work, track
                      record, contact. Case details are in the same file and
                      swap in over the list view via ?project=<slug>.
assets/css/site.css   Design system and every home page style.
assets/js/site.js     Home page behaviour. Progressive enhancement only.
assets/css/work.css   The work page's own stylesheet (self-contained: it does
                      not read site.css, apart from the shared type system).
assets/img/work/      Screenshots and deck slides used on the work page.
assets/deck/          Obie 500 Startups Demo Day pitch deck (PDF, embedded).

Project pages (same shell as a case detail view, linked from the "Earlier
work" section of work.html):

  mini-crm-with-marketing-feature.html   Mini CRM
  perfect-circle.html                    Perfect Circle
  ruta-health.html                       Ruta Health
  crypto-tracker.html                    CoinMarketCap tracker
  bug-tracker.html                       Bug Tracker
  real-time-chat-app.html                Realtime web chat
  reddit-clone.html                      Reddit clone
  pokemon-adventures.html                Pokemon CLI

bio.html is a redirect stub: its copy now lives in the About section on the
home page.

Every word of copy is real HTML, so the site reads and indexes with JavaScript
off. site.js only adds motion; the work page's only JS is the list/detail
switch, and every case is also reachable by URL.


Where to change things
----------------------
Copy          index.html — each section is a labelled HTML comment:
              HERO, CAPABILITIES, PROCESS, RESULTS, ABOUT, CTA, FOOTER.
              work.html — each case is an <article class="case">, and the
              matching detail view is <article class="detail"
              data-project="slug"> at the bottom of the same file.

Metrics       index.html, #results. Each metric is one .ticker-item. The track
              loops seamlessly by duplicating itself; author each item once.

Case studies  work.html. A case needs three pieces: an <article class="case">
              in #list-view, an <article class="detail" data-project="slug">
              in #detail-view, and a line in the `titles` map in the inline
              script at the bottom. Links use href="?project=<slug>".

              Charts are inline SVG (no library). The Clarity cohort chart
              carries its own x/y coordinate notes in comments; keep the
              gridline maths if you change the numbers.

Images        Drop a file in assets/img/work/ and point an <img src> at it.
              Case covers are CSS colour blocks (.cover--arternal and
              friends), not screenshots, so they cost nothing to load.

Portrait      Drop a photo at images/john-kyeremeh.jpg and it fills the About
              card on the home page. Until that file exists site.js removes
              the element and the JK monogram stands in.

Project pages The eight project pages share work.css and the same shell: nav,
              .detail wrapper, .d-section labels, .tag-list for the stack and
              .deck-btn for the links. They are plain HTML, edited in place.

Nav           Every page carries its own nav markup (index.html uses site.css,
              the rest use work.css). Change them together if you add a page.

Colours/type  assets/css/site.css and assets/css/work.css, :root at the top of
              each. Both pages use Instrument Serif + Barlow from Google Fonts.


History
-------
The site used to sit on the HTML5UP "Dimension" template. Every page has since
been rebuilt on the current design; assets/css/main.css, assets/js/jquery*.js
and the other HTML5UP scripts are no longer referenced by any page and can be
deleted. images/ still holds the screenshots those pages used (and that the
new work page pulls from), so leave it in place.
