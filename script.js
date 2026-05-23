// -------------------- DATA STORAGE --------------------

let stories =
JSON.parse(localStorage.getItem("stories"))
|| [];

// -------------------- SAVE STORIES --------------------

function saveStories(){

  localStorage.setItem(
    "stories",
    JSON.stringify(stories)
  );

}

// -------------------- ADD STORY --------------------

function addStory(){

  const title =
  document.getElementById("titleInput")
  .value
  .trim();

  const chapter =
  document.getElementById("chapterInput")
  .value;

  const status =
  document.getElementById("statusInput")
  .value;

  const link =
  document.getElementById("linkInput")
  .value
  .trim();

  const note =
  document.getElementById("noteInput")
  .value
  .trim();

  // -------------------- VALIDATE --------------------

  if(title === ""){

    alert("Nhập tên truyện trước đã nha!");

    return;
  }

  // -------------------- CREATE STORY OBJECT --------------------

  const newStory = {

    id: Date.now(),

    title: title,

    chapter: chapter || 0,

    status: status,

    link: link,

    note: note

  };

  // -------------------- PUSH DATA --------------------

  stories.push(newStory);

  saveStories();

  renderStories();

  clearForm();

}

// -------------------- CLEAR FORM --------------------

function clearForm(){

  document.getElementById("titleInput").value = "";

  document.getElementById("chapterInput").value = "";

  document.getElementById("statusInput").value =
  "Chưa đọc";

  document.getElementById("linkInput").value = "";

  document.getElementById("noteInput").value = "";

}

// -------------------- DELETE STORY --------------------

function deleteStory(id){

  const confirmDelete =
  confirm("Xóa truyện này nha?");

  if(!confirmDelete){

    return;
  }

  stories =
  stories.filter(
    story => story.id !== id
  );

  saveStories();

  renderStories();

}

// -------------------- RENDER STORIES --------------------

function renderStories(){

  const storyList =
  document.getElementById("storyList");

  const searchText =
  document.getElementById("searchInput")
  .value
  .toLowerCase();

  const filterStatus =
  document.getElementById("filterStatus")
  .value;

  storyList.innerHTML = "";

  // -------------------- FILTER DATA --------------------

  const filteredStories =
  stories.filter(story => {

    const matchSearch =
    story.title
    .toLowerCase()
    .includes(searchText);

    const matchStatus =
    filterStatus === "Tất cả"
    ||
    story.status === filterStatus;

    return matchSearch && matchStatus;

  });

  // -------------------- EMPTY STATE --------------------

  if(filteredStories.length === 0){

    storyList.innerHTML =
    "<p>Chưa có truyện nào.</p>";

    return;
  }

  // -------------------- RENDER CARD --------------------

  filteredStories.forEach(story => {

    const card =
    document.createElement("div");

    card.className = "story-card";

    card.innerHTML = `

      <h3>
        ${story.title}
      </h3>

      <p>
        <strong>Chapter:</strong>
        ${story.chapter}
      </p>

      <p>
        <strong>Trạng thái:</strong>
        ${story.status}
      </p>

      <p>
        <strong>Ghi chú:</strong>
        ${story.note || "Không có"}
      </p>

      <div class="story-actions">

        ${
          story.link
          ?
          `
          <a
            href="${story.link}"
            target="_blank"
          >
            Mở truyện
          </a>
          `
          :
          ""
        }

        <button
          onclick="deleteStory(${story.id})"
        >
          Xóa
        </button>

      </div>

    `;

    storyList.appendChild(card);

  });

}

// -------------------- INIT APP --------------------

renderStories();