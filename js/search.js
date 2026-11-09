(function() {
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
  }

  // Same markup as a card on the home page (_layouts/home.html).
  function renderCard(item) {
    return '<article class="mk-card"><a class="mk-card-link" href="' + escapeHtml(item.url) + '">' +
      (item.banner ? '<img class="mk-card-thumb" src="' + escapeHtml(item.banner) + '" alt="" loading="lazy">' : '') +
      '<span><span class="mk-card-meta">' +
      (item.kind ? '<span class="mk-card-kind">' + escapeHtml(item.kind) + '</span>' : '') +
      escapeHtml(item.date) +
      '</span><h2>' + item.title + '</h2>' +
      '<p>' + escapeHtml(item.excerpt) + '</p></span></a></article>';
  }

  function displaySearchResults(results, store, searchTerm) {
    var searchResults = document.getElementById('search-results');

    if (results.length) {
      searchResults.innerHTML = results.map(function(result) {
        return renderCard(store[result.ref]);
      }).join('');
    } else {
      searchResults.innerHTML = '<p class="mk-empty">No posts match “' + escapeHtml(searchTerm) + '”.</p>';
    }
  }

  function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');

    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');

      if (pair[0] === variable && pair[1] !== undefined) {
        return decodeURIComponent(pair[1].replace(/\+/g, '%20'));
      }
    }
  }

  var searchTerm = getQueryVariable('query');

  if (searchTerm) {
    document.getElementById('search-box').setAttribute('value', searchTerm);

    // Title matches are boosted so they rank above passing mentions in a post body.
    var idx = lunr(function () {
      this.field('id');
      this.field('title', { boost: 10 });
      this.field('author');
      this.field('category');
      this.field('content');
    });

    for (var key in window.store) {
      idx.add({
        'id': key,
        'title': window.store[key].title,
        'author': window.store[key].author,
        'category': window.store[key].category,
        'content': window.store[key].content
      });
    }

    displaySearchResults(idx.search(searchTerm), window.store, searchTerm);
  } else {
    document.getElementById('search-box').focus();
  }
})();
