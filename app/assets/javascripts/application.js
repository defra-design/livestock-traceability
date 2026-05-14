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
})
