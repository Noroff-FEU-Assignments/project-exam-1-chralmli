document.querySelector(".scroll-down-arrow").addEventListener("click", function(e) {
    e.preventDefault();
    const latestPostsSection = document.querySelector("#latest-posts");
    latestPostsSection.scrollIntoView({ behavior: "smooth" });
})