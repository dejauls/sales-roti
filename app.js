(() => {
  const PRICE_A = 4200;
  const PRICE_B = 4000;

  const $ = (id) => document.getElementById(id);
  const initialA = $("initialA");
  const initialB = $("initialB");
  const presetA = $("presetA");
  const presetB = $("presetB");
  const remainingA = $("remainingA");
  const remainingB = $("remainingB");
  const validationMessage = $("validationMessage");
  const copyMessage = $("copyMessage");

  const formatRupiah = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount).replace(/\u00a0/g, " ");

  const readInteger = (input) => {
    const value = Number(input.value);
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  };

  function applyPreset() {
    initialA.value = presetA.value;
    initialB.value = presetB.value;
    remainingA.value = 0;
    remainingB.value = 0;
    update();
  }

  // Samakan dropdown dengan input manual jika nilainya ada di daftar
  function syncPresets() {
    const a = String(readInteger(initialA));
    const b = String(readInteger(initialB));
    if ([...presetA.options].some((o) => o.value === a)) presetA.value = a;
    if ([...presetB.options].some((o) => o.value === b)) presetB.value = b;
  }

  function update() {
    const stockA = readInteger(initialA);
    const stockB = readInteger(initialB);
    const leftA = readInteger(remainingA);
    const leftB = readInteger(remainingB);

    initialA.value = stockA;
    initialB.value = stockB;
    remainingA.max = stockA;
    remainingB.max = stockB;

    $("stockALabel").textContent = `${stockA} pcs`;
    $("stockBLabel").textContent = `${stockB} pcs`;

    const invalidA = leftA > stockA;
    const invalidB = leftB > stockB;
    if (invalidA || invalidB) {
      validationMessage.textContent = invalidA && invalidB
        ? "Sisa Barang A dan B tidak boleh melebihi jumlah awal."
        : invalidA
          ? `Sisa Barang A tidak boleh lebih dari ${stockA} pcs.`
          : `Sisa Barang B tidak boleh lebih dari ${stockB} pcs.`;
      validationMessage.classList.remove("hidden");
    } else {
      validationMessage.textContent = "";
      validationMessage.classList.add("hidden");
    }

    const soldA = invalidA ? 0 : stockA - leftA;
    const soldB = invalidB ? 0 : stockB - leftB;
    const revenueA = soldA * PRICE_A;
    const revenueB = soldB * PRICE_B;
    const totalInitial = stockA + stockB;
    const totalSold = soldA + soldB;
    const totalRevenue = revenueA + revenueB;

    $("soldALabel").textContent = `Terjual: ${soldA} pcs`;
    $("soldBLabel").textContent = `Terjual: ${soldB} pcs`;
    $("totalResult").textContent = formatRupiah(totalRevenue);
    $("totalInitial").textContent = `${totalInitial} pcs`;
    $("totalSold").textContent = `${totalSold} pcs`;
    $("revenueA").textContent = formatRupiah(revenueA);
    $("revenueB").textContent = formatRupiah(revenueB);

    return { stockA, stockB, leftA, leftB, soldA, soldB, revenueA, revenueB, totalRevenue, totalInitial, totalSold, invalidA, invalidB };
  }

  [presetA, presetB].forEach((select) => {
    select.addEventListener("change", applyPreset);
  });

  [initialA, initialB].forEach((input) => {
    input.addEventListener("input", () => {
      const a = readInteger(initialA);
      const b = readInteger(initialB);
      if (readInteger(remainingA) > a) remainingA.value = a;
      if (readInteger(remainingB) > b) remainingB.value = b;
      syncPresets();
      update();
    });
  });

  [remainingA, remainingB].forEach((input) => {
    input.addEventListener("input", () => {
      copyMessage.textContent = "";
      update();
    });
  });

  $("resetButton").addEventListener("click", () => {
    remainingA.value = 0;
    remainingB.value = 0;
    copyMessage.textContent = "";
    update();
  });

  $("shareButton").addEventListener("click", async () => {
    const result = update();
    if (result.invalidA || result.invalidB) {
      copyMessage.textContent = "Periksa jumlah sisa barang terlebih dahulu.";
      return;
    }
    const summary = [
      "Ringkasan Penjualan",
      `Barang A: awal ${result.stockA}, sisa ${result.leftA}, terjual ${result.soldA} (${formatRupiah(result.revenueA)})`,
      `Barang B: awal ${result.stockB}, sisa ${result.leftB}, terjual ${result.soldB} (${formatRupiah(result.revenueB)})`,
      `Total terjual: ${result.totalSold} pcs`,
      `Total penjualan: ${formatRupiah(result.totalRevenue)}`
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      copyMessage.textContent = "Ringkasan berhasil disalin.";
    } catch {
      copyMessage.textContent = summary;
    }
  });

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((error) => {
        console.warn("Service worker gagal didaftarkan:", error);
      });
    });
  }

  update();
})();