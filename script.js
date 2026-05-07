$(function () {
  let offset = { x: 20, y: 20 };

  const list = document.querySelector(".list ul");
  const loadError = document.getElementById("load-error");
  const csvPaths = ["data/theses.csv", "./data/theses.csv"];
  let original = [];

  function isMobile() {
    return window.innerWidth <= 1200;
  }

  function normalizeKey(value) {
    return value.trim().toLowerCase().replace(/\s+/g, "-");
  }

  function fetchCsv() {
    const urls = csvPaths.map((path) => new URL(path, document.baseURI).href);
    return urls
      .reduce((promise, url) => {
        return promise.catch(() =>
          fetch(url).then((response) => {
            if (!response.ok)
              throw new Error(`Fetch failed (${response.status}) ${url}`);
            return response.text();
          }),
        );
      }, Promise.reject())
      .catch((error) => {
        console.error("CSV load attempts failed:", { urls, error });
        if (loadError) {
          loadError.style.display = "block";
        }
        throw error;
      });
  }

  function createThesisItem(row) {
    const item = document.createElement("li");
    item.className = "hover-item";

    const fullName = `${row["first-name"] || ""} ${row.surname || ""}`.trim();
    item.dataset.name = row.surname || "";
    item.dataset.title = row.title || "";
    item.dataset.img = row.image || "";

    const itemMain = document.createElement("div");
    itemMain.className = "item-main";

    const nameSpan = document.createElement("span");
    nameSpan.className = "name";
    nameSpan.textContent = fullName;

    const titleSpan = document.createElement("span");
    titleSpan.className = "title";
    titleSpan.textContent = row.title || "";

    itemMain.appendChild(nameSpan);
    itemMain.appendChild(titleSpan);

    const itemDetail = document.createElement("div");
    itemDetail.className = "item-detail";

    const link = document.createElement("a");
    link.className = "visit";
    link.href = row.hyperlink || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.innerHTML = "&nbsp;&#8599;&#65038;";

    const abstractWrap = document.createElement("div");
    abstractWrap.className = "abstract";
    const abstractParagraph = document.createElement("p");
    const fullAbstract = row.abstract || "";
    if (fullAbstract.length > 250) {
      const cut = fullAbstract.lastIndexOf(" ", 250);
      abstractParagraph.innerHTML = fullAbstract.slice(0, cut > 0 ? cut : 250);
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "…";
      abstractParagraph.appendChild(ellipsis);
    } else {
      abstractParagraph.innerHTML = fullAbstract;
    }
    abstractParagraph.appendChild(link);
    abstractWrap.appendChild(abstractParagraph);

    itemDetail.appendChild(abstractWrap);

    const galleryImg = document.createElement("div");
    galleryImg.className = "gallery-img";
    if (row.image) {
      const img = document.createElement("img");
      img.src = row.image;
      img.alt = fullName;
      galleryImg.appendChild(img);
    }

    item.dataset.href = row.hyperlink || "";

    item.appendChild(galleryImg);
    item.appendChild(itemMain);
    item.appendChild(itemDetail);

    return item;
  }

  function appendMobileThumbs() {
    document.querySelectorAll(".hover-item").forEach((item) => {
      if (item.querySelector(".mobile-thumb")) return;

      const imgSrc = item.dataset.img;
      if (!imgSrc) return;

      const thumb = document.createElement("span");
      thumb.className = "mobile-thumb";
      thumb.innerHTML = `<img src="${imgSrc}" alt="">`;

      item.appendChild(thumb);
    });
  }

  function render(arr) {
    list.innerHTML = "";
    arr.forEach((el) => list.appendChild(el));
  }

  function update() {
    const arr = [...original].sort((a, b) =>
      (a.dataset.name || "").localeCompare(b.dataset.name || ""),
    );
    $(".hover-item").removeClass("open");
    render(arr);
  }

  function loadCsvData() {
    return fetchCsv().then((csvText) => {
      const { data } = Papa.parse(csvText, {
        header: true,
        delimiter: ";",
        transformHeader: normalizeKey,
        skipEmptyLines: true,
      });
      original = data.map((record) => createThesisItem(record));
      update();
      //   appendMobileThumbs();
    });
  }

  loadCsvData().catch((error) => {
    console.warn("CSV load failed, keeping static list:", error);
    if (loadError) {
      loadError.style.display = "block";
    }
    original = Array.from(document.querySelectorAll(".hover-item"));
    appendMobileThumbs();
  });

  $("#info-toggle").on("click", function (e) {
    e.preventDefault();
    const isGallery = $(".page").toggleClass("gallery-view").hasClass("gallery-view");
    $(this).text(isGallery ? "List" : "Gallery");
  });

  $(document).on("mouseenter", ".hover-item", function () {
    if (isMobile()) return;

    if ($(".page").hasClass("gallery-view")) return;

    const imgSrc = $(this).data("img");
    if (!imgSrc) return;
    $(".cursor-preview")
      .html('<img src="' + imgSrc + '" alt="">')
      .show();
  });

  $(document).on("mouseleave", ".hover-item", function () {
    if (isMobile()) return;
    $(".cursor-preview").hide();
  });

  $(document).on("mousemove", function (e) {
    if (isMobile()) return;

    $(".cursor-preview").css({
      left: e.pageX + offset.x,
      top: e.pageY + offset.y,
    });
  });


  $(document).on("click", ".hover-item", function (e) {
    if ($(e.target).closest(".visit").length) return;
    const href = $(this).data("href");
    if (href) window.open(href, "_blank", "noopener,noreferrer");
  });

  $(window).on("resize", function () {
    if (isMobile()) {
      $(".cursor-preview").hide();
    }
  });
});
