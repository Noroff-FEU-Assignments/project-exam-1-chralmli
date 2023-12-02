document.querySelector(".scroll-down-arrow").addEventListener("click", function(e) {
    e.preventDefault();
    const latestPostsSection = document.querySelector("#latest-posts");
    latestPostsSection.scrollIntoView({ behavior: "smooth" });
})

// Scroll event listener
window.addEventListener("scroll", function() {
    const scrollDownArrow = document.querySelector(".scroll-down-arrow");
    if (this.window.scrollY > 0) {
        // Hide arrow if user scrolls down
        scrollDownArrow.classList.add("hidden");
    } else {
        // Show arrow if user scrolls back to top
        scrollDownArrow.classList.remove("hidden");
    }
})