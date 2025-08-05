
        // Ensure the DOM is fully loaded before running the script
        window.onload = function() {
            const navItems = document.querySelectorAll('.nav-item');
            const pageSections = document.querySelectorAll('.page-section');

            /**
             * Shows the specified page and updates the active navigation item.
             * @param {string} pageId - The ID of the page section to show (e.g., 'home-page').
             */
            function showPage(pageId) {
                // Hide all page sections
                pageSections.forEach(section => {
                    section.classList.remove('active-page');
                });

                // Deactivate all navigation items
                navItems.forEach(item => {
                    item.classList.remove('active');
                });

                // Show the selected page and activate its corresponding nav item
                const targetPage = document.getElementById(pageId);
                if (targetPage) {
                    targetPage.classList.add('active-page');
                }

                // Find the nav item associated with the pageId and activate it
                const activeNavItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
                if (activeNavItem) {
                    activeNavItem.classList.add('active');
                }
            }

            // Add click event listeners to each navigation item
            navItems.forEach(item => {
                item.addEventListener('click', function() {
                    const pageId = this.dataset.page; // Get the page ID from the data-page attribute
                    if (pageId) {
                        showPage(pageId);
                    }
                });
            });

            // Set the initial page to 'home-page' when the application loads
            showPage('home-page');
        };
    