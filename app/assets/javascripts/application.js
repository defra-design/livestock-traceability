//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {
  // MOJ Filter toggle functionality
  const filterButton = document.querySelector('[aria-controls="filter-panel"]')
  const filterPanel = document.querySelector('.moj-filter')
  const closeButton = document.querySelector('.moj-filter__close')

  if (filterButton && filterPanel) {
    filterButton.addEventListener('click', function() {
      const isExpanded = filterButton.getAttribute('aria-expanded') === 'true'
      filterButton.setAttribute('aria-expanded', !isExpanded)
      filterPanel.hidden = isExpanded
    })
  }

  if (closeButton && filterPanel && filterButton) {
    closeButton.addEventListener('click', function(e) {
      e.preventDefault()
      filterButton.setAttribute('aria-expanded', 'false')
      filterPanel.hidden = true
    })
  }

  // Tag entry selected count
  const tagTable = document.getElementById('tag-entry-table')
  const selectedCountEl = document.getElementById('tag-selected-count')

  if (tagTable && selectedCountEl) {
    function updateSelectedCount () {
      const checked = tagTable.querySelectorAll('input[type="checkbox"]:checked')
      selectedCountEl.textContent = checked.length
    }

    tagTable.addEventListener('change', updateSelectedCount)
  }
})
