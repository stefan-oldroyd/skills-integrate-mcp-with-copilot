document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const messageDiv = document.getElementById("message");

  // Helper to categorize activities
  function getCategory(name) {
    if (name.includes("Club")) return "Club";
    if (name.includes("Class")) return "Class";
    if (name.includes("Team")) return "Team";
    return "Other";
  }

  // Store activities globally for filtering
  // Hardcoded sample data for fallback if backend is unreachable
  let allActivities = {
    "Chess Club": {
      description: "Learn strategies and compete in chess tournaments",
      schedule: "Fridays, 3:30 PM - 5:00 PM",
      max_participants: 12,
      participants: ["michael@mergington.edu", "daniel@mergington.edu"]
    },
    "Programming Class": {
      description: "Learn programming fundamentals and build software projects",
      schedule: "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
      max_participants: 20,
      participants: ["emma@mergington.edu", "sophia@mergington.edu"]
    },
    "Art Club": {
      description: "Explore your creativity through painting and drawing",
      schedule: "Thursdays, 3:30 PM - 5:00 PM",
      max_participants: 15,
      participants: ["amelia@mergington.edu", "harper@mergington.edu"]
    },
    "Soccer Team": {
      description: "Join the school soccer team and compete in matches",
      schedule: "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
      max_participants: 22,
      participants: ["liam@mergington.edu", "noah@mergington.edu"]
    }
  };

  // Function to render activities with filters
  function renderActivities() {
    // Get filter values
    const search = document.getElementById("activity-search").value.toLowerCase();
    const category = document.getElementById("activity-category").value;
    const sort = document.getElementById("activity-sort").value;

    // Clear previous
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    // Filter and sort
    let filtered = Object.entries(allActivities)
      .filter(([name, details]) => {
        const matchesSearch =
          name.toLowerCase().includes(search) ||
          details.description.toLowerCase().includes(search);
        const matchesCategory =
          !category || getCategory(name) === category;
        return matchesSearch && matchesCategory;
      });

    if (sort === "name") {
      filtered.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sort === "spots") {
      filtered.sort((a, b) => {
        const spotsA = a[1].max_participants - a[1].participants.length;
        const spotsB = b[1].max_participants - b[1].participants.length;
        return spotsB - spotsA;
      });
    }

    // Populate activities list
    filtered.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      activityCard.setAttribute("tabindex", "0");
      activityCard.setAttribute("role", "region");
      activityCard.setAttribute("aria-label", `${name} activity card`);

      const spotsLeft = details.max_participants - details.participants.length;

      // Create participants HTML with delete icons instead of bullet points
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" aria-label="Remove ${email} from ${name}" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

      // Add register form directly to card
      const registerForm = `
        <form class="register-form" aria-label="Register for ${name}" autocomplete="off">
          <label for="register-email-${name}" class="visually-hidden">Student Email</label>
          <input type="email" id="register-email-${name}" name="email" required placeholder="your-email@mergington.edu" aria-label="Student Email for ${name}" />
          <button type="submit" class="register-btn" aria-label="Register for ${name}">Register Student</button>
        </form>
      `;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
        <div class="register-container">
          ${registerForm}
        </div>
      `;

      activitiesList.appendChild(activityCard);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
    // Add event listeners to register forms
    document.querySelectorAll(".register-form").forEach((form) => {
      form.addEventListener("submit", handleRegister);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (response.ok) {
        allActivities = await response.json();
      }
    } catch (error) {
      // If backend fails, use hardcoded data
      console.warn("Using hardcoded sample data for activities.");
    }
    renderActivities();
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }


  // Handle register form submission on each card
  async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const card = form.closest('.activity-card');
    const name = card.querySelector('h4').textContent;
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          name
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        emailInput.value = "";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  }

  // Add filter/search/sort event listeners
  document.getElementById("activity-search").addEventListener("input", renderActivities);
  document.getElementById("activity-category").addEventListener("change", renderActivities);
  document.getElementById("activity-sort").addEventListener("change", renderActivities);

  // Initialize app
  fetchActivities();
});
