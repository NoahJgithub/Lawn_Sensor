const tabs = document.querySelectorAll(".tab");

tabs.forEach(tab => {
    tab.addEventListener("click", function () {

        // Remove active class from all tabs, then add it to the selected one
        tabs.forEach(t => t.classList.remove("active"));
        this.classList.add("active");

        // Hide all panels, then show the selected one
        document.querySelectorAll(".panel").forEach(panel => panel.style.display = "none");
        const selected = this.getAttribute("data-tab");
        document.getElementById(`panel-${selected}`).style.display = "block";

    });
});