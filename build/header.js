// Get header title and image from body attributes
const body = document.body;
const headerTitle = body.getAttribute('data-header-title') || 'IBEC';
const headerImage = body.getAttribute('data-header-image') || 'images/header.jpg';
const showHr = body.getAttribute('data-header-hr') !== 'false';
const showSubtitle = body.getAttribute('data-header-subtitle') !== 'false';

document.write(`
<!-- Header -->
<div id="header" style="background-image: url('${headerImage}'); background-size: cover; background-position: center;">
    <!-- Inner -->
    <div class="inner">
        <header>
            <h1><a href="index.html" id="logo">${headerTitle}</a></h1>
            ${showHr ? '<hr />' : ''}
            ${showSubtitle ? '<p>University of Pennsylvania’s Premier Global Finance Club</p>' : ''}
        </header>
    </div>
    <!-- Nav -->
    <a href="index.html"><img src="images/logo.png" id="nav-logo"></a>
    <nav id="nav">
        <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="committees.html">Committees</a>
            </li>
            <li><a href="events.html">Events</a></li>
               <li class="dropdown">
                   <a href="#">Learn</a>
                   <ul>
                       <li><a href="wharton_survival.html">How to Survive Wharton</a></li>
                       <li><a href="podcast.html">Podcast</a></li>
                   </ul>
               </li>
            <li><a href="portfolio.html">Portfolio</a></li>
            <li><a href="contact.html">Contact Us</a></li>
        </ul>
    </nav>
</div>
<!-- Google Analytics -->
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TKBH48M3XP"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-TKBH48M3XP');
</script>
`);