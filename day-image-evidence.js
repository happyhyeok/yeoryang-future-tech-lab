(() => {
  "use strict";
  const MAX_BYTES = 3 * 1024 * 1024;
  const VALID_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
  const dayNames = { day06: "Day06 그림", day07: "Day07 그림" };
  let installed = false;
  let lastKey = "";
  let generation = 0;
  let inFlight = false;
  let loadFailed = false;

  function install({ root, getContext, request }) {
    if (installed) return;
    installed = true;
    const observer = new MutationObserver(() => ensure());
    observer.observe(root, { childList: true, subtree: false });
    root.addEventListener("click", event => {
      const button = event.target.closest("[data-day-image-button]");
      if (button && root.contains(button) && !inFlight) {
        if (loadFailed) {
          const ctx = current();
          if (ctx) load(ctx, lastKey);
          return;
        }
        root.querySelector("[data-day-image-file]")?.click();
      }
    });
    root.addEventListener("change", event => {
      if (!event.target.matches("[data-day-image-file]")) return;
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) save(file);
    });
    function getSlot() { return root.querySelector("[data-day-image-slot]"); }
    function current() {
      const ctx = getContext();
      if (!ctx || !dayNames[ctx.dayId] || !ctx.studentId || !ctx.workId) return null;
      return ctx;
    }
    function setStatus(message) {
      const slot = getSlot();
      const status = slot?.querySelector("[data-day-image-status]");
      if (status) status.textContent = message;
    }
    function readParams(ctx) {
      return { studentId: ctx.studentId, dayId: ctx.dayId,
        imageFetchNonce: `${Date.now()}_${Math.random().toString(36).slice(2)}` };
    }
    function show(asset) {
      const slot = getSlot();
      if (!slot) return;
      slot.dataset.fileId = asset?.storageFileId || "";
      const image = slot.querySelector("[data-day-image-preview]");
      const button = slot.querySelector("[data-day-image-button]");
      const url = asset?.storageFileId && /^[a-zA-Z0-9_-]{10,200}$/.test(asset.storageFileId)
        ? "https://drive.google.com/thumbnail?id=" + encodeURIComponent(asset.storageFileId) + "&sz=w1200" : "";
      image.onload = null;
      image.onerror = null;
      image.hidden = !url;
      image.removeAttribute("src");
      if (url) {
        image.onload = () => { if (getSlot() === slot && image.src === url) setStatus(""); };
        image.onerror = () => {
          if (getSlot() === slot && image.src === url) {
            image.hidden = true;
            setStatus("이미지를 표시하지 못했어요.");
          }
        };
        image.src = url;
      }
      button.textContent = asset ? "변경하기" : "등록";
      if (asset && !url) setStatus("이미지를 표시하지 못했어요.");
    }
    async function load(ctx, requestKey) {
      const button = getSlot()?.querySelector("[data-day-image-button]");
      if (button) button.disabled = true;
      setStatus("");
      try {
        const data = await request("getDayRecord", { method: "GET",
          params: readParams(ctx) });
        if (lastKey !== requestKey) return;
        const assetId = `asset_${ctx.studentId}_${ctx.dayId}_image`;
        const asset = (data.assets || []).find(a =>
          a.assetId === assetId && a.assetType === "screenshot" &&
          a.ownerId === ctx.studentId && a.dayId === ctx.dayId);
        show(asset);
        loadFailed = false;
        if (button) button.disabled = false;
      } catch (_) {
        if (lastKey === requestKey) {
          loadFailed = true;
          if (button) { button.textContent = "다시 시도"; button.disabled = false; }
          setStatus("이미지를 불러오지 못했어요.");
        }
      }
    }
    function ensure() {
      const ctx = current();
      if (!ctx) { lastKey = ""; return; }
      const key = ctx.studentId + ":" + ctx.workId + ":" + ctx.dayId;
      const slot = getSlot();
      if (key === lastKey && slot) return;
      generation++;
      lastKey = key;
      loadFailed = false;
      if (slot) slot.remove();
      const section = document.createElement("section");
      section.className = "lesson-section day-image-evidence";
      section.dataset.dayImageSlot = ctx.dayId;
      section.innerHTML = `<h2 class="section-title">${dayNames[ctx.dayId]}</h2>
        <img data-day-image-preview alt="내가 등록한 그림" hidden>
        <div><button type="button" class="secondary-button" data-day-image-button disabled>등록</button>
        <input type="file" data-day-image-file accept="image/png,image/jpeg,image/webp" hidden></div>
        <p class="day-image-status" data-day-image-status role="status" aria-live="polite"></p>`;
      root.appendChild(section);
      load(ctx, key);
    }
    async function save(file) {
      const ctx = current();
      if (!ctx || inFlight) return;
      if (!VALID_TYPES.has(file.type) || file.size > MAX_BYTES || file.size === 0) {
        setStatus("PNG·JPG·WEBP 이미지(3MB 이하)를 선택해 주세요.");
        return;
      }
      inFlight = true;
      const key = lastKey, savedGeneration = generation;
      const slot = getSlot(), button = slot?.querySelector("[data-day-image-button]");
      const previousFileId = slot?.dataset.fileId || "";
      if (button) button.disabled = true;
      setStatus("저장 중...");
      try {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
          reader.onerror = () => reject(new Error("파일을 읽지 못했어요."));
          reader.readAsDataURL(file);
        });
        if (lastKey !== key || generation !== savedGeneration) return;
        // Existing Web App uploadVideo action is reused as a compatibility entrypoint.
        const result = await request("uploadVideo", { timeoutMs: 60000, payload: {
          mediaKind: "image", studentId: ctx.studentId, workId: ctx.workId,
          dayId: ctx.dayId, assetId: `asset_${ctx.studentId}_${ctx.dayId}_image`,
          mimeType: file.type, base64Data, capturedAt: new Date().toISOString(),
        }});
        if (lastKey !== key || generation !== savedGeneration) return;
        const verified = await request("getDayRecord", { method: "GET",
          params: readParams(ctx) });
        if (lastKey !== key || generation !== savedGeneration) return;
        const asset = (verified.assets || []).find(a =>
          a.assetId === result.assetId && a.storageFileId === result.storageFileId &&
          a.ownerId === ctx.studentId && a.dayId === ctx.dayId);
        if (!asset) throw new Error("서버 저장 확인 실패");
        show(asset);
        setStatus("저장됨");
      } catch (error) {
        if (lastKey === key && generation === savedGeneration) {
          try {
            const data = await request("getDayRecord", { method: "GET", params: readParams(ctx) });
            if (lastKey === key && generation === savedGeneration) {
              const asset = (data.assets || []).find(a =>
                a.assetId === `asset_${ctx.studentId}_${ctx.dayId}_image` &&
                a.ownerId === ctx.studentId && a.dayId === ctx.dayId);
              if (asset && asset.storageFileId !== previousFileId) {
                show(asset);
                setStatus("저장됨");
              } else setStatus("저장하지 못했어요. 다시 시도해 주세요.");
            }
          } catch (_) {
            if (lastKey === key) setStatus("저장 상태를 확인하지 못했어요. 다시 시도해 주세요.");
          }
        }
        console.warn("day image save failed", error);
      } finally {
        inFlight = false;
        if (lastKey === key && getSlot()) {
          if (generation !== savedGeneration) await load(ctx, key);
          else getSlot().querySelector("[data-day-image-button]").disabled = false;
        }
      }
    }
    ensure();
  }
  window.DayImageEvidence = { install };
})();
