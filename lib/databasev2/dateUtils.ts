/**
 * Utility murni untuk parsing tanggal & resolusi ISO week (termasuk kasus
 * cross-year seperti Week 1 Desember atau Week 52/53 Januari).
 * Tidak ada dependency ke DB — pure functions, gampang di-unit-test.
 */

export function parseDateLocal(dateVal: any): { year: number; month: number; day: number } {

  // Variabel sementara untuk menyimpan nilai jika input berupa string.
  let str: string | null = null;

  // ==============================
  // CASE 1 : Input berupa string
  // ==============================
  //
  // Contoh:
  // "2025-07-21"
  // "2025-07-21"
  //
  // Disimpan dulu agar nanti diparsing menggunakan regex.
  if (typeof dateVal === 'string') {
    str = dateVal;

  // ==============================
  // CASE 2 : Input berupa Date
  // ==============================
  //
  // Contoh:
  // new Date()
  // new Date("2025-07-21")
  //
  } else if (dateVal instanceof Date) {

    // Ambil jam UTC.
    //
    // Misal:
    // 2025-07-21
    // maka utcHour = 0
    //
    // 2025-07-21
    // maka utcHour = 15
    const utcHour = dateVal.getUTCHours();

    // Jika jam UTC masih sebelum jam 12 siang,
    // dianggap kemungkinan berasal dari tanggal lokal Indonesia
    // yang tersimpan sebagai UTC.
    //
    // Maka digeser +7 jam (WIB).
    if (utcHour < 12) {

      // Tambahkan 7 jam dalam milidetik.
      const wibMs = dateVal.getTime() + 7 * 60 * 60 * 1000;

      // Buat objek Date baru setelah digeser ke WIB.
      const wibDate = new Date(wibMs);

      // Ambil komponen tanggal setelah konversi.
      return {
        year:  wibDate.getUTCFullYear(),
        month: wibDate.getUTCMonth(),   // Januari = 0
        day:   wibDate.getUTCDate(),
      };
    }

    // Jika jam UTC sudah >= 12,
    // dianggap sudah aman sehingga tidak perlu dikonversi lagi.
    return {
      year:  dateVal.getUTCFullYear(),
      month: dateVal.getUTCMonth(),
      day:   dateVal.getUTCDate(),
    };
  }

  // ==============================
  // CASE 3 : Parsing String YYYY-MM-DD
  // ==============================
  //
  // Contoh:
  // "2025-08-06"
  //
  // Regex mengambil:
  // match[1] = tahun
  // match[2] = bulan
  // match[3] = tanggal
  if (str) {

    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
      return {
        year: parseInt(match[1]),

        // JavaScript menggunakan index bulan:
        // Januari = 0
        // Februari = 1
        // ...
        // Desember = 11
        month: parseInt(match[2]) - 1,

        day: parseInt(match[3]),
      };
    }
  }

  // ==============================
  // CASE 4 : Fallback
  // ==============================
  //
  // Jika input bukan string YYYY-MM-DD
  // maupun Date,
  // coba paksa menjadi objek Date.
  //
  // Contoh:
  // timestamp
  // ISO string lain
  // dll.
  const d = new Date(dateVal);

  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
  };
}

export function calcISOWeekYear(year: number, month: number, day: number): { week: number; isoYear: number } {
  const d      = new Date(Date.UTC(year, month, day));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const isoYear   = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week      = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, isoYear };
}

export function resolveWeekYear(record: any): { week: number; year: number } {

  // Ambil komponen tanggal (year, month, day) dari record.date.
  // parseDateLocal() akan menangani berbagai format input
  // (string, Date, timestamp, dll).
  const { year: rawYear, month, day } = parseDateLocal(record.date);

  // Ambil nomor minggu dari database dan pastikan bertipe number.
  const dbWeek = Number(record.week);

  // ==========================================================
  // CASE 1
  // ==========================================================
  // Jika tanggal berada di bulan Desember (month = 11)
  // tetapi nomor minggu = 1,
  //
  // berarti minggu tersebut sebenarnya adalah
  // Week 1 milik tahun berikutnya.
  //
  // Contoh:
  //
  // Tanggal : 2024-12-30
  // Week    : 1
  //
  // Menurut ISO:
  // Week 1 Tahun 2025
  //
  // Maka tahun ISO harus dinaikkan 1.
  if (month === 11 && dbWeek === 1) {
    return {
      week: 1,
      year: rawYear + 1,
    };
  }

  // ==========================================================
  // CASE 2
  // ==========================================================
  // Jika tanggal berada di bulan Januari (month = 0)
  // tetapi nomor minggu = 52 atau 53,
  //
  // berarti minggu tersebut masih termasuk
  // minggu terakhir tahun sebelumnya.
  //
  // Contoh:
  //
  // Tanggal : 2025-01-01
  // Week    : 53
  //
  // Menurut ISO:
  // Week 53 Tahun 2024
  //
  // Maka tahun ISO harus dikurangi 1.
  if (month === 0 && (dbWeek === 52 || dbWeek === 53)) {
    return {
      week: dbWeek,
      year: rawYear - 1,
    };
  }

  // ==========================================================
  // CASE 3
  // ==========================================================
  // Semua kondisi normal.
  //
  // Contoh:
  //
  // 2025-03-10 -> Week 11 Tahun 2025
  // 2025-07-15 -> Week 29 Tahun 2025
  //
  // Tidak perlu penyesuaian tahun ISO.
  return {
    week: dbWeek,
    year: rawYear,
  };
}

export function getCalendarYearsToFetch(isoYears: number[]): number[] {
  const calYears = new Set<number>();
  for (const isoYear of isoYears) {
    calYears.add(isoYear - 1);
    calYears.add(isoYear);
    calYears.add(isoYear + 1);
  }
  return Array.from(calYears).sort((a, b) => a - b);
}

// ─── ISO week → date range ────────────────────────────────────────────────────
export function isoWeekToDateRange(
  isoYear: number,
  weekStart: number,
  weekEnd: number,
): { startDate: Date; endDate: Date } {

  // Ambil tanggal 4 Januari pada ISO Year.
  // Menurut standar ISO-8601, Week 1 adalah minggu yang mengandung tanggal 4 Januari.
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));

  // Ambil hari dalam seminggu (UTC)
  // getUTCDay():
  //   0 = Minggu
  //   1 = Senin
  //   ...
  //   6 = Sabtu
  //
  // ISO menggunakan:
  //   1 = Senin
  //   ...
  //   7 = Minggu
  //
  // Maka jika hasilnya 0 (Minggu), ubah menjadi 7.
  const jan4Day = jan4.getUTCDay() || 7;

  // Salin objek Date agar jan4 tidak berubah.
  const mondayW1 = new Date(jan4);

  // Cari hari Senin pada ISO Week 1.
  //
  // Contoh:
  // jan4 = Kamis (4)
  //
  //  Sen Sel Rab Kam
  //   1   2   3   4
  //
  // Maka mundur 3 hari sehingga menjadi Senin.
  mondayW1.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));

  // Copy tanggal Senin Week 1.
  const startDate = new Date(mondayW1);

  // Geser ke minggu awal yang diminta.
  //
  // weekStart = 1 -> tetap di Senin Week 1
  // weekStart = 2 -> tambah 7 hari
  // weekStart = 3 -> tambah 14 hari
  startDate.setUTCDate(
    mondayW1.getUTCDate() + (weekStart - 1) * 7
  );

  // Copy lagi untuk menghitung tanggal akhir.
  const endDate = new Date(mondayW1);

  // Geser ke minggu akhir.
  //
  // (weekEnd - 1) * 7 -> menuju Senin pada weekEnd
  // +6                -> menjadi hari Minggu weekEnd
  // +3                -> diperpanjang 3 hari (buffer aplikasi, bukan aturan ISO)
  endDate.setUTCDate(
    mondayW1.getUTCDate() + (weekEnd - 1) * 7 + 6 + 3
  );

  // Mundurkan tanggal awal 3 hari.
  // Ini juga merupakan buffer aplikasi, bukan bagian dari standar ISO Week.
  startDate.setUTCDate(startDate.getUTCDate() - 3);

  // Debug hasil rentang tanggal.
  console.log(
    `\n isoWeekToDateRange: ISO ${isoYear} W${weekStart}-W${weekEnd}` +
    `\n ${startDate.toISOString().slice(0, 10)} .. ${endDate.toISOString().slice(0, 10)}`,
  );

  // Kembalikan rentang tanggal.
  return { startDate, endDate };
}