<p align="center">
  <img src="https://npkill.js.org/img/npkill-text-outlined.svg" width="320" alt="npkill logo" />
  <img src="https://npkill.js.org/img/npkill-scope-mono.svg" width="50" alt="npkill logo scope" />
</p>
<p align="center">
<img alt="npm" src="https://img.shields.io/npm/dy/npkill.svg">
<a href="#donations"><img src="https://img.shields.io/badge/donate-<3-red" alt="Donations Badge"/></a>
<img alt="npm version" src="https://img.shields.io/npm/v/npkill.svg">
<img alt="NPM" src="https://img.shields.io/npm/l/npkill.svg">
</p>

### Mudah menemukan dan **menghapus** folder <font color="red">**node_modules**</font> yang lama dan berat :sparkles:

<p align="center">
  <img src="/docs/npkill-demo-0.10.0.gif" alt="npkill demo GIF" />
</p>

Alat ini memungkinkan Anda untuk mencantumkan semua direktori _node_modules_ di sistem Anda, serta ruang yang mereka gunakan. Anda kemudian dapat memilih mana yang ingin Anda hapus untuk mengosongkan ruang penyimpanan. Yay!

## i18n

Kami berusaha untuk menerjemahkan dokumen Npkill ke berbagai bahasa. Berikut daftar terjemahan yang tersedia:

- [Español](./README.es.md)
- [Indonesian](./README.id.md)

## Daftar Isi

- [Fitur](#features)
- [Instalasi](#installation)
- [Penggunaan](#usage)
  - [Opsi](#options)
  - [Contoh](#examples)
- [Pengaturan Lokal](#setup-locally)
- [Peta Jalan](#roadmap)
- [Bug yang Diketahui](#known-bugs)
- [Kontribusi](#contributing)
- [Buy us a coffee](#donations)
- [Lisensi](#license)

<a name="features"></a>

# :heavy_check_mark: Fitur

- **Bersihkan Ruang:** Hapus _node_modules_ lama yang tidak digunakan yang memenuhi mesin Anda.

- **Penggunaan Terakhir Workspace:** Cek kapan terakhir kali Anda mengubah file di workspace (ditunjukkan di kolom **last_mod**).

- **Sangat Cepat:** NPKILL ditulis dalam TypeScript, tetapi pencarian dilakukan di tingkat rendah, sehingga performanya sangat baik.

- **Mudah Digunakan:** Tidak perlu perintah panjang. Menggunakan npkill semudah membaca daftar _node_modules_ Anda, dan menekan tombol Del untuk menghapusnya. Bisa lebih mudah dari itu?

- **Ringkas:** Hampir tidak memiliki dependensi.

<a name="installation"></a>

# :cloud: Instalasi

Anda tidak perlu menginstal untuk menggunakannya! Cukup gunakan perintah berikut:

```bash
$ npx npkill
```

Atau jika Anda benar-benar ingin menginstalnya:

```bash
$ npm i -g npkill
# Pengguna Unix mungkin perlu menjalankan perintah dengan sudo. Gunakan dengan hati-hati
```

> NPKILL tidak mendukung node<v14. Jika ini memengaruhi Anda, gunakan `npkill@0.8.3`

<a name="usage"></a>

# :clipboard: Penggunaan

```bash
$ npx npkill
# atau cukup npkill jika telah diinstal secara global
```

Secara default, npkill akan memindai _node_modules_ mulai dari jalur tempat perintah `npkill` dijalankan.

Pindah di antara folder yang terdaftar menggunakan <kbd>↓</kbd> <kbd>↑</kbd>, dan gunakan <kbd>Space</kbd> atau <kbd>Del</kbd> untuk menghapus folder yang dipilih. Anda juga dapat menggunakan <kbd>j</kbd> dan <kbd>k</kbd> untuk bergerak di antara hasil.

Anda dapat membuka direktori tempat hasil yang dipilih berada dengan menekan <kbd>o</kbd>.

Untuk keluar, tekan <kbd>Q</kbd> atau <kbd>Ctrl</kbd> + <kbd>c</kbd> jika Anda pemberani.

**Penting!** Beberapa aplikasi yang diinstal di sistem membutuhkan direktori _node_modules_ untuk berfungsi, dan menghapusnya dapat menyebabkan kerusakan. NPKILL akan menandainya dengan :warning: agar berhati-hati.

<a name="options"></a>

## Opsi

| ARGUMEN                          | DESKRIPSI                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| -c, --bg-color                   | Ubah warna sorotan baris. _(Tersedia: **blue**, cyan, magenta, white, red, dan yellow)_                       |
| -d, --directory                  | Tetapkan direktori awal pencarian. Secara default, mulai dari .                                               |
| -D, --delete-all                 | Secara otomatis hapus semua folder _node_modules_ yang ditemukan. Disarankan digunakan bersama `-x`.          |
| -e, --hide-errors                | Sembunyikan kesalahan (jika ada)                                                                              |
| -E, --exclude                    | Kecualikan direktori dari pencarian. Daftar direktori harus dalam tanda kutip ganda "", dipisahkan dengan ',' |
| -f, --full                       | Mulai pencarian dari direktori home pengguna (contoh: "/home/user" di Linux)                                  |
| -gb                              | Tampilkan folder dalam Gigabyte daripada Megabyte.                                                            |
| -h, --help, ?                    | Tampilkan halaman bantuan ini dan keluar                                                                      |
| -nu, --no-check-update           | Jangan memeriksa pembaruan saat startup                                                                       |
| -s, --sort                       | Urutkan hasil berdasarkan: `size`, `path`, atau `last-mod`                                                    |
| -t, --target                     | Tentukan nama direktori yang ingin Anda cari (default: node_modules)                                          |
| -x, --exclude-hidden-directories | Kecualikan direktori tersembunyi dari pencarian.                                                              |
| --dry-run                        | Tidak menghapus apa pun (hanya simulasi dengan delay acak).                                                   |
| -v, --version                    | Tampilkan versi npkill                                                                                        |

**Peringatan:** _Di versi mendatang, beberapa perintah mungkin berubah._

<a name="examples"></a>

## Contoh

- Cari direktori **node_modules** di direktori _projects_ Anda:

```bash
npkill -d ~/projects

# alternatif lain:
cd ~/projects
npkill
```

- Daftar direktori bernama "dist" dan tampilkan kesalahan jika ada:

```bash
npkill --target dist -e
```

- Tampilkan kursor warna magenta... karena saya suka magenta!

```bash
npkill --color magenta
```

- Daftar direktori **vendor** di _projects_, urutkan berdasarkan ukuran, dan tampilkan ukuran dalam GB:

```bash
npkill -d '~/more projects' -gb --sort size --target vendor
```

- Secara otomatis hapus semua _node_modules_ di folder cadangan Anda:

```bash
npkill -d ~/backups/ --delete-all
```

<a name="setup-locally"></a>

# :pager: Pengaturan Lokal

```bash
# -- Pertama, kloning repositori
git clone https://github.com/voidcosmos/npkill.git

# -- Masuk ke direktori
cd npkill

# -- Instal dependensi
npm install

# -- Dan jalankan!
npm run start

# -- Jika ingin menjalankannya dengan parameter, tambahkan "--" seperti contoh berikut:
npm run start -- -f -e
```

<a name="roadmap"></a>

# :crystal_ball: Peta Jalan

- [x] Rilis versi 0.1.0!
- [x] Tingkatkan kode
  - [x] Tingkatkan performa
  - [ ] Tingkatkan performa lebih lanjut!
- [x] Urutkan hasil berdasarkan ukuran dan jalur
- [x] Izinkan pencarian untuk jenis direktori (target) lainnya
- [ ] Kurangi dependensi agar minimalis
- [ ] Filter berdasarkan waktu terakhir penggunaan
- [ ] Tampilkan direktori dalam format tree
- [x] Tambahkan beberapa menu
- [x] Tambahkan log
- [ ] Pembersihan otomatis berkala (?)

<a name="known-bugs"></a>

# :bug: Bug yang Diketahui :bug:

- CLI terkadang berhenti saat menghapus folder.
- Beberapa terminal tanpa TTY (seperti Git Bash di Windows) tidak bekerja.
- Mengurutkan berdasarkan jalur dapat memperlambat terminal dengan banyak hasil.
- Perhitungan ukuran kadang lebih besar dari seharusnya.
- (TERPECAHKAN) Masalah performa pada direktori tingkat tinggi (seperti / di Linux).
- (TERPECAHKAN) Teks terkadang kacau saat CLI diperbarui.
- (TERPECAHKAN) Analisis ukuran direktori memakan waktu lebih lama dari seharusnya.

> Jika menemukan bug, jangan ragu untuk membuka issue. :)

<a name="contributing"></a>

# :revolving_hearts: Kontribusi

Jika ingin berkontribusi, cek [CONTRIBUTING.md](.github/CONTRIBUTING.md).

<a name="donations"></a>

# :coffee: Buy us a coffee

<img align="right" width="300" src="https://npkill.js.org/img/cat-donation-cup.png">
Kami mengembangkan npkill di waktu luang karena kami mencintai pemrograman.

Kami akan terus mengerjakan ini, tetapi donasi adalah salah satu cara mendukung apa yang kami lakukan.

<span class="badge-opencollective"><a href="https://opencollective.com/npkill/contribute" title="Donate to this project using Open Collective"><img src="https://img.shields.io/badge/open%20collective-donate-green.svg" alt="Open Collective donate button" /></a></span>

### Terima Kasih!!

## Terima kasih banyak kepada pendukung kami :heart:

<a href="https://opencollective.com/npkill#backers" target="_blank"><img width="535" src="https://opencollective.com/npkill/tiers/backer.svg?width=535"></a>

---

### Alternatif Crypto

- btc: 1ML2DihUoFTqhoQnrWy4WLxKbVYkUXpMAX
- bch: 1HVpaicQL5jWKkbChgPf6cvkH8nyktVnVk
- eth: 0x7668e86c8bdb52034606db5aa0d2d4d73a0d4259

<a name="license"></a>

# :scroll: Lisensi

MIT © [Nya García Gallardo](https://github.com/NyaGarcia) dan [Juan Torres Gómez](https://github.com/zaldih)

:cat::baby_chick:

---
