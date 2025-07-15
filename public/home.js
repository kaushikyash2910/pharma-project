
  document.addEventListener("DOMContentLoaded", function () {
    const loginLink = document.getElementById("login-link");
    const userProfile = document.getElementById("user-profile");
    const userEmailSpan = document.getElementById("user-email");
    const profileInitial = document.getElementById("profile-initial");
    const logoutButton = document.getElementById("logout-button");
    const dropdownLogout = document.getElementById("dropdown-logout");
    const profileToggle = document.getElementById("profile-toggle");

    const user = JSON.parse(localStorage.getItem("user")); // stored in login script

    if (user && user.email) {
      loginLink.style.display = "none";
      userProfile.style.display = "flex";
      userEmailSpan.textContent = user.email;
      profileInitial.textContent = user.email[0].toUpperCase();
    } else {
      loginLink.style.display = "inline-block";
      userProfile.style.display = "none";
    }

    // Show/hide dropdown
    profileToggle.addEventListener("click", () => {
      dropdownLogout.style.display =
        dropdownLogout.style.display === "block" ? "none" : "block";
    });

    // Logout handler
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("user");
      location.reload(); // reload the page to reflect logout
    });
  });

