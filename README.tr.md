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

### Eski ve büyük <font color="red">**node_modules**</font> klasörlerini kolayca bulun ve **silin** :sparkles:

<p align="center">
  <img src="/docs/npkill-demo-0.10.0.gif" alt="npkill demo GIF" />
</p>

Bu araç, sisteminizdeki tüm _node_modules_ dizinlerini ve kapladıkları alanı listelemenizi sağlar. Daha sonra, hangilerini silmek istediğinizi seçerek yer açabilirsiniz. Yaşasın!

## i18n

Npkill dokümantasyonunu uluslararası hale getirmek için çaba gösteriyoruz. İşte mevcut çevirilerin listesi:

- [Endonezce](./README.id.md)
- [İspanyolca](./README.es.md)
- [Portekizce](./README.pt.md)
- [Türkçe](./README.tr.md)

## İçindekiler

- [Özellikler](#features)
- [Kurulum](#installation)
- [Kullanım](#usage)
  - [Seçenekler](#options)
  - [Örnekler](#examples)
- [Yerel Kurulum](#setup-locally)
- [Yol Haritası](#roadmap)
- [Bilinen Hatalar](#known-bugs)
- [Katkıda Bulunma](#contributing)
- [Kahve Ismarlayın](#donations)
- [Lisans](#license)

<a name="features"></a>

# :heavy_check_mark: Özellikler

- **Alan Açın:** Makinenizde birikmiş, eski ve tozlu _node_modules_ klasörlerinden kurtulun.

- **Son Çalışma Alanı Kullanımı**: Çalışma alanındaki bir dosyayı en son ne zaman değiştirdiğinizi kontrol edin (bu, **last_mod** sütununda gösterilir).

- **Çok Hızlı:** NPKILL TypeScript ile yazılmıştır, ancak aramalar düşük seviyede gerçekleştirilerek performans büyük ölçüde artırılır.

- **Kullanımı Kolay:** Uzun komutlara elveda deyin. NPKILL kullanmak, node_modules listenizi okumak ve silmek için Del tuşuna basmak kadar basittir. Daha kolay olabilir mi? ;)

- **Düşük Bağımlılık:** Hiçbir bağımlılığı yok denecek kadar az.

<a name="installation"></a>

# :cloud: Kurulum

Kullanmak için gerçekten yüklemenize gerek yok!
Basitçe aşağıdaki komutu kullanabilirsiniz:

```bash
$ npx npkill
```

Ya da herhangi bir nedenle gerçekten yüklemek isterseniz:

```bash
$ npm i -g npkill
# Unix kullanıcılarının komutu sudo ile çalıştırması gerekebilir. Dikkatli olun.
```

> NPKILL, Node 14’ten düşük sürümleri desteklemiyor. Eğer bu durum sizi etkiliyorsa, `npkill@0.8.3` sürümünü kullanabilirsiniz.

<a name="usage"></a>

# :clipboard: Kullanım

```bash
$ npx npkill
# Ya da global olarak yüklüyse sadece npkill kullanabilirsiniz.
```

Varsayılan olarak, npkill `npkill` komutunun çalıştırıldığı dizinden başlayarak node_modules klasörlerini tarar.

Listelenen klasörler arasında <kbd>↓</kbd> ve <kbd>↑</kbd> tuşlarıyla gezinebilir, seçili klasörü silmek için <kbd>Space</kbd> veya <kbd>Del</kbd> tuşlarını kullanabilirsiniz.
Ayrıca sonuçlar arasında gezinmek için <kbd>j</kbd> ve <kbd>k</kbd> tuşlarını da kullanabilirsiniz.

Seçili sonucun bulunduğu klasörü açmak için <kbd>o</kbd> tuşuna basabilirsiniz.

Çıkmak için, <kbd>Q</kbd> ya da <kbd>Ctrl</kbd> + <kbd>C</kbd>.

**Önemli!** Sisteme kurulu bazı uygulamaların çalışması için node_modules klasörüne ihtiyacı vardır ve bu klasörlerin silinmesi uygulamaların bozulmasına yol açabilir. NPKILL, dikkatli olmanız için bu klasörleri :warning: simgesiyle vurgulayacaktır.

<a name="options"></a>

## Seçenekler

| ARGÜMAN                          | AÇIKLAMA                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| -c, --bg-color                   | Satır vurgulama rengini değiştirin. _(Mevcut seçenekler: **mavi**, cam göbeği, eflatun, beyaz, kırmızı ve sarı)_                                 |
| -d, --directory                  | Aramaya başlanacak dizini ayarlayın. Varsayılan başlangıç noktası . olarak belirlenmiştir.                                                       |
| -D, --delete-all                 | Bulunan tüm node_modules klasörlerini otomatik olarak siler. `-x` ile birlikte kullanılması önerilir.                                            |
| -e, --hide-errors                | Varsa hataları gizler                                                                                                                            |
| -E, --exclude                    | Aramadan hariç tutulacak dizinleri belirtin (dizin listesi çift tırnak içinde "", dizinler virgülle ',' ayrılmalıdır). Örnek: "ignore1, ignore2" |
| -f, --full                       | Aramaya kullanıcının ev dizininden başlayın (örneğin Linux'ta "/home/user").                                                                     |
| -gb                              | Klasörleri Megabytes yerine Gigabytes olarak göster.                                                                                             |
| -h, --help, ?                    | Bu yardım sayfasını göster ve çık.                                                                                                               |
| -nu, --no-check-update           | Başlangıçta güncellemeleri kontrol etme.                                                                                                         |
| -s, --sort                       | Sonuçları şu kriterlere göre sırala: `size`, `path` veya `last-mod`                                                                              |
| -t, --target                     | Aramak istediğiniz dizinlerin adını belirtin (varsayılan olarak node_modules).                                                                   |
| -x, --exclude-hidden-directories | Gizli dizinleri ("nokta" dizinleri) arama kapsamı dışında bırak.                                                                                 |
| --dry-run                        | Hiçbir şeyi silmez (rastgele bir gecikme ile simüle eder).                                                                                       |
| -v, --version                    | npkill sürümünü gösterir.                                                                                                                        |

**Uyarı:** _Gelecek sürümlerde bazı komutlar değişebilir_

<a name="examples"></a>

## Örnekler

- _projects_ dizininizdeki **node_modules** klasörlerini arayın:

```bash
npkill -d ~/projects

# diğer alternatif:
cd ~/projects
npkill
```

- "dist" adlı dizinleri listeleyin ve hata oluşursa gösterin.

```bash
npkill --target dist -e
```

- Mor renkli imleç gösterilir... çünkü moru seviyorum!

```bash
npkill --color magenta
```

- _projects_ dizininizdeki **vendor** klasörlerini listeleyin, boyuta göre sırala ve boyutları GB cinsinden göster:

```bash
npkill -d '~/more projects' -gb --sort size --target vendor
```

- _projects_ dizininizdeki **node_modules** klasörlerini listeleyin, ancak _progress_ ve _ignore-this_ dizinlerindeki klasörleri hariç tutun:

```bash
npkill -d 'projects' --exclude "progress, ignore-this"
```

- Yedeklerinize gizlice karışmış tüm node_modules klasörlerini otomatik olarak silin:

```bash
npkill -d ~/backups/ --delete-all
```

<a name="setup-locally"></a>

# :pager: Yerel Kurulum

```bash
# -- Öncelikle, repoyu klonlayın.
git clone https://github.com/voidcosmos/npkill.git

# -- Dizin içine gidin
cd npkill

# -- Bağımlılıkları yükleyin
npm install

# -- Ve çalıştırın!
npm run start


# -- Eğer bazı parametrelerle çalıştırmak istiyorsanız, aşağıdaki örnekte olduğu gibi "--" eklemeniz gerekir:
npm run start -- -f -e
```

<a name="roadmap"></a>

# :crystal_ball: Yol Haritası

- [x] 0.1.0 yayınla!
- [x] Kodu geliştir
  - [x] Performansı iyileştir
  - [ ] Performansı daha da iyileştir!
- [x] Sonuçları boyuta ve yola göre sırala
- [x] Diğer türde dizinlerin (hedeflerin) aranmasına izin ver
- [ ] Daha minimalist bir modül olması için bağımlılıkları azalt
- [ ] Belirli bir süredir kullanılmayan dizinlere göre filtreleme yapmaya izin ver
- [ ] Dizinleri ağaç biçiminde göstermek için bir seçenek oluştur
- [x] Bazı menüler ekle
- [x] Log servisi ekle
- [ ] Periyodik ve otomatik temizlik (?)

<a name="known-bugs"></a>

# :bug: Bilinen Hatalar :bug:

- Bazen klasör silinirken CLI kilitlenebilir.
- TTY kullanmayan bazı terminaller (örneğin Windows’taki Git Bash) çalışmaz.
- Özellikle yol (path) bazında sıralama, çok sayıda olduğunda terminali yavaşlatabilir.
- Bazen, boyut hesaplamaları olması gerekenden daha yüksek çıkabilir.
- (ÇÖZÜLDÜ) Yüksek seviyeli dizinlerden (örneğin Linux'taki / dizini) arama yaparken performans sorunları yaşanabilir.
- (ÇÖZÜLDÜ) Bazen CLI güncellenirken metinler bozuluyor.
- (ÇÖZÜLDÜ) Dizinlerin boyutunu analiz etmek olması gerekenden daha uzun sürüyor.

> Eğer herhangi bir hata bulursanız, çekinmeden bir issue açın :)

<a name="contributing"></a>

# :revolving_hearts: Katkıda Bulunma

Katkıda bulunmak isterseniz [CONTRIBUTING.md](.github/CONTRIBUTING.md) dosyasını inceleyin.

<a name="donations"></a>

# :coffee: Bize bir kahve ısmarlayın

<img align="right" width="300" src="https://npkill.js.org/img/cat-donation-cup.png">
Boş zamanlarımızda, programlama sektörüne olan tutkumuz nedeniyle npkill'i geliştirdik.
Gelecekte, tamamen buna odaklanmak istiyoruz ama önümüzde uzun bir yol var.

Yine de işlerimizi yapmaya devam edeceğiz, ancak bağışlar yaptığımız işi desteklemenin birçok yolundan sadece biridir.

<span class="badge-opencollective"><a href="https://opencollective.com/npkill/contribute" title="Donate to this project using Open Collective"><img src="https://img.shields.io/badge/open%20collective-donate-green.svg" alt="Open Collective donate button" /></a></span>

### Teşekkürler!!

## Destekçilerimize kocaman teşekkürler :heart:

<a href="https://opencollective.com/npkill#backers" target="_blank"><img width="535" src="https://opencollective.com/npkill/tiers/backer.svg?width=535"></a>

---

### Kripto alternatifi

- btc: 1ML2DihUoFTqhoQnrWy4WLxKbVYkUXpMAX
- bch: 1HVpaicQL5jWKkbChgPf6cvkH8nyktVnVk
- eth: 0x7668e86c8bdb52034606db5aa0d2d4d73a0d4259

<a name="license"></a>

# :scroll: Lisans

MIT © [Nya García Gallardo](https://github.com/NyaGarcia) and [Juan Torres Gómez](https://github.com/zaldih)

:cat::baby_chick:

---
