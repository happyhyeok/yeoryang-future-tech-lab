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
  let loadSerial = 0;
  const DB_NAME = "futurelab-day-images";
  const STORE_NAME = "representatives";

  function openImageDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error("IndexedDB unavailable")); return; }
      const pending = indexedDB.open(DB_NAME, 1);
      pending.onupgradeneeded = () => pending.result.createObjectStore(STORE_NAME, { keyPath: "key" });
      pending.onsuccess = () => resolve(pending.result);
      pending.onerror = () => reject(pending.error || new Error("IndexedDB open failed"));
    });
  }
  async function imageStore(mode, operation) {
    const db = await openImageDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const request = operation(tx.objectStore(STORE_NAME));
        let result;
        request.onsuccess = () => { result = request.result; };
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
        tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted"));
      });
    } finally { db.close(); }
  }
  const imageKey = ctx => `${ctx.studentId}:${ctx.dayId}`;
  const getLocalImage = ctx => imageStore("readonly", store => store.get(imageKey(ctx)));
  const deleteLocalImage = ctx => imageStore("readwrite", store => store.delete(imageKey(ctx)));
  const putLocalImage = (ctx, file) => imageStore("readwrite", store => store.put({
    key: imageKey(ctx), studentId: ctx.studentId, workId: ctx.workId,
    dayId: ctx.dayId, blob: file, savedAt: Date.now(),
  }));
  function readImageDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error || new Error("Image read failed"));
      reader.readAsDataURL(blob);
    });
  }

  function install({ root, getContext, request }) {
    if (installed) return;
    installed = true;
    const observer = new MutationObserver(() => ensure());
    observer.observe(root, { childList: true, subtree: false });
    root.addEventListener("click", event => {
      const clear = event.target.closest("[data-day-image-clear]");
      if (clear && root.contains(clear) && !inFlight) {
        const ctx = current();
        if (ctx) clearLocal(ctx);
        return;
      }
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
    function showClearButton(visible) {
      const button = getSlot()?.querySelector("[data-day-image-clear]");
      if (button) button.hidden = !visible;
    }
    async function clearLocal(ctx) {
      const key = lastKey;
      try {
        await deleteLocalImage(ctx);
        if (lastKey !== key) return;
        show(null, "PENDING_REVIEW");
        showClearButton(false);
        setStatus("이 기기에 저장된 이미지가 없어요. 다른 PC나 브라우저 데이터 삭제 후에는 다시 보이지 않아요.");
      } catch (_) { if (lastKey === key) setStatus("이 기기 이미지를 삭제하지 못했어요."); }
    }
    function readParams(ctx) {
      return { studentId: ctx.studentId, dayId: ctx.dayId,
        imageFetchNonce: `${Date.now()}_${Math.random().toString(36).slice(2)}` };
    }
    function showLocalPreview(dataUrl) {
      const slot = getSlot();
      if (!slot) return;
      slot.dataset.fileId = "";
      const image = slot.querySelector("[data-day-image-preview]");
      image.onload = null;
      image.onerror = null;
      image.src = dataUrl;
      image.hidden = false;
      slot.querySelector("[data-day-image-button]").textContent = "변경하기";
    }
    function show(asset, reviewStatus = "NONE") {
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
      button.textContent = asset || reviewStatus !== "NONE" ? "변경하기" : "등록";
      if (asset && !url) setStatus("이미지를 표시하지 못했어요.");
      if (!asset && reviewStatus === "PENDING_REVIEW") setStatus("승인 대기");
      if (!asset && reviewStatus === "REJECTED") setStatus("게시 거부");
      if (!asset && reviewStatus === "REVOKED") setStatus("승인 철회");
    }
    async function load(ctx, requestKey) {
      const serial = ++loadSerial;
      const button = getSlot()?.querySelector("[data-day-image-button]");
      if (button) button.disabled = true;
      setStatus("");
      try {
        const data = await request("getDayRecord", { method: "GET",
          params: readParams(ctx) });
        if (lastKey !== requestKey || serial !== loadSerial || inFlight) return;
        const assetId = `asset_${ctx.studentId}_${ctx.dayId}_image`;
        const asset = (data.assets || []).find(a =>
          a.assetId === assetId && a.assetType === "screenshot" &&
          a.ownerId === ctx.studentId && a.dayId === ctx.dayId);
        const reviewStatus = data.imageReviewStatus || "NONE";
        if (reviewStatus === "PENDING_REVIEW") {
          let cached = null;
          try { cached = await getLocalImage(ctx); }
          catch (_) { /* The server state still loads when local storage is unavailable. */ }
          if (lastKey !== requestKey || serial !== loadSerial || inFlight) return;
          if (cached && cached.studentId === ctx.studentId && cached.workId === ctx.workId &&
              cached.dayId === ctx.dayId && cached.blob instanceof Blob &&
              VALID_TYPES.has(cached.blob.type) && cached.blob.size > 0 && cached.blob.size <= MAX_BYTES) {
            try {
              const dataUrl = await readImageDataUrl(cached.blob);
              if (lastKey !== requestKey || serial !== loadSerial || inFlight) return;
              showLocalPreview(dataUrl);
              showClearButton(true);
              setStatus("승인 대기 · 이 기기에 저장된 이미지");
            } catch (_) { show(null, reviewStatus); }
          } else {
            show(null, reviewStatus);
            showClearButton(false);
            setStatus("승인 대기 · 이 기기에 저장된 이미지가 없어요. 다른 PC나 브라우저 데이터 삭제 후에는 다시 보이지 않아요.");
          }
        } else {
          show(asset, reviewStatus);
          showClearButton(false);
          if (reviewStatus === "NONE" || reviewStatus === "REJECTED" || reviewStatus === "REVOKED") {
            try { await deleteLocalImage(ctx); } catch (_) { /* No cached image is displayed. */ }
          }
        }
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
        <button type="button" class="secondary-button" data-day-image-clear hidden>이 기기 이미지 삭제</button>
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
      loadSerial++;
      const key = lastKey, savedGeneration = generation;
      const slot = getSlot(), button = slot?.querySelector("[data-day-image-button]");
      const previousFileId = slot?.dataset.fileId || "";
      const previousImage = slot?.querySelector("[data-day-image-preview]");
      const previousView = { src: previousImage?.getAttribute("src") || "",
        hidden: previousImage?.hidden ?? true, button: button?.textContent || "등록" };
      function restorePreviousView() {
        if (getSlot() !== slot || !previousImage) return;
        previousImage.onload = null;
        previousImage.onerror = null;
        if (previousView.src) previousImage.src = previousView.src;
        else previousImage.removeAttribute("src");
        previousImage.hidden = previousView.hidden;
        slot.dataset.fileId = previousFileId;
        button.textContent = previousView.button;
      }
      if (button) button.disabled = true;
      setStatus("저장 중...");
      try {
        const dataUrl = await readImageDataUrl(file);
        if (lastKey !== key) return;
        const base64Data = dataUrl.split(",")[1] || "";
        showLocalPreview(dataUrl);
        // Existing Web App uploadVideo action is reused as a compatibility entrypoint.
        const result = await request("uploadVideo", { timeoutMs: 60000, payload: {
          mediaKind: "image", studentId: ctx.studentId, workId: ctx.workId,
          dayId: ctx.dayId, assetId: `asset_${ctx.studentId}_${ctx.dayId}_image`,
          mimeType: file.type, base64Data, capturedAt: new Date().toISOString(),
        }});
        if (lastKey !== key) return;
        const verified = await request("getDayRecord", { method: "GET",
          params: readParams(ctx) });
        if (lastKey !== key) return;
        const asset = (verified.assets || []).find(a =>
          a.assetId === result.assetId && a.ownerId === ctx.studentId && a.dayId === ctx.dayId);
        if (verified.imageReviewStatus === "PENDING_REVIEW") {
          showLocalPreview(dataUrl);
          let localSaved = false;
          try {
            await deleteLocalImage(ctx);
            await putLocalImage(ctx, file);
            localSaved = true;
          } catch (_) { /* Keep the successful server upload visible in this tab. */ }
          if (lastKey !== key) return;
          showClearButton(localSaved);
          setStatus(localSaved ? "승인 대기 · 이 기기에 저장된 이미지" :
            "서버에 저장됐어요. 이 기기에는 보관하지 못해 새로고침 후 보이지 않을 수 있어요.");
        } else if (asset && verified.imageReviewStatus === "APPROVED") {
          show(asset, "APPROVED");
          try { await deleteLocalImage(ctx); } catch (_) { /* Server image remains authoritative. */ }
          showClearButton(false);
          setStatus("저장됨");
        } else throw new Error("서버 저장 확인 실패");
      } catch (error) {
        if (lastKey === key && generation === savedGeneration) {
          try {
            const data = await request("getDayRecord", { method: "GET", params: readParams(ctx) });
            if (lastKey === key && generation === savedGeneration) {
              const asset = (data.assets || []).find(a =>
                a.assetId === `asset_${ctx.studentId}_${ctx.dayId}_image` &&
                a.ownerId === ctx.studentId && a.dayId === ctx.dayId);
              if (data.imageReviewStatus === "PENDING_REVIEW") {
                restorePreviousView();
                setStatus("저장 상태를 확인하지 못했어요. 다시 시도해 주세요.");
              } else if (asset && asset.storageFileId !== previousFileId) {
                show(asset, data.imageReviewStatus || "APPROVED");
                setStatus("저장됨");
              } else {
                restorePreviousView();
                setStatus("저장하지 못했어요. 다시 시도해 주세요.");
              }
            }
          } catch (_) {
            if (lastKey === key) {
              restorePreviousView();
              setStatus("저장 상태를 확인하지 못했어요. 다시 시도해 주세요.");
            }
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
